/**
 * KIARA — Konten Edukasi
 *
 * SUMBER AKTIF (5 Agustus 2026):
 *   folder "DATA BASE VIDEO" dari puskesmas — 6 video + 9 berkas soal.
 *   Prefiks K.1–K.4 pada nama berkas = kunjungan 1–4.
 *
 * Sumber ini MENGGANTIKAN bank soal Buku Pegangan Fasilitator dan paket
 * video TTD/MMS yang dipakai sebelumnya. Keduanya tidak dihapus — lihat
 * `setSoalDitahan` dan `materiDitahan` di bawah.
 *
 * Peta kunjungan → topik, apa adanya dari nama berkas:
 *
 *   K.1  Tanda Kehamilan .............. video ✓   soal ✓
 *        1000 HPK ..................... video ✓   soal ✓
 *   K.2  Gizi Ibu Hamil ............... video ✓   soal ✓
 *        Ibu KEK ...................... video ✓   soal ✓
 *   K.3  Perawatan Sehari-hari ........ video ✓   soal ✓
 *        Mitos dan Fakta .............. video ✗   soal ✓
 *   K.4  Hal yang Harus Dihindari ..... video ✓   soal ✓
 *        Tanda Bahaya Hamil ........... video ✗   soal ✓
 *   —    Imunisasi .................... video ✗   soal ✓   (tanpa prefiks K)
 *
 * Jadi tiap kunjungan berisi DUA topik. 2 × 5 soal = 10 soal per kunjungan,
 * satu poin bernilai 10, KKM 80 = 8 dari 10 benar.
 *
 * ⚠️ TIGA HAL YANG BELUM DIKONFIRMASI PUSKESMAS — lihat README:
 *    1. Berkas soal TIDAK memuat kunci jawaban. Kunci di file ini
 *       DITURUNKAN dari pedoman Buku KIA / standar ANC dan ditandai
 *       `kunciTurunan: true`. Bidan wajib memverifikasi sebelum dipakai.
 *    2. Topik "Mitos dan Fakta" (K.3) dan "Tanda Bahaya Hamil" (K.4)
 *       punya soal tapi tidak ada videonya.
 *    3. "Imunisasi" tidak punya prefiks kunjungan — belum tahu masuk
 *       kunjungan ke berapa. Ditahan di `setSoalDitahan`.
 */
window.KIARA_CONTENT = {

  /* ══════════════════════════════════════════════════════════
     A. PUSTAKA MATERI AKTIF

     6 video dari folder "DATA BASE VIDEO". Sudah ada di media/ dengan
     nama yang dirapikan. Total 186 MB, berkas terbesar 68 MB — semuanya
     di bawah batas 100 MB/berkas GitHub.

     tipe:
       'video'    — mp4, gate: harus ditonton habis
       'youtube'  — embed, gate: event ENDED dari IFrame API
       'dokumen'  — PDF, gate: dwell + konfirmasi dibaca

     Paket ini TIDAK terbagi wilayah TTD/MMS — puskesmas mengirim satu
     set saja. Jadi `file` cukup string, tidak perlu objek per wilayah.
     ══════════════════════════════════════════════════════════ */
  materi: {
    K1_TANDA_KEHAMILAN: {
      tipe: 'video',
      judul: 'Tanda Kehamilan & Pemeriksaan',
      judulPanjang: 'Tanda Kehamilan, Waktu dan Manfaat Pemeriksaan',
      file: 'K1-Tanda-Kehamilan.mp4',
      mbAsli: 9
    },
    K1_GIZI_1000HPK: {
      tipe: 'video',
      judul: 'Gizi 1000 HPK',
      judulPanjang: 'Gizi dalam 1000 Hari Pertama Kehidupan (1000 HPK)',
      file: 'K1-Gizi-1000-HPK.mp4',
      mbAsli: 51
    },
    K2_GIZI_BUMIL: {
      tipe: 'video',
      judul: 'Gizi Ibu Hamil',
      judulPanjang: 'Gizi Ibu Hamil',
      file: 'K2-Gizi-Ibu-Hamil.mp4',
      mbAsli: 68
    },
    K2_KEK: {
      tipe: 'video',
      judul: 'Ibu Hamil KEK',
      judulPanjang: 'Ibu Hamil KEK (Kekurangan Energi Kronis)',
      file: 'K2-KEK.mp4',
      mbAsli: 42
    },
    K3_PERAWATAN: {
      tipe: 'video',
      judul: 'Perawatan Sehari-hari',
      judulPanjang: 'Perawatan Sehari-hari Ibu Hamil',
      file: 'K3-Perawatan-Sehari-hari.mp4',
      mbAsli: 4
    },
    K4_DIHINDARI: {
      tipe: 'video',
      judul: 'Hal yang Harus Dihindari',
      judulPanjang: 'Hal-hal yang Harus Dihindari Selama Kehamilan',
      file: 'K4-Hal-yang-Dihindari.mp4',
      mbAsli: 13
    }
  },

  /* ══════════════════════════════════════════════════════════
     A2. MATERI DITAHAN — tidak aktif

     Paket lama (drive-download TTD/MMS + MATERI 1-10 KIARA.zip). Tidak
     dipakai sejak puskesmas mengirim "DATA BASE VIDEO", tapi definisinya
     disimpan karena sesi 5–10 nanti butuh sebagian.

     Yang berkasnya MASIH ADA di media/ :
       VID_MITOS_TTD, VID_IMD, VID_ASI_EKSKLUSIF, VID_PELEKATAN,
       VID_MATERNAL_1, VID_MATERNAL_2, dan varian TTD/MMS gizi.

     Yang berkasnya SUDAH DIHAPUS: semua PDF (komik + slide).

     ⚠️ KANDIDAT untuk menutup lubang materi:
        VID_MITOS_TTD ("Tablet Tambah Darah — Mitos dan Fakta", 99 MB)
        isinya cocok dengan soal K.3 "Mitos dan Fakta" — soalnya memang
        soal anemia dan mitos TTD. Tapi puskesmas TIDAK memasukkannya ke
        folder baru, jadi jangan diaktifkan sebelum mereka setuju.
        Cara mengaktifkan: pindahkan entrinya ke `materi` di atas, lalu
        daftarkan 'VID_MITOS_TTD' di `sesi[2].materi`.

     ⚠️ CATATAN DUPLIKAT: tiga berkas di paket lama identik byte-per-byte
        dengan berkas baru (sudah diverifikasi lewat MD5):
          MMS/1-Video-Gizi-1000-Hari.mp4   = K1-Gizi-1000-HPK.mp4
          MMS/3-Video-Gizi-Ibu-Hamil.mp4   = K2-Gizi-Ibu-Hamil.mp4
          2-Video-Audio-KEK.mp4            = K2-KEK.mp4
        Artinya video kurasi puskesmas mengambil varian MMS untuk gizi.
        Yang lama boleh dihapus untuk menghemat 160 MB disk.
     ══════════════════════════════════════════════════════════ */
  materiDitahan: {
    VID_MATERNAL_1: {
      tipe: 'video', judul: 'Kelas Ibu Hamil',
      judulPanjang: 'Video Maternal 1 — Kelas Ibu Hamil',
      file: 'Video-Maternal-1-Kelas-Ibu-Hamil.mp4', mbAsli: 366,
      catatan: '366 MB, ditolak GitHub (batas 100 MB/berkas). Tidak dipakai di paket baru.'
    },
    VID_MATERNAL_2: {
      tipe: 'video', judul: 'Pemeriksaan ANC',
      judulPanjang: 'Video Maternal 2 — Pemeriksaan ANC',
      file: 'Video-Maternal-2-Pemeriksaan-ANC.mp4', mbAsli: 309,
      catatan: '309 MB, ditolak GitHub. Digantikan K1-Tanda-Kehamilan.mp4 yang hanya 9 MB.'
    },
    VID_MITOS_TTD: {
      tipe: 'video', judul: 'Mitos dan Fakta TTD',
      judulPanjang: 'Tablet Tambah Darah — Mitos dan Fakta',
      file: 'TTD/7-Video-TTD-Mitos-dan-Fakta.mp4', mbAsli: 99,
      catatan: 'KANDIDAT untuk soal K.3 "Mitos dan Fakta" yang belum ada videonya.'
    },
    VID_IMD: {
      tipe: 'video', judul: 'Inisiasi Menyusu Dini (IMD)',
      judulPanjang: 'Inisiasi Menyusu Dini (IMD)',
      file: '5-Video-IMD.mp4', mbAsli: 18
    },
    VID_ASI_EKSKLUSIF: {
      tipe: 'video', judul: 'ASI Eksklusif', judulPanjang: 'ASI Eksklusif',
      file: 'Video-ASI-Eksklusif.mp4', mbAsli: 30
    },
    VID_PELEKATAN: {
      tipe: 'video', judul: 'Posisi Pelekatan Menyusui',
      judulPanjang: 'Posisi dan Pelekatan Menyusui yang Benar',
      file: 'Video-Posisi-Pelekatan.mp4', mbAsli: 59
    },

    /* ── PDF: berkas fisiknya sudah dihapus dari media/ ────── */
    DOK_KOMIK_IMD: {
      tipe: 'dokumen', judul: 'Komik IMD', judulPanjang: 'Komik Inisiasi Menyusu Dini',
      file: '4-Komik-IMD.pdf', mbAsli: 4
    },
    DOK_KOMIK_ANEMIA: {
      tipe: 'dokumen', judul: 'Komik MAMAMIA — Anemia',
      judulPanjang: 'Komik MAMAMIA — Anemia dan Suplementasi',
      file: { TTD: 'TTD/6-Komik-MAMAMIA-Anemia-dan-TTD.pdf', MMS: 'MMS/6-Komik-MAMAMIA-Anemia-MMS.pdf' },
      mbAsli: { TTD: 1, MMS: 2 }
    },
    DOK_KOMIK_MMS: {
      tipe: 'dokumen', judul: 'Komik MMS',
      judulPanjang: 'Komik Suplemen Multivitamin dan Mineral (MMS)',
      file: 'MMS/7-Komik-MMS.pdf', mbAsli: 1, hanyaWilayah: 'MMS'
    },
    DOK_OTAK_ANAK: {
      tipe: 'dokumen', judul: 'MMS dan Perkembangan Otak Anak',
      judulPanjang: 'MMS dan Perkembangan Otak Anak',
      file: 'MMS/11-MMS-Gambar-otak-anak.pdf', mbAsli: 1, hanyaWilayah: 'MMS'
    },
    SLD_1:  { tipe: 'dokumen', judul: 'Materi Sesi 1',  judulPanjang: 'Kehamilan yang Sehat dan Pemantauan Kehamilan',   file: 'slide/Sesi-01.pdf', slide: 28 },
    SLD_2:  { tipe: 'dokumen', judul: 'Materi Sesi 2',  judulPanjang: 'Pemantauan Kehamilan agar Ibu dan Janin Sehat',   file: 'slide/Sesi-02.pdf', slide: 24 },
    SLD_3:  { tipe: 'dokumen', judul: 'Materi Sesi 3',  judulPanjang: 'Perawatan Diri Selama Kehamilan',                 file: 'slide/Sesi-03.pdf', slide: 7 },
    SLD_4:  { tipe: 'dokumen', judul: 'Materi Sesi 4',  judulPanjang: 'Tanda Bahaya dalam Kehamilan dan Faktor Risiko',  file: 'slide/Sesi-04.pdf', slide: 26 },
    SLD_5:  { tipe: 'dokumen', judul: 'Materi Sesi 5',  judulPanjang: 'Persiapan Persalinan dan IMD',                    file: 'slide/Sesi-05.pdf', slide: 12 },
    SLD_6:  { tipe: 'dokumen', judul: 'Materi Sesi 6',  judulPanjang: 'Persalinan, Nifas, dan Mitos pada Masa Nifas',    file: 'slide/Sesi-06.pdf', slide: 13 },
    SLD_7:  { tipe: 'dokumen', judul: 'Materi Sesi 7',  judulPanjang: 'Menjaga Ibu Bersalin dan Nifas serta Bayi Sehat', file: 'slide/Sesi-07.pdf', slide: 18 },
    SLD_8:  { tipe: 'dokumen', judul: 'Materi Sesi 8',  judulPanjang: 'Kontrasepsi Pasca Persalinan',                    file: 'slide/Sesi-08.pdf', slide: 6 },
    SLD_9:  { tipe: 'dokumen', judul: 'Materi Sesi 9',  judulPanjang: 'Bayi Baru Lahir dan ASI Eksklusif',               file: 'slide/Sesi-09.pdf', slide: 22 },
    SLD_10: { tipe: 'dokumen', judul: 'Materi Sesi 10', judulPanjang: 'Imunisasi dan Menjaga Bayi Tetap Sehat',          file: 'slide/Sesi-10.pdf', slide: 10 }
  },

  /* ══════════════════════════════════════════════════════════
     B. PETA SESI AKTIF — kunjungan 1–4

     `setSoal` sekarang ARRAY kunci topik, bukan angka 1–4. Semua soal
     dari topik-topik yang terdaftar digabung jadi satu pre-test dan satu
     post-test. Ini yang menjaga struktur 13 kolom sheet tetap utuh:
     satu baris per kunjungan, satu skorPre, satu skorPost.

     `materi` dan `setSoal` sengaja dipisah karena tidak selalu sejajar —
     K.3 dan K.4 punya dua topik soal tapi baru satu videonya.

     Kalau menambah/mengurangi sesi, sesuaikan TOTAL_SESI di config.js.
     ══════════════════════════════════════════════════════════ */
  sesi: [
    {
      ke: 1,
      judul: 'Tanda Kehamilan & 1000 HPK',
      label: 'Tanda kehamilan & 1000 HPK',
      setSoal: ['K1_TANDA_KEHAMILAN', 'K1_1000HPK'],
      materi: ['K1_TANDA_KEHAMILAN', 'K1_GIZI_1000HPK'],
      pokok: ['Tanda-tanda kehamilan',
              'Waktu pemeriksaan kehamilan per trimester',
              'Manfaat pemeriksaan kehamilan rutin',
              'Gizi dalam 1000 Hari Pertama Kehidupan',
              'Stunting dan dampaknya bagi anak']
    },
    {
      ke: 2,
      judul: 'Gizi Ibu Hamil & KEK',
      label: 'Gizi ibu hamil & KEK',
      setSoal: ['K2_GIZI_BUMIL', 'K2_KEK'],
      materi: ['K2_GIZI_BUMIL', 'K2_KEK'],
      pokok: ['Kebutuhan kalori ibu hamil per trimester',
              'Zat gizi makro dan mikro',
              'Zat besi, anemia, dan tablet tambah darah',
              'Kekurangan Energi Kronis (KEK) dan pengukuran LiLA',
              'Pemberian Makanan Tambahan (PMT) untuk ibu KEK']
    },
    {
      ke: 3,
      judul: 'Perawatan Sehari-hari & Mitos',
      label: 'Perawatan diri & mitos-fakta',
      setSoal: ['K3_PERAWATAN', 'K3_MITOS_FAKTA'],
      // ⚠️ Topik "Mitos dan Fakta" belum ada videonya. Kandidatnya
      //    'VID_MITOS_TTD' di materiDitahan — tunggu persetujuan puskesmas.
      materi: ['K3_PERAWATAN'],
      pokok: ['Gizi seimbang dan kebutuhan cairan ibu hamil',
              'Cara minum tablet tambah darah yang benar',
              'Istirahat dan posisi tidur ibu hamil',
              'Aktivitas fisik yang aman selama kehamilan',
              'Gejala anemia, mitos dan fakta seputar TTD']
    },
    {
      ke: 4,
      judul: 'Hal yang Dihindari & Tanda Bahaya',
      label: 'Yang dihindari & tanda bahaya',
      setSoal: ['K4_DIHINDARI', 'K4_TANDA_BAHAYA'],
      // ⚠️ Topik "Tanda Bahaya Hamil" belum ada videonya. Puskesmas
      //    belum mengirim padanannya.
      materi: ['K4_DIHINDARI'],
      pokok: ['Kopi, rokok, dan alkohol selama kehamilan',
              'Aktivitas berat dan makanan yang tidak matang',
              'Tanda bahaya kehamilan trimester 1, 2, dan 3',
              'Kapan harus segera ke fasilitas kesehatan']
    },

    /* ── Sesi 5–10: terdaftar, belum bisa dijalankan ──────────
       `materi` dan `setSoal` kosong karena puskesmas baru mengirim K.1–K.4.
       Yang menahannya `SESI_TERSEDIA: 4` di config.js — lihat blok B2.
       Judulnya dari nama slide deck puskesmas, PERLU DIKONFIRMASI. */
    {
      ke: 5,
      judul: 'Persiapan Persalinan & IMD',
      label: 'Persalinan & IMD',
      setSoal: [], materi: [],
      pokok: ['Persiapan persalinan', 'Tanda persalinan', 'Proses persalinan',
              'Inisiasi Menyusu Dini (IMD)']
    },
    {
      ke: 6,
      judul: 'Nifas & Mitos Masa Nifas',
      label: 'Nifas & mitos nifas',
      setSoal: [], materi: [],
      pokok: ['Tanda bahaya setelah melahirkan', 'Pelayanan nifas',
              'Menjaga kesehatan ibu dan bayi pada masa nifas',
              'Mitos pada masa nifas']
    },
    {
      ke: 7,
      judul: 'Menjaga Ibu Nifas & Bayi Sehat',
      label: 'Ibu nifas & bayi sehat',
      setSoal: [], materi: [],
      pokok: ['Menjaga ibu bersalin, nifas, dan bayi sehat',
              'Tanda bahaya pada ibu nifas',
              'Depresi setelah melahirkan']
    },
    {
      ke: 8,
      judul: 'KB Pasca Persalinan',
      label: 'KB pasca persalinan',
      setSoal: [], materi: [],
      pokok: ['KB pasca persalinan', 'Metode Amenorhae Laktasi (MAL)']
    },
    {
      ke: 9,
      judul: 'Bayi Baru Lahir & ASI Eksklusif',
      label: 'Bayi baru lahir & ASI',
      setSoal: [], materi: [],
      pokok: ['Tanda bayi lahir sehat', 'Tanda bahaya bayi baru lahir',
              'Perawatan bayi baru lahir', 'Perawatan Metode Kangguru (PMK)',
              'ASI eksklusif, posisi pelekatan, cara memerah dan menyimpan ASI']
    },
    {
      ke: 10,
      judul: 'Imunisasi & Perawatan Bayi',
      label: 'Imunisasi & perawatan bayi',
      setSoal: [], materi: [],
      pokok: ['Imunisasi', 'Menjaga bayi tetap sehat',
              'Akta kelahiran', 'Peran suami', 'Mitos perawatan bayi']
    }
  ],

  /* ══════════════════════════════════════════════════════════
     B2. SESI 5–10 — terdaftar, BELUM bisa dijalankan

     Klien minta (7 Agu) aplikasi mengakui programnya 10 pertemuan, bukan 4.
     Jadi keenam sesi ini ikut terdaftar di `sesi` di atas supaya tampilan
     menyebut "dari 10" dan LULUS baru terbit setelah kunjungan ke-10.

     Tapi `materi` DAN `setSoal` keduanya kosong — puskesmas baru mengirim
     untuk K.1–K.4. Yang menahannya adalah `SESI_TERSEDIA: 4` di config.js:
     ibu yang sampai di sesi 5 melihat layar "belum tersedia", bukan
     pre-test nol soal.

     ⚠️ JUDULNYA PERLU DIKONFIRMASI. Diambil dari nama slide deck
        "MATERI 1-10 KIARA.zip" kiriman puskesmas — jadi sumbernya sah, tapi
        penomoran deck itu belum tentu sejajar dengan penomoran K.1–K.4 yang
        sekarang dipakai. K.1 misalnya berisi Tanda Kehamilan + 1000 HPK,
        sementara slide 1 berjudul "Kehamilan yang Sehat".

     Yang sudah ada di tangan untuk sesi berikutnya:
       • soal "Imunisasi" (5 soal) — di `setSoalDitahan`
       • video VID_IMD, VID_ASI_EKSKLUSIF, VID_PELEKATAN — di media/
     Belum ada instruksi masuk kunjungan ke berapa.

     Untuk menghidupkan satu sesi: isi `materi` dan `setSoal`-nya (harus
     berjumlah SOAL_PER_SESI = 10 soal), lalu naikkan SESI_TERSEDIA.
     ══════════════════════════════════════════════════════════ */
  sesiDitahan: [],

  /* ══════════════════════════════════════════════════════════
     C. BANK SOAL AKTIF — Benar / Salah

     Sumber: 8 berkas .docx berprefiks K.1–K.4 di folder
             "DATA BASE VIDEO" (puskesmas, 5 Agustus 2026).

     Teks pertanyaan dikutip dari berkas aslinya. Yang dirapikan hanya
     salah ketik yang jelas ("kitab isa" → "kita bisa", "Benar?Salah"
     → "Benar/Salah") dan tanda tanya penutup dibuat konsisten. Isi
     substansinya tidak diubah.

     ⚠️ KUNCI JAWABAN TIDAK ADA DI BERKAS SUMBER.
        Berkas .docx hanya memuat pertanyaan dan pilihan "Benar/Salah",
        tanpa menandai mana yang benar. Kunci di bawah DITURUNKAN dari
        pedoman Buku KIA dan standar pelayanan ANC, dan setiap set
        ditandai `kunciTurunan: true`.

        Bidan WAJIB memverifikasi seluruh 40 kunci sebelum aplikasi
        dipakai pasien. Daftar cetaknya ada di
        `KUNCI-JAWABAN-PERLU-VERIFIKASI.md`.

        Soal yang jawabannya bergantung pedoman/kebijakan — bukan sekadar
        fakta medis — ditandai tambahan `perluKonfirmasi`.

     kunci: true = Benar, false = Salah
     ══════════════════════════════════════════════════════════ */
  setSoal: {

    // ── K.1 · topik 1 ─────────────────────────────────────────
    K1_TANDA_KEHAMILAN: {
      nama: 'Tanda Kehamilan & Pemeriksaan',
      kunjungan: 1,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Apakah keluhan mual bisa menjadi salah satu tanda kehamilan?', kunci: true },
        { pertanyaan: 'Apakah periksa kehamilan terbagi menjadi 3 trimester?', kunci: true },
        { pertanyaan: 'Apakah dengan kita melakukan pemeriksaan rutin dalam kehamilan kita bisa mengetahui kondisi kesehatan ibu dan pertumbuhan janin?', kunci: true },
        {
          pertanyaan: 'Apakah periksa kehamilan pada trimester kedua dilakukan sebanyak 1 kali?',
          kunci: true,
          perluKonfirmasi: 'Benar menurut standar ANC 6 kali (TM1 2×, TM2 1×, TM3 3×). Kalau puskesmas masih memakai standar 4 kali, jawabannya bisa berbeda.'
        },
        {
          pertanyaan: 'Apakah semua ibu hamil akan mendapatkan tablet tambah darah?',
          kunci: true,
          perluKonfirmasi: 'Di wilayah program MMS, ibu hamil menerima MMS alih-alih TTD. Perlu dipastikan Cakung masuk program TTD atau MMS.'
        }
      ]
    },

    // ── K.1 · topik 2 ─────────────────────────────────────────
    K1_1000HPK: {
      nama: '1000 HPK',
      kunjungan: 1,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Apakah proses pertumbuhan sebagian besar otak terjadi di 1000 HPK (Hari Pertama Kehidupan)?', kunci: true },
        { pertanyaan: 'Apakah ASI eksklusif diberikan selama 2 tahun?', kunci: false },
        { pertanyaan: 'Apakah anak mulai diberikan MPASI saat usia 4 bulan?', kunci: false },
        { pertanyaan: 'Apabila di 1000 HPK anak mendapatkan nutrisi tidak seimbang, maka anak bisa terkena stunting (tinggi badan tidak sesuai dengan usia anak)?', kunci: true },
        { pertanyaan: 'Apabila anak terkena stunting, bisa menyebabkan kelemahan IQ di masa depan?', kunci: true }
      ]
    },

    // ── K.2 · topik 1 ─────────────────────────────────────────
    K2_GIZI_BUMIL: {
      nama: 'Gizi Ibu Hamil',
      kunjungan: 2,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Pada masa kehamilan, apakah kebutuhan kalori ibu hamil meningkat terutama di trimester kedua dan ketiga?', kunci: true },
        { pertanyaan: 'Apakah untuk jenis makanan yang mengandung karbohidrat, protein, dan lemak termasuk ke dalam zat gizi mikro?', kunci: false },
        { pertanyaan: 'Jika ibu hamil kekurangan makanan bergizi seimbang, bisa menimbulkan anemia?', kunci: true },
        { pertanyaan: 'Kebutuhan zat besi terkandung dalam makanan seperti daging merah, ati, ayam, ikan, dan sayur berdaun hijau?', kunci: true },
        { pertanyaan: 'Untuk memenuhi kebutuhan zat gizi mikro, ibu hamil disarankan untuk minum tablet tambah darah?', kunci: true }
      ]
    },

    // ── K.2 · topik 2 ─────────────────────────────────────────
    K2_KEK: {
      nama: 'Ibu Hamil KEK',
      kunjungan: 2,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Apakah bila ibu hamil dilakukan pemeriksaan dan didapatkan hasil LiLA (Lingkar Lengan Atas) < 23,5 cm dapat digolongkan ke dalam kategori Kekurangan Energi Kronis (KEK)?', kunci: true },
        { pertanyaan: 'Ibu hamil yang tergolong ke dalam kategori Kekurangan Energi Kronis bisa berisiko melahirkan bayi berat badan lahir rendah?', kunci: true },
        { pertanyaan: 'Apakah ibu hamil Kekurangan Energi Kronis perlu mendapatkan makanan tambahan (PMT) setiap hari?', kunci: true },
        { pertanyaan: 'Apakah tahu tempe tergolong ke dalam jenis makanan yang mengandung karbohidrat?', kunci: false },
        { pertanyaan: 'Apakah rasa mual dan tidak nafsu makan yang dialami oleh ibu hamil bisa menyebabkan Kekurangan Energi Kronis (KEK)?', kunci: true }
      ]
    },

    // ── K.3 · topik 1 ─────────────────────────────────────────
    K3_PERAWATAN: {
      nama: 'Perawatan Sehari-hari',
      kunjungan: 3,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Ibu hamil dianjurkan mengonsumsi makanan bergizi seimbang yang terdiri dari karbohidrat, protein, sayur, buah, dan cukup minum air putih.', kunci: true },
        { pertanyaan: 'Tablet Tambah Darah (TTD) sebaiknya diminum bersama teh atau kopi agar penyerapannya lebih baik.', kunci: false },
        { pertanyaan: 'Ibu hamil dianjurkan tidur 7–9 jam setiap malam dan usahakan tidur dengan posisi miring ke kiri.', kunci: true },
        { pertanyaan: 'Selama hamil, ibu tidak boleh melakukan aktivitas fisik seperti berjalan kaki atau senam hamil.', kunci: false },
        { pertanyaan: 'Perdarahan, sakit kepala hebat, pandangan kabur, bengkak pada wajah atau tangan, nyeri perut hebat, air ketuban keluar sebelum waktunya, dan gerakan janin berkurang merupakan tanda bahaya yang harus segera diperiksakan ke fasilitas kesehatan.', kunci: true }
      ]
    },

    // ── K.3 · topik 2 ─────────────────────────────────────────
    K3_MITOS_FAKTA: {
      nama: 'Mitos dan Fakta',
      kunjungan: 3,
      kunciTurunan: true,
      tanpaVideo: true,
      soal: [
        { pertanyaan: 'Apakah pucat, rasa lemas, dan mudah lelah termasuk dalam gejala anemia?', kunci: true },
        { pertanyaan: 'Apakah selama kehamilan wajib melakukan pemeriksaan kehamilan (ANC)?', kunci: true },
        { pertanyaan: 'Apakah anemia bisa menyebabkan perdarahan saat melahirkan, bayi lahir prematur, dan bayi lahir berat badan rendah?', kunci: true },
        { pertanyaan: 'Apakah boleh minum tablet tambah darah bersamaan dengan minum teh?', kunci: false },
        { pertanyaan: 'Apakah dengan minum tablet tambah darah setiap hari dapat merusak fungsi ginjal?', kunci: false }
      ]
    },

    // ── K.4 · topik 1 ─────────────────────────────────────────
    K4_DIHINDARI: {
      nama: 'Hal yang Harus Dihindari',
      kunjungan: 4,
      kunciTurunan: true,
      soal: [
        {
          pertanyaan: 'Tidak boleh minum kopi lebih dari 1 cangkir selama kehamilan.',
          kunci: true,
          perluKonfirmasi: 'Pedoman membatasi kafein, tapi angka "1 cangkir" tidak baku. Perlu dipastikan batas yang dipakai puskesmas.'
        },
        { pertanyaan: 'Boleh merokok selama hamil hanya 1 batang per hari.', kunci: false },
        { pertanyaan: 'Boleh minum alkohol selama hamil.', kunci: false },
        { pertanyaan: 'Tidak boleh beraktivitas berat selama hamil.', kunci: true },
        { pertanyaan: 'Boleh makan makanan yang tidak matang.', kunci: false }
      ]
    },

    // ── K.4 · topik 2 ─────────────────────────────────────────
    K4_TANDA_BAHAYA: {
      nama: 'Tanda Bahaya Kehamilan',
      kunjungan: 4,
      kunciTurunan: true,
      tanpaVideo: true,
      soal: [
        { pertanyaan: 'Perdarahan dari jalan lahir saat hamil merupakan salah satu tanda bahaya kehamilan.', kunci: true },
        { pertanyaan: 'Sakit kepala hebat yang disertai pandangan kabur pada ibu hamil dapat menjadi tanda bahaya dan perlu segera diperiksakan.', kunci: true },
        { pertanyaan: 'Bengkak pada wajah dan tangan saat hamil selalu normal dan tidak perlu diperhatikan.', kunci: false },
        { pertanyaan: 'Gerakan janin yang berkurang atau tidak terasa seperti biasanya dapat menjadi tanda bahaya kehamilan.', kunci: true },
        { pertanyaan: 'Demam tinggi pada ibu hamil tidak berbahaya bagi ibu maupun janin.', kunci: false }
      ]
    }
  },

  /* ══════════════════════════════════════════════════════════
     C2. BANK SOAL DITAHAN

     1. IMUNISASI — dari berkas "SOAL PRETEST & POSTTEST IMUNISASI.docx".
        Berkas ini TIDAK berprefiks K, jadi belum jelas masuk kunjungan
        ke berapa. Soalnya siap pakai, tinggal didaftarkan di `sesi`
        begitu puskesmas menentukan kunjungannya.

     2. Buku Pegangan Fasilitator Kelas Ibu Hamil 2025 hal. 169–172
        (Tabel 22–25, 4 set × 10 soal). Dipakai sebelum puskesmas
        mengirim soal sendiri. Disimpan sebagai rujukan resmi — kalau
        kunjungan 5+ butuh soal dan puskesmas belum mengirim, ini
        sumber yang sah. Kunci jawabannya ASLI dari buku, bukan
        turunan, kecuali dua yang ditandai `perluKonfirmasi`.
     ══════════════════════════════════════════════════════════ */
  setSoalDitahan: {

    IMUNISASI: {
      nama: 'Imunisasi',
      kunjungan: null,
      kunciTurunan: true,
      soal: [
        { pertanyaan: 'Imunisasi diberikan untuk membantu tubuh membentuk kekebalan terhadap penyakit tertentu.', kunci: true },
        { pertanyaan: 'Anak yang sudah diimunisasi tidak perlu lagi mendapatkan imunisasi lanjutan sesuai jadwal usianya.', kunci: false },
        { pertanyaan: 'Salah satu manfaat imunisasi adalah membantu mencegah penyebaran penyakit di masyarakat melalui kekebalan kelompok.', kunci: true },
        { pertanyaan: 'Demam ringan atau bengkak di tempat suntikan setelah imunisasi merupakan reaksi yang normal.', kunci: true },
        { pertanyaan: 'Buku KIA tidak perlu dibawa saat datang ke Posyandu atau Puskesmas untuk imunisasi.', kunci: false }
      ]
    },

    // ── Buku fasilitator, Tabel 22 — Pertemuan I ─────────────
    BUKU_1: {
      nama: 'Buku · Pertemuan I',
      sumber: 'Buku Pegangan Fasilitator 2025, Tabel 22, hal. 169',
      soal: [
        { pertanyaan: 'Kekurangan gizi pada 1000 Hari Pertama Kehidupan (HPK) dapat berdampak buruk pada ibu hamil dan generasi selanjutnya.', kunci: true },
        { pertanyaan: 'Payudara terasa bengkak merupakan salah satu tanda perubahan tubuh selama masa kehamilan.', kunci: true },
        { pertanyaan: 'Ibu hamil cukup 2 kali memeriksakan kehamilannya selama hamil.', kunci: false },
        { pertanyaan: 'Kurang Energi Kronis (KEK) pada ibu hamil tidak berisiko pada berat lahir bayi.', kunci: false },
        { pertanyaan: 'Anemia pada ibu hamil dapat menyebabkan risiko perdarahan saat melahirkan, dan bayi lahir dengan berat badan rendah.', kunci: true },
        {
          varian: {
            TTD: { pertanyaan: 'Tablet Tambah Darah/TTD diminum selama kehamilan.', kunci: true },
            MMS: { pertanyaan: 'Suplemen Multivitamin dan Mineral untuk Ibu Hamil/MMS diminum selama kehamilan.', kunci: true }
          }
        },
        { pertanyaan: 'Ibu hamil perlu makan makanan yang beraneka ragam agar ibu dan janin sehat.', kunci: true },
        { pertanyaan: 'Suami perlu menyiapkan transportasi, tabungan, dan pendonor darah sebelum persalinan.', kunci: true },
        { pertanyaan: 'Ibu hamil tidak boleh melakukan hubungan suami istri/sanggama selama hamil.', kunci: false },
        { pertanyaan: 'Jika ibu hamil sudah merasa akan melahirkan sebaiknya segera minta pertolongan ke dukun.', kunci: false }
      ]
    },

    // ── Tabel 23 — Pertemuan II ──────────────────────────────
    BUKU_2: {
      nama: 'Buku · Pertemuan II',
      sumber: 'Buku Pegangan Fasilitator 2025, Tabel 23, hal. 170',
      soal: [
        { pertanyaan: 'Keluar lendir bercampur darah merupakan salah satu tanda persalinan akan berlangsung.', kunci: true },
        { pertanyaan: 'Suami dan keluarga sebaiknya memberikan dukungan semangat pada saat persalinan.', kunci: true },
        {
          pertanyaan: 'Kepanjangan dari IMD adalah Inisiasi Menyusu Dini.',
          kunci: false,
          perluKonfirmasi: 'Buku menulis kunci S (Salah), padahal IMD memang Inisiasi Menyusu Dini. Kemungkinan salah cetak.'
        },
        { pertanyaan: 'Inisiasi Menyusu Dini (IMD) tetap dapat dilakukan ketika melahirkan dengan operasi cesar.', kunci: true },
        { pertanyaan: 'Kolostrum atau ASI yang pertama keluar yang berwarna kuning harus diberikan pada bayi karena banyak mengandung antibodi.', kunci: true },
        { pertanyaan: 'Waktu yang paling tepat untuk ber-KB adalah setelah selesai masa nifas.', kunci: false },
        { pertanyaan: 'Ibu nifas perlu makan makanan yang beraneka ragam agar ibu dan bayi sehat.', kunci: true },
        { pertanyaan: 'Membebat perut kencang-kencang setelah persalinan dapat mempercepat pemulihan perut yang kendor.', kunci: false },
        { pertanyaan: 'Istirahat yang cukup merupakan salah satu kegiatan yang dapat dilakukan ibu untuk menjaga ibu bersalin, nifas, dan bayi sehat.', kunci: true },
        { pertanyaan: 'Selama masa nifas, ibu cukup 2 kali memeriksakan diri ke bidan.', kunci: false }
      ]
    },

    // ── Tabel 24 — Pertemuan III ─────────────────────────────
    BUKU_3: {
      nama: 'Buku · Pertemuan III',
      sumber: 'Buku Pegangan Fasilitator 2025, Tabel 24, hal. 171',
      soal: [
        { pertanyaan: 'Semua ibu hamil harus memiliki peningkatan berat badan sebesar 15 kg selama kehamilan, tanpa memperhatikan berat badan sebelum hamil.', kunci: false },
        {
          varian: {
            TTD: { pertanyaan: 'Setiap mengonsumsi Tablet Tambah Darah/TTD, suami/keluarga harus menandai kotak kontrol yang ada di Buku KIA.', kunci: true },
            MMS: { pertanyaan: 'Setiap mengonsumsi Suplemen Multivitamin dan Mineral untuk Ibu Hamil/MMS, suami/keluarga harus menandai kotak kontrol yang ada di Buku KIA.', kunci: true }
          }
        },
        {
          varian: {
            TTD: { pertanyaan: 'Tinja berwarna kehitaman setelah minum Tablet Tambah Darah/TTD tidak berbahaya bagi ibu hamil.', kunci: true },
            MMS: {
              pertanyaan: 'Tinja berwarna kehitaman adalah salah satu efek samping minum Suplemen Multivitamin dan Mineral untuk Ibu Hamil/MMS.',
              kunci: false,
              perluKonfirmasi: 'Kunci S bertentangan arah dengan varian TTD-nya (yang berkunci B). Salah satu kemungkinan tertukar.'
            }
          }
        },
        { pertanyaan: 'Demam, menggigil dan berkeringat merupakan gejala-gejala malaria.', kunci: true },
        { pertanyaan: 'Kehamilan di luar kandungan merupakan salah satu akibat infeksi malaria terhadap ibu.', kunci: false },
        { pertanyaan: 'Tidur di dalam kelambu merupakan salah satu cara mencegah penyakit malaria.', kunci: true },
        { pertanyaan: 'Setia pada pasangan merupakan salah satu cara mencegah Infeksi Menular Seksual / HIV AIDS.', kunci: true },
        { pertanyaan: 'Perdarahan merupakan salah satu tanda bahaya kehamilan.', kunci: true },
        { pertanyaan: 'Ibu kejang bukan merupakan tanda-tanda bahaya persalinan.', kunci: false },
        { pertanyaan: 'Ibu bekerja masih dapat memberikan ASI untuk bayinya.', kunci: true }
      ]
    },

    // ── Tabel 25 — Pertemuan IV ──────────────────────────────
    BUKU_4: {
      nama: 'Buku · Pertemuan IV',
      sumber: 'Buku Pegangan Fasilitator 2025, Tabel 25, hal. 172',
      soal: [
        { pertanyaan: 'Bayi lahir segera menangis merupakan salah satu tanda bayi lahir sehat.', kunci: true },
        { pertanyaan: 'Bayi tidak mau menyusu merupakan salah satu tanda bahaya bayi baru lahir.', kunci: true },
        { pertanyaan: 'Selama 3 hari pertama ketika ASI belum keluar, bayi tidak membutuhkan makan/minum lain karena masih mempunyai cadangan makanan dalam tubuhnya.', kunci: true },
        { pertanyaan: 'Salah satu posisi menyusui yang benar adalah wajah bayi menghadap payudara ibu.', kunci: true },
        { pertanyaan: 'Pemberian ASI eksklusif pada bayi diberikan sampai umur 4 bulan.', kunci: false },
        { pertanyaan: 'Selama pemberian ASI secara eksklusif, bayi boleh diberikan madu atau air putih.', kunci: false },
        { pertanyaan: 'Imunisasi BCG dapat menjaga kekebalan tubuh pada bayi sehingga tidak mudah kena penyakit TBC.', kunci: true },
        { pertanyaan: 'Cuci tangan dengan sabun sebelum dan sesudah merawat bayi dapat menjaga bayi tetap sehat.', kunci: true },
        { pertanyaan: 'Menghindarkan bayi dari asap rokok maupun asap dapur dapat menjaga bayi tetap sehat.', kunci: true },
        { pertanyaan: 'Akta kelahiran baru dapat dibuat setelah bayi berusia 40 hari.', kunci: false }
      ]
    }
  },

  /* ══════════════════════════════════════════════════════════
     D. TEMPLATE PESAN WHATSAPP
     Aturan dari dokumen: hanya nilai pre & post, tanpa rincian per materi.
     ⚠️ Susunan ini belum disetujui bidan.
     ══════════════════════════════════════════════════════════ */
  waTemplateHasil: [
    '*HASIL KELAS IBU HAMIL — KIARA*',
    'Puskesmas Kecamatan Cakung',
    '',
    'Nama        : {nama}',
    'NIK         : {nikMask}',
    'Alamat      : {alamat}',
    'Kelurahan   : {kelurahan}',
    'Puskesmas   : {puskesmas}',
    'Sesi        : Ke-{sesi} dari {total}',
    'Tanggal     : {tanggal}',
    '',
    'Pre-Test    : {skorPre}',
    'Post-Test   : {skorPost}',
    'Perubahan   : {delta}',
    'Status KKM  : {statusKkm} (KKM {kkm})'
  ].join('\n'),

  waTemplateRekap: [
    '*REKAP KELAS IBU HAMIL — KIARA*',
    'Puskesmas Kecamatan Cakung',
    '',
    'Nama            : {nama}',
    'NIK             : {nikMask}',
    'Alamat          : {alamat}',
    'Kelurahan       : {kelurahan}',
    'Puskesmas       : {puskesmas}',
    '',
    'Total sesi      : {selesai} dari {total}',
    'Rata-rata post  : {rataPost}',
    'Status          : {status}'
  ].join('\n')
};
