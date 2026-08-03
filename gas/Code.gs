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

/* Nama sheet. Kosongkan untuk memakai sheet pertama apa pun namanya. */
var NAMA_SHEET = '';

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

/** Jalankan sekali dari editor untuk memastikan header terbaca benar. */
function cekSheet() {
  var sh = sheet();
  var header = sh.getRange(1, 1, 1, JML_KOLOM).getValues()[0];
  SpreadsheetApp.getUi().alert(
    'Sheet: ' + sh.getName() +
    '\nBaris terisi: ' + sh.getLastRow() +
    '\n\nHeader terbaca:\n' + header.join(' | ')
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
