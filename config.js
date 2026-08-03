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
  KELURAHAN: [
    'Jatinegara',
    'Rawa Terate',
    'Pulo Gebang',
    'Cakung Timur',
    'Cakung Barat',
    'Ujung Menteng',
    'Penggilingan PIK',
    'Penggilingan Elok'
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
  // URL Web App Apps Script. Isi setelah deploy gas/Code.gs.
  // Deploy sebagai: Execute as = Me, Who has access = Anyone.
  SHEETS_ENDPOINT: '',

  // ── WHATSAPP ───────────────────────────────────────────────
  // Sumber: konsep KIARA.docx. Nomor ini BERBEDA dari FORMAT KIARA
  // (dulu 085945371933) — pakai yang baru.
  TARGET_PHONE: '6285889945829',
  ENABLE_WA_BUTTON: true,

  // ── SCORING ────────────────────────────────────────────────
  // Soal resmi: 10 soal Benar/Salah per set, jadi 10 poin per soal.
  // Skor yang mungkin: 0, 10, 20, ... 100.
  //
  // ⚠️ KKM 75 masih asumsi. Dengan 10 soal, KKM 75 berarti lulus =
  //    minimal 8 dari 10 benar. Kalau puskesmas maunya 7 dari 10,
  //    KKM harus diubah ke 70.
  KKM: 75,

  // Jumlah sesi yang AKTIF dipakai.
  //
  // Puskesmas konfirmasi (2 Agu): baru sesi 1–4 yang dipakai. Sesi 5–10
  // ditahan karena materinya belum ada. Definisi sesi 5–10 disimpan di
  // content.js pada blok `sesiDitahan` — untuk menghidupkannya:
  //   1. pindahkan entri dari `sesiDitahan` ke `sesi`
  //   2. naikkan TOTAL_SESI di sini
  // Seluruh tampilan (tracker, progress, "sesi X dari Y", layar lulus)
  // dan deteksi status LULUS ikut angka ini, tidak ada yang di-hardcode.
  TOTAL_SESI: 4,

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
  // true = jalan tanpa backend, riwayat disimpan di localStorage.
  //
  // ⚠️ Sekarang true untuk preview. WAJIB false setelah SHEETS_ENDPOINT
  //    diisi, kalau tidak data pasien hanya tersimpan di HP masing-masing.
  OFFLINE_MODE: true,

  SPLASH_DURATION_MS: 2500
};
