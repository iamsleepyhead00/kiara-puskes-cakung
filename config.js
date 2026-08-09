/**
 * KIARA — Kelas Ibu Hamil Digital
 * Puskesmas Kecamatan Cakung
 *
 * Konfigurasi aplikasi. Ini satu-satunya file yang perlu diubah saat deploy.
 *
 * Disesuaikan dengan "konsep KIARA.docx" (2 Agustus 2026) — menggantikan
 * "FORMAT KIARA.docx" (31 Juli 2026) yang jadi dasar mockup v1.2.
 */
window.KIARA_CONFIG = {

  // ── WILAYAH TTD / MMS ──────────────────────────────────────
  // Media dan sebagian soal punya dua varian. Puskesmas mengirim
  // dua-duanya, jadi belum jelas Cakung masuk yang mana.
  //
  // ⚠️ WAJIB DIKONFIRMASI. Salah pilih = ibu dapat materi anemia
  //    yang tidak sesuai program wilayahnya.
  //    Nilai yang valid: 'TTD' atau 'MMS'
  WILAYAH: 'TTD',

  // ── LOKASI ─────────────────────────────────────────────────
  // Kelurahan dan Puskesmas sekarang DUA field berbeda.
  // Di FORMAT KIARA keduanya nyampur di bawah label "Alamat".
  // ⚠️ Daftar ini DIDUPLIKASI di `KELURAHAN_SAH` pada gas/Code.gs — endpoint
  //    menolak nilai yang tidak ada di daftar resminya. Kalau menambah opsi
  //    di sini tanpa mengubah Code.gs LALU deploy versi baru, pasien yang
  //    memilih opsi baru akan gagal simpan.
  KELURAHAN: [
    'Jatinegara',
    'Rawa Terate',
    'Pulo Gebang',
    'Cakung Timur',
    'Cakung Barat',
    'Ujung Menteng',
    'Penggilingan PIK',
    'Penggilingan Elok',
    // Ditambah 6 Agu atas permintaan puskesmas — ibu dari luar wilayah
    // tetap boleh ikut kelas. Ditaruh paling bawah supaya kelurahan Cakung
    // tetap jadi pilihan pertama yang terlihat.
    'Luar wilayah Cakung'
  ],

  // 9 opsi. Dokumen menulis "Pustu Cakung barat" dua kali — duplikat dihapus.
  PUSKESMAS: [
    'Puskesmas Cakung',
    'Pustu Jatinegara',
    'Pustu Cakung Barat',
    'Pustu Pulo Gebang',
    'Pustu Penggilingan PIK',
    'Pustu Penggilingan Elok',
    'Pustu Rawa Terate',
    'Pustu Ujung Menteng',
    'Pustu Cakung Timur'
  ],

  // ── BACKEND ────────────────────────────────────────────────
  // URL Web App Apps Script — spreadsheet "Rekap Hasil Kiara 2026", tab KIARA.
  // Deploy sebagai: Execute as = Me, Who has access = Anyone.
  //
  // ⚠️ URL ini memberi akses TULIS ke sheet bagi siapa pun yang memilikinya.
  //    Karena aplikasinya statis, URL ini selalu terlihat di DevTools —
  //    tidak bisa disembunyikan. Yang bisa dikendalikan cuma seberapa mudah
  //    URL-nya ditemukan. Lihat catatan keamanan di README.
  SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbxD6D_gZrSOFR0kujsE0DdkHGpLz9qkGlJKNtKl-YiyaIq7fadoEAXLBqHGm4yVfxFP/exec',

  // ── WHATSAPP ───────────────────────────────────────────────
  // Sumber: konsep KIARA.docx. Nomor ini BERBEDA dari FORMAT KIARA
  // (dulu 085945371933) — pakai yang baru.
  TARGET_PHONE: '6285889945829',
  ENABLE_WA_BUTTON: true,

  // ── SCORING ────────────────────────────────────────────────
  // Setiap TOPIK berisi 5 soal, dan jumlah topik per kunjungan
  // berbeda-beda. Jadi jumlah soal per kunjungan TIDAK seragam:
  //
  //   Kunjungan 1 : Tanda Kehamilan + 1000 HPK             → 10 soal
  //   Kunjungan 2 : Gizi Ibu Hamil + KEK                   → 10 soal
  //   Kunjungan 3 : Perawatan + Mitos + Anemia             → 15 soal
  //   Kunjungan 4 : Hal Dihindari + Tanda Bahaya           → 10 soal
  //
  // Kunjungan 3 punya tiga topik karena puskesmas menambah topik Anemia
  // (berprefiks K.3) pada paket 9 Agustus. Klien memilih mempertahankan
  // semuanya daripada membuang soal atau memindahkannya ke kunjungan lain.
  //
  // Seluruh topik dalam satu kunjungan digabung jadi SATU pre-test dan
  // SATU post-test, supaya struktur 13 kolom sheet tetap utuh — satu baris
  // per kunjungan, satu skorPre, satu skorPost.
  //
  // Angka ini dipakai untuk memeriksa kewajaran, bukan untuk memotong:
  // jumlah soal sebenarnya dihitung dari `setSoal` di content.js.
  SOAL_PER_TOPIK: 5,

  // Skor = benar / jumlah soal × 100, dibulatkan.
  //   10 soal → 0, 10, 20, … 100        KKM 80 = 8 dari 10
  //   15 soal → 0, 7, 13, 20, … 100     KKM 80 = 12 dari 15
  //
  // Persentase lulusnya sama (80%), jumlah soalnya beda.
  //
  // ⚠️ Karena jumlah soal tidak seragam, skor TIDAK selalu kelipatan 10.
  //    `BATAS.POIN_PER_SOAL` di gas/Code.gs sudah dicabut dan validasinya
  //    diganti "bilangan bulat 0–100". Kalau KKM diubah, sesuaikan juga
  //    BATAS.KKM_DEFAULT di sana LALU DEPLOY VERSI BARU.
  KKM: 80,

  // ── JUMLAH SESI ────────────────────────────────────────────
  // Dua angka, dan bedanya penting.
  //
  // TOTAL_SESI = panjang program sebenarnya. Kelas ibu hamil memang 10
  // pertemuan, jadi seluruh tampilan menyebut "dari 10" dan status LULUS
  // baru terbit setelah kunjungan ke-10. Ini yang diminta klien 7 Agu:
  // jangan berpura-pura programnya cuma 4 pertemuan.
  TOTAL_SESI: 10,

  // SESI_TERSEDIA = berapa sesi yang benar-benar bisa dijalankan aplikasi.
  // Puskesmas baru mengirim materi dan soal untuk kunjungan 1–4. Sesi 5–10
  // sudah terdaftar di content.js tapi materi dan soalnya kosong — kalau
  // dipaksa jalan, pre-test-nya nol soal dan skornya kacau.
  //
  // Ibu yang riwayatnya sudah sampai sesi 4 dan datang untuk sesi 5 akan
  // melihat layar "belum tersedia", bukan pre-test yang rusak.
  //
  // Dropdown koreksi sesi juga ikut angka ini, bukan TOTAL_SESI — petugas
  // tidak bisa memilih sesi yang belum bisa dijalankan.
  //
  // Naikkan angka ini begitu puskesmas mengirim materi + soal berikutnya,
  // dan isi `materi` serta `setSoal` sesi itu di content.js.
  SESI_TERSEDIA: 4,

  // Batas percobaan post-test. null = tanpa batas.
  MAX_PERCOBAAN_POST: null,

  // ── SERTIFIKAT — DI HOLD ───────────────────────────────────
  // konsep KIARA.docx: "KALAU SUDAH KUNJUNGAN 10x mengikuti,
  // TERBIT SERTIFIKAT LULUS (Di hold dlu)"
  //
  // Puskesmas menahan fitur ini, jadi TIDAK dibangun. Setelah 10 sesi
  // aplikasi tetap berhenti di layar rekap + kirim WhatsApp.
  // Jangan kerjakan sampai ada instruksi baru.
  ENABLE_SERTIFIKAT: false,

  // ── MATERI ─────────────────────────────────────────────────
  // Folder tempat file media disimpan (relatif terhadap index.html).
  MEDIA_BASE: 'media/',

  // true  = gate dilepas setelah PLACEHOLDER_DWELL_MS, tanpa perlu file media.
  // false = gate asli: video harus ditonton, dokumen harus dibaca lalu dikonfirmasi.
  //
  // Sudah false — seluruh 26 file media sudah ada di folder media/.
  PLACEHOLDER_MODE: false,
  PLACEHOLDER_DWELL_MS: 5000,

  // Lama minimal membaca dokumen sebelum tombol konfirmasi aktif.
  // Waktu akhirnya = yang lebih besar antara DOKUMEN_DWELL_MS dan
  // (jumlah halaman × DOKUMEN_DETIK_PER_HALAMAN). Slide 28 halaman dengan
  // 2 detik/halaman berarti 56 detik — 15 detik saja tidak masuk akal
  // untuk deck sepanjang itu.
  DOKUMEN_DWELL_MS: 15000,
  DOKUMEN_DETIK_PER_HALAMAN: 2,

  // ── ANTI-SKIP VIDEO ────────────────────────────────────────
  // Event "video selesai" tidak bisa dipercaya: pasien bisa menggeser
  // progress bar ke ujung dan event itu ikut memicu. Jadi yang dihitung
  // adalah akumulasi detik yang benar-benar diputar.
  //
  // true  = progress bar disembunyikan, lompatan maju dibatalkan,
  //         tombol lanjut baru aktif setelah MIN_TONTON_PERSEN tercapai
  // false = pasien bebas menggeser (dipakai kalau puskesmas tidak mau seketat itu)
  ANTI_SKIP: true,

  // Porsi durasi yang wajib ditonton. 0.9 = 90%.
  // Tidak 100% supaya detik terakhir yang sering terpotong tidak bikin macet.
  MIN_TONTON_PERSEN: 0.9,

  // ── DEV ────────────────────────────────────────────────────
  // true  = jalan tanpa backend, riwayat disimpan di localStorage HP
  // false = tersambung ke Google Sheets lewat SHEETS_ENDPOINT
  //
  // false = tersambung ke Google Sheets lewat SHEETS_ENDPOINT.
  //
  // Nilai ini yang benar untuk produksi. Jangan tinggalkan `true` di repo:
  // hasil pasien hanya tersimpan di HP-nya dan TIDAK PERNAH sampai ke
  // bidan — gagal tanpa suara sama sekali.
  //
  // Untuk uji alur tanpa mengotori sheet puskesmas, setel `true`
  // SEMENTARA, lalu bersihkan riwayat palsu dari console dengan
  // KIARA_DEBUG.resetOffline(). Saat `true`, peringatan
  // "OFFLINE_MODE masih true" muncul di console setiap aplikasi dibuka.
  //
  // Alternatif yang lebih aman saat menguji dengan nilai false: pakai NIK
  // 9999999999999999, karena hanya NIK itu yang disapu hapusUji().
  OFFLINE_MODE: false,

  SPLASH_DURATION_MS: 2500
};
