/**
 * KIARA — Google Apps Script backend
 * Puskesmas Kecamatan Cakung
 *
 * STRUKTUR SHEET (satu sheet, 13 kolom) — disediakan puskesmas:
 *
 *   1  No
 *   2  Date              dd-mm-yyyy
 *   3  Time              HH:mm:ss
 *   4  Nama
 *   5  NIK               disimpan apa adanya (16 digit)
 *   6  No WA
 *   7  Alamat
 *   8  Kelurahan
 *   9  Puskesmas
 *   10 Kunjungan ke-     1..TOTAL_SESI
 *   11 Pre-Test          0..100
 *   12 Post-Test         0..100, percobaan terakhir
 *   13 Status            LULUS / BELUM  (Post-Test >= KKM)
 *
 * Satu baris = satu kunjungan. Satu pasien bisa punya beberapa baris.
 * Nomor kunjungan berikutnya dihitung dari baris ber-NIK sama yang
 * nilainya paling besar di kolom "Kunjungan ke-".
 *
 * Endpoint (semua GET berparameter — POST ke Web App kena redirect 302
 * yang bikin CORS gagal di browser):
 *   ?action=lookup&nik=3175...
 *   ?action=save&nik=...&nama=...&...
 *
 * CARA DEPLOY
 *   1. Buka spreadsheet yang sudah dibuat → Extensions → Apps Script
 *   2. Tempel seluruh isi file ini, Save
 *   3. Run → cekSheet (sekali, beri izin) untuk memastikan header terbaca
 *   4. Deploy → New deployment → Web app
 *        Execute as     : Me
 *        Who has access : Anyone
 *   5. Salin Web app URL ke SHEETS_ENDPOINT di config.js
 *
 * Setiap file ini diubah: Deploy → Manage deployments → Edit → New version.
 *
 * ⚠️ PRIVASI — NIK disimpan mentah sesuai struktur yang diminta. Google
 *    Sheets hanya punya kontrol akses per-file dan tidak punya audit log
 *    yang layak. Bagikan spreadsheet ini HANYA ke akun bidan tertentu,
 *    jangan pernah pakai opsi "anyone with the link".
 */

/* Kolom (1-based) — supaya tidak ada angka ajaib berserakan. */
var K = {
  NO: 1, TANGGAL: 2, JAM: 3, NAMA: 4, NIK: 5, WA: 6, ALAMAT: 7,
  KELURAHAN: 8, PUSKESMAS: 9, KUNJUNGAN: 10, PRE: 11, POST: 12, STATUS: 13
};
var JML_KOLOM = 13;

/* Nama tab di spreadsheet "Rekap Hasil Kiara 2026".
   Dipatok, bukan memakai "sheet pertama", supaya menambah tab REKAP atau
   tab lain di sebelah kiri tidak membuat data masuk ke tab yang salah.
   Kosongkan ('') kalau ingin kembali memakai sheet pertama. */
var NAMA_SHEET = 'KIARA';

/* Header yang diharapkan di baris 1, urut kolom A–M. */
var HEADER_HARAPAN = [
  'No', 'Date', 'Time', 'Nama', 'NIK', 'No WA', 'Alamat',
  'Kelurahan', 'Puskesmas', 'Kunjungan ke-', 'Pre-Test', 'Post-Test', 'Status'
];

/* ══════════════════════════════════════════════════════════
   ENTRY POINT
   ══════════════════════════════════════════════════════════ */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';

    if (action === 'lookup') return json(handleLookup(p));
    if (action === 'save') return json(handleSave(p));

    return json({ ok: true, message: 'KIARA endpoint aktif', versi: 3, kolom: JML_KOLOM });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  return doGet(e);
}

/* ══════════════════════════════════════════════════════════
   SHEET
   ══════════════════════════════════════════════════════════ */

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = NAMA_SHEET ? ss.getSheetByName(NAMA_SHEET) : ss.getSheets()[0];
  if (!sh) throw new Error('Sheet tidak ditemukan: ' + NAMA_SHEET);
  return sh;
}

/** Samakan bentuk nama kolom: huruf kecil, buang spasi dan tanda baca. */
function kunciHeader(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Pastikan baris 1 benar-benar 13 kolom yang diharapkan.
 *
 * Ini penting karena kalau ada kolom disisipkan atau digeser di sheet,
 * tanpa pemeriksaan ini backend akan tetap menulis — masuk ke kolom yang
 * salah dan datanya berantakan tanpa ada yang sadar. Lebih baik gagal
 * dengan pesan jelas.
 *
 * @returns {string} '' kalau cocok, atau penjelasan ketidakcocokan
 */
function bedaHeader(sh) {
  var ada = sh.getRange(1, 1, 1, JML_KOLOM).getValues()[0];
  var salah = [];
  for (var i = 0; i < JML_KOLOM; i++) {
    if (kunciHeader(ada[i]) !== kunciHeader(HEADER_HARAPAN[i])) {
      salah.push('kolom ' + String.fromCharCode(65 + i) +
        ': harusnya "' + HEADER_HARAPAN[i] + '", terbaca "' + ada[i] + '"');
    }
  }
  return salah.join('; ');
}

/** Jalankan sekali dari editor untuk memastikan sheet dan header sudah benar. */
function cekSheet() {
  var sh = sheet();
  var header = sh.getRange(1, 1, 1, JML_KOLOM).getValues()[0];
  var beda = bedaHeader(sh);
  SpreadsheetApp.getUi().alert(
    'Spreadsheet : ' + SpreadsheetApp.getActiveSpreadsheet().getName() +
    '\nTab         : ' + sh.getName() +
    '\nBaris terisi: ' + sh.getLastRow() +
    '\n\nHeader terbaca:\n' + header.join(' | ') +
    '\n\n' + (beda ? 'TIDAK COCOK →\n' + beda.split('; ').join('\n') : 'Header sudah cocok.')
  );
}

/** Semua baris data (tanpa header). Array kosong kalau belum ada data. */
function ambilData(sh) {
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, JML_KOLOM).getValues();
}

/* ══════════════════════════════════════════════════════════
   LOOKUP — dipakai screen S3 (Konfirmasi)
   ══════════════════════════════════════════════════════════ */

function handleLookup(p) {
  var nik = bersihNik(p.nik);
  if (!nik) return { ok: false, error: 'nik kosong' };

  var data = ambilData(sheet());
  var riwayat = [];

  for (var i = 0; i < data.length; i++) {
    if (bersihNik(data[i][K.NIK - 1]) !== nik) continue;
    riwayat.push({
      baris: i + 2,
      kunjunganKe: Number(data[i][K.KUNJUNGAN - 1]) || 0,
      tanggal: teksTanggal(data[i][K.TANGGAL - 1]),
      skorPre: Number(data[i][K.PRE - 1]),
      skorPost: Number(data[i][K.POST - 1]),
      statusKkm: String(data[i][K.STATUS - 1] || '').trim()
    });
  }

  if (!riwayat.length) return { ok: true, baru: true, kunjungan: 1, riwayat: [] };

  riwayat.sort(function (a, b) { return a.kunjunganKe - b.kunjunganKe; });
  var akhir = riwayat[riwayat.length - 1];
  var barisAkhir = data[akhir.baris - 2];

  return {
    ok: true,
    baru: false,
    nama: barisAkhir[K.NAMA - 1],
    noHp: String(barisAkhir[K.WA - 1] || '').replace(/^'/, ''),
    alamat: barisAkhir[K.ALAMAT - 1],
    kelurahan: barisAkhir[K.KELURAHAN - 1],
    puskesmas: barisAkhir[K.PUSKESMAS - 1],
    // Nama field tetap kunjunganTerakhir supaya cocok dengan visit-tracker.js
    kunjunganTerakhir: akhir.kunjunganKe,
    tglKunjunganTerakhir: tanggalTerbaru(riwayat),
    status: akhir.kunjunganKe >= (Number(p.totalSesi) || 4) ? 'LULUS' : 'AKTIF',
    riwayat: riwayat,
    rataPost: rataPost(riwayat)
  };
}

/** Tanggal paling akhir dari seluruh riwayat, bukan sekadar kunjungan terbesar. */
function tanggalTerbaru(riwayat) {
  var maks = '';
  for (var i = 0; i < riwayat.length; i++) {
    var t = normalisasiIso(riwayat[i].tanggal);
    if (t > maks) maks = t;
  }
  return maks;
}

/* ══════════════════════════════════════════════════════════
   SAVE — tulis / perbarui satu kunjungan
   ══════════════════════════════════════════════════════════ */

function handleSave(p) {
  var nik = bersihNik(p.nik);
  var kunjungan = Number(p.kunjunganKe);
  if (!nik) return { ok: false, error: 'nik kosong' };
  if (!kunjungan || kunjungan < 1) return { ok: false, error: 'kunjungan tidak valid' };

  // Kunci supaya dua pasien yang submit bersamaan tidak menimpa baris.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'Server sibuk, coba lagi' };

  try {
    var sh = sheet();

    // Jangan pernah menulis kalau susunan kolom tidak sesuai.
    var beda = bedaHeader(sh);
    if (beda) return { ok: false, error: 'Susunan kolom sheet tidak sesuai — ' + beda };

    var data = ambilData(sh);

    var kkm = Number(p.kkm) || 75;
    var total = Number(p.totalSesi) || 4;
    var pre = Number(p.skorPre) || 0;
    var post = Number(p.skorPost) || 0;
    var status = post >= kkm ? 'LULUS' : 'BELUM';
    var allowUpdate = String(p.allowUpdate) === '1';

    // Cari baris dengan NIK + nomor kunjungan yang sama.
    var barisAda = -1;
    for (var i = 0; i < data.length; i++) {
      if (bersihNik(data[i][K.NIK - 1]) === nik &&
          Number(data[i][K.KUNJUNGAN - 1]) === kunjungan) {
        barisAda = i + 2;
        break;
      }
    }

    if (barisAda > 0 && !allowUpdate) return { ok: false, error: 'DUPLIKAT' };

    if (barisAda > 0) {
      // Post-test diulang → perbarui nilai akhir, jangan tambah baris.
      sh.getRange(barisAda, K.POST).setValue(post);
      sh.getRange(barisAda, K.STATUS).setValue(status);
      sh.getRange(barisAda, K.JAM).setValue("'" + jamJakarta());
    } else {
      sh.appendRow([
        nomorBerikut(sh),
        "'" + tanggalJakarta(),
        "'" + jamJakarta(),
        String(p.nama || ''),
        "'" + nik,
        "'" + String(p.noHp || ''),
        String(p.alamat || ''),
        String(p.kelurahan || ''),
        String(p.puskesmas || ''),
        kunjungan,
        pre,
        post,
        status
      ]);
    }

    var riwayat = handleLookup({ nik: nik, totalSesi: total }).riwayat || [];
    return {
      ok: true,
      statusKkm: status,
      delta: post - pre,
      rataPost: rataPost(riwayat),
      status: kunjungan >= total ? 'LULUS' : 'AKTIF'
    };
  } finally {
    lock.releaseLock();
  }
}

/** Nomor urut berikutnya di kolom "No". Dihitung dari nilai terbesar, bukan
    jumlah baris, supaya tetap benar kalau ada baris yang pernah dihapus. */
function nomorBerikut(sh) {
  var data = ambilData(sh);
  var maks = 0;
  for (var i = 0; i < data.length; i++) {
    var n = Number(data[i][K.NO - 1]);
    if (!isNaN(n) && n > maks) maks = n;
  }
  return maks + 1;
}

/* ══════════════════════════════════════════════════════════
   FUNGSI UJI — jalankan dari editor Apps Script

   Dipakai untuk memastikan sheet benar-benar bisa ditulis SEBELUM
   aplikasi disambungkan. Kalau ujiTulis() berhasil, berarti nama tab,
   susunan kolom, dan izin sudah benar — sisa masalah kalau ada pasti
   di sisi aplikasi, bukan di sheet.
   ══════════════════════════════════════════════════════════ */

var NIK_UJI = '9999999999999999';
var NAMA_UJI = 'UJI COBA - HAPUS';

/**
 * Tulis satu baris uji lewat jalur yang sama dengan aplikasi.
 * Sengaja memanggil handleSave(), bukan appendRow langsung, supaya
 * validasi header dan penguncian ikut teruji.
 */
function ujiTulis() {
  var hasil = handleSave({
    nik: NIK_UJI,
    nama: NAMA_UJI,
    noHp: '081200000000',
    alamat: 'Alamat uji coba',
    kelurahan: 'Pulo Gebang',
    puskesmas: 'Puskesmas Cakung',
    kunjunganKe: 1,
    skorPre: 40,
    skorPost: 90,
    kkm: 75,
    totalSesi: 4,
    allowUpdate: '1'
  });

  var sh = sheet();
  SpreadsheetApp.getUi().alert(
    hasil.ok
      ? 'BERHASIL — satu baris uji ditulis.\n\n' +
        'Tab          : ' + sh.getName() + '\n' +
        'Baris terisi : ' + sh.getLastRow() + '\n' +
        'Status       : ' + hasil.statusKkm + '\n' +
        'Rata-rata    : ' + hasil.rataPost + '\n\n' +
        'Periksa baris terakhir. Pastikan:\n' +
        '  • NIK utuh 16 digit (bukan 9,99999E+15)\n' +
        '  • No WA masih diawali 0\n' +
        '  • Tanggal berformat dd-mm-yyyy\n\n' +
        'Setelah itu jalankan hapusUji() untuk membersihkan.'
      : 'GAGAL — ' + hasil.error
  );
}

/** Uji baca: pastikan lookup menemukan baris uji dan menghitung sesi berikutnya. */
function ujiBaca() {
  var r = handleLookup({ nik: NIK_UJI, totalSesi: 4 });
  SpreadsheetApp.getUi().alert(
    'Hasil lookup NIK uji:\n\n' +
    'Ditemukan     : ' + (r.baru ? 'tidak (dianggap pasien baru)' : 'ya') + '\n' +
    'Nama          : ' + (r.nama || '-') + '\n' +
    'Sesi terakhir : ' + (r.kunjunganTerakhir || 0) + '\n' +
    'Tgl terakhir  : ' + (r.tglKunjunganTerakhir || '-') + '\n' +
    'Jumlah baris  : ' + ((r.riwayat || []).length) + '\n\n' +
    (r.baru
      ? 'Belum ada baris uji. Jalankan ujiTulis() dulu.'
      : 'Sesi berikutnya akan terdeteksi: ' + (r.kunjunganTerakhir + 1))
  );
}

/** Hapus semua baris uji. Aman dijalankan berkali-kali. */
function hapusUji() {
  var sh = sheet();
  var data = ambilData(sh);
  var dihapus = 0;

  // Dari bawah ke atas supaya nomor baris tidak bergeser saat dihapus.
  for (var i = data.length - 1; i >= 0; i--) {
    var cocokNik = bersihNik(data[i][K.NIK - 1]) === NIK_UJI;
    var cocokNama = String(data[i][K.NAMA - 1]).trim().toUpperCase() === NAMA_UJI;
    if (cocokNik || cocokNama) {
      sh.deleteRow(i + 2);
      dihapus++;
    }
  }

  SpreadsheetApp.getUi().alert(
    dihapus
      ? dihapus + ' baris uji dihapus. Baris terisi sekarang: ' + sh.getLastRow()
      : 'Tidak ada baris uji yang ditemukan.'
  );
}

/* ══════════════════════════════════════════════════════════
   HELPER
   ══════════════════════════════════════════════════════════ */

/** Ambil hanya angka, buang apostrof dan spasi. */
function bersihNik(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

function rataPost(riwayat) {
  if (!riwayat || !riwayat.length) return 0;
  var jml = 0, n = 0;
  for (var i = 0; i < riwayat.length; i++) {
    var v = Number(riwayat[i].skorPost);
    if (!isNaN(v)) { jml += v; n++; }
  }
  return n ? Math.round(jml / n) : 0;
}

function jakarta() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

function pad2(n) {
  return String(n).length < 2 ? '0' + n : String(n);
}

/** dd-mm-yyyy — sesuai kolom Date di sheet. */
function tanggalJakarta() {
  var d = jakarta();
  return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}

function jamJakarta() {
  var d = jakarta();
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/** Bentuk tanggal dari sel Sheets → dd-mm-yyyy. */
function teksTanggal(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return pad2(v.getDate()) + '-' + pad2(v.getMonth() + 1) + '-' + v.getFullYear();
  }
  return String(v).replace(/^'/, '').trim();
}

/** dd-mm-yyyy → yyyy-mm-dd, supaya bisa dibandingkan sebagai teks. */
function normalisasiIso(s) {
  var m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  var n = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return n ? n[0] : String(s);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
