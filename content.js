/**
 * KIARA — Konten Edukasi
 *
 * Disesuaikan dengan:
 *   • konsep KIARA.docx (2 Agustus 2026)
 *   • Buku Pegangan Fasilitator Kelas Ibu Hamil 2025, hal. 169–172 (bank soal)
 *   • MATERI 1-10 KIARA.zip (10 slide deck per sesi)
 *   • drive-download ...zip (15 mp4 + 7 PDF komik, terbagi wilayah TTD & MMS)
 *
 * File ini sengaja dipisah dari app.js supaya revisi konten tidak perlu
 * menyentuh logic aplikasi.
 */
window.KIARA_CONTENT = {

  /* ══════════════════════════════════════════════════════════
     A. PUSTAKA MATERI

     tipe:
       'video'    — mp4, gate: harus ditonton habis
       'youtube'  — embed, gate: event ENDED dari IFrame API
       'dokumen'  — PDF (komik / slide), gate: dwell + konfirmasi dibaca

     file:
       string                       → sama untuk semua wilayah
       { TTD: '...', MMS: '...' }   → beda per wilayah

     hanyaWilayah — materi hanya muncul di wilayah tertentu.

     ⚠️ Semua path relatif terhadap KIARA_CONFIG.MEDIA_BASE ('media/').
        File aslinya masih di dua zip di folder Downloads dan BELUM
        dipindahkan ke sini. Lihat README bagian "Menyiapkan Media".
     ══════════════════════════════════════════════════════════ */
  materi: {

    /* ── Video umum (dari root drive-download) ─────────────── */
    VID_MATERNAL_1: {
      tipe: 'video',
      judul: 'Kelas Ibu Hamil',
      judulPanjang: 'Video Maternal 1 — Kelas Ibu Hamil',
      file: 'Video-Maternal-1-Kelas-Ibu-Hamil.mp4',
      mbAsli: 366,
      catatan: 'Perlu dikompres / dipindah ke YouTube. 366 MB tidak layak diputar dari HP.'
    },
    VID_MATERNAL_2: {
      tipe: 'video',
      judul: 'Pemeriksaan ANC',
      judulPanjang: 'Video Maternal 2 — Pemeriksaan ANC',
      file: 'Video-Maternal-2-Pemeriksaan-ANC.mp4',
      mbAsli: 309,
      catatan: 'Perlu dikompres / dipindah ke YouTube. 309 MB tidak layak diputar dari HP.'
    },

    /* ── Video per wilayah ─────────────────────────────────── */
    VID_GIZI_1000HPK: {
      tipe: 'video',
      judul: 'Gizi dalam 1000 Hari Pertama Kehidupan',
      judulPanjang: 'Gizi dalam 1000 Hari Pertama Kehidupan (1000 HPK)',
      file: { TTD: 'TTD/1-Video-Gizi-1000-HPK-TTD.mp4', MMS: 'MMS/1-Video-Gizi-1000-Hari.mp4' },
      mbAsli: { TTD: 33, MMS: 51 }
    },
    VID_KEK: {
      tipe: 'video',
      judul: 'Ibu Hamil KEK',
      judulPanjang: 'Ibu Hamil KEK (Kekurangan Energi Kronis)',
      file: '2-Video-Audio-KEK.mp4',
      mbAsli: 42
    },
    VID_GIZI_BUMIL: {
      tipe: 'video',
      judul: 'Gizi Ibu Hamil',
      judulPanjang: 'Gizi Ibu Hamil',
      file: { TTD: 'TTD/3-Video-Gizi-Ibu-Hamil-TTD.mp4', MMS: 'MMS/3-Video-Gizi-Ibu-Hamil.mp4' },
      mbAsli: { TTD: 47, MMS: 68 }
    },
    VID_MITOS_TTD: {
      tipe: 'video',
      judul: 'Mitos dan Fakta TTD',
      judulPanjang: 'Tablet Tambah Darah — Mitos dan Fakta',
      file: 'TTD/7-Video-TTD-Mitos-dan-Fakta.mp4',
      mbAsli: 99,
      hanyaWilayah: 'TTD',
      catatan: 'Tidak ada padanannya di paket MMS. Sesi 3 wilayah MMS jadi tanpa video.'
    },
    VID_IMD: {
      tipe: 'video',
      judul: 'Inisiasi Menyusu Dini (IMD)',
      judulPanjang: 'Inisiasi Menyusu Dini (IMD)',
      file: '5-Video-IMD.mp4',
      mbAsli: 18
    },
    VID_ASI_EKSKLUSIF: {
      tipe: 'video',
      judul: 'ASI Eksklusif',
      judulPanjang: 'ASI Eksklusif',
      file: 'Video-ASI-Eksklusif.mp4',
      mbAsli: 30
    },
    VID_PELEKATAN: {
      tipe: 'video',
      judul: 'Posisi Pelekatan Menyusui',
      judulPanjang: 'Posisi dan Pelekatan Menyusui yang Benar',
      file: 'Video-Posisi-Pelekatan.mp4',
      mbAsli: 59
    },

    /* Materi berbentuk PDF (komik + slide) DITAHAN — lihat `materiDitahan`
       di bawah. Puskesmas mengonfirmasi 2 Agustus bahwa materi PDF tidak
       dipakai. Definisinya disimpan, bukan dihapus. */
  },

  /* ══════════════════════════════════════════════════════════
     A2. MATERI DITAHAN — tidak aktif

     Puskesmas konfirmasi: materi berbentuk PDF tidak dipakai lagi.
     Definisi disimpan di sini supaya pemetaannya tidak hilang, bukan
     karena masih terpakai.

     ⚠️ FILE FISIKNYA SUDAH DIHAPUS dari folder media/.
        Kalau nanti dipakai lagi:
        1. Komik PDF  → ekstrak dari drive-download-...zip di folder Downloads
        2. Slide PDF  → konversi ulang 10 .pptx dari MATERI 1-10 KIARA.zip
                        (PowerPoint: Save As → PDF, atau
                         soffice --headless --convert-to pdf)
        3. Pindahkan entri yang diperlukan ke `materi` di atas
        4. Daftarkan id-nya di `sesi[].materi`
     ══════════════════════════════════════════════════════════ */
  materiDitahan: {

    /* ── Komik / dokumen pendukung ─────────────────────────── */
    DOK_KOMIK_IMD: {
      tipe: 'dokumen',
      judul: 'Komik IMD',
      judulPanjang: 'Komik Inisiasi Menyusu Dini',
      file: '4-Komik-IMD.pdf',
      mbAsli: 4
    },
    DOK_KOMIK_ANEMIA: {
      tipe: 'dokumen',
      judul: 'Komik MAMAMIA — Anemia',
      judulPanjang: 'Komik MAMAMIA — Anemia dan Suplementasi',
      file: { TTD: 'TTD/6-Komik-MAMAMIA-Anemia-dan-TTD.pdf', MMS: 'MMS/6-Komik-MAMAMIA-Anemia-MMS.pdf' },
      mbAsli: { TTD: 1, MMS: 2 }
    },
    DOK_KOMIK_MMS: {
      tipe: 'dokumen',
      judul: 'Komik MMS',
      judulPanjang: 'Komik Suplemen Multivitamin dan Mineral (MMS)',
      file: 'MMS/7-Komik-MMS.pdf',
      mbAsli: 1,
      hanyaWilayah: 'MMS'
    },
    DOK_OTAK_ANAK: {
      tipe: 'dokumen',
      judul: 'MMS dan Perkembangan Otak Anak',
      judulPanjang: 'MMS dan Perkembangan Otak Anak',
      file: 'MMS/11-MMS-Gambar-otak-anak.pdf',
      mbAsli: 1,
      hanyaWilayah: 'MMS'
    },

    /* ── Slide deck per sesi (dari MATERI 1-10 KIARA.zip) ───
       ⚠️ File aslinya .pptx dan tidak bisa ditampilkan langsung di
          browser. Perlu dikonversi ke PDF dulu (Save As → PDF di
          PowerPoint, atau LibreOffice --convert-to pdf).
       ─────────────────────────────────────────────────────── */
    SLD_1:  { tipe: 'dokumen', judul: 'Materi Sesi 1',  judulPanjang: 'Kehamilan yang Sehat dan Pemantauan Kehamilan',            file: 'slide/Sesi-01.pdf', slide: 28 },
    SLD_2:  { tipe: 'dokumen', judul: 'Materi Sesi 2',  judulPanjang: 'Pemantauan Kehamilan agar Ibu dan Janin Sehat',            file: 'slide/Sesi-02.pdf', slide: 24 },
    SLD_3:  { tipe: 'dokumen', judul: 'Materi Sesi 3',  judulPanjang: 'Perawatan Diri Selama Kehamilan',                          file: 'slide/Sesi-03.pdf', slide: 7 },
    SLD_4:  { tipe: 'dokumen', judul: 'Materi Sesi 4',  judulPanjang: 'Tanda Bahaya dalam Kehamilan dan Faktor Risiko',           file: 'slide/Sesi-04.pdf', slide: 26 },
    SLD_5:  { tipe: 'dokumen', judul: 'Materi Sesi 5',  judulPanjang: 'Persiapan Persalinan dan IMD',                             file: 'slide/Sesi-05.pdf', slide: 12 },
    SLD_6:  { tipe: 'dokumen', judul: 'Materi Sesi 6',  judulPanjang: 'Persalinan, Nifas, dan Mitos pada Masa Nifas',             file: 'slide/Sesi-06.pdf', slide: 13 },
    SLD_7:  { tipe: 'dokumen', judul: 'Materi Sesi 7',  judulPanjang: 'Menjaga Ibu Bersalin dan Nifas serta Bayi Sehat',          file: 'slide/Sesi-07.pdf', slide: 18 },
    SLD_8:  { tipe: 'dokumen', judul: 'Materi Sesi 8',  judulPanjang: 'Kontrasepsi Pasca Persalinan',                             file: 'slide/Sesi-08.pdf', slide: 6 },
    SLD_9:  { tipe: 'dokumen', judul: 'Materi Sesi 9',  judulPanjang: 'Bayi Baru Lahir dan ASI Eksklusif',                        file: 'slide/Sesi-09.pdf', slide: 22 },
    SLD_10: { tipe: 'dokumen', judul: 'Materi Sesi 10', judulPanjang: 'Imunisasi dan Menjaga Bayi Tetap Sehat',                   file: 'slide/Sesi-10.pdf', slide: 10 }
  },

  /* Catatan dampak — sesi yang jadi tanpa materi setelah PDF ditahan:
       Wilayah TTD : S4, S6, S7, S8, S10          (5 dari 10)
       Wilayah MMS : S3, S4, S6, S7, S8, S10      (6 dari 10)
     Sebabnya konsep KIARA hanya menyebut video di 7 titik; sesi-sesi itu
     memang tidak punya video. Menunggu keputusan puskesmas soal penggantinya. */

  /* ══════════════════════════════════════════════════════════
     B. PETA SESI AKTIF — sesi 1–4

     Puskesmas konfirmasi (2 Agu): baru sesi 1–4 yang dipakai. Sesi 5–10
     ditahan di `sesiDitahan` karena materinya belum ada.

     Jumlah materi per sesi TIDAK selalu 2 — beda dari FORMAT KIARA.
     `setSoal` merujuk ke bank soal (1–4) dari buku fasilitator.

     PEMBAGIAN SOAL — puskesmas konfirmasi tiap sesi hanya 5 soal, dan
     lulus = 4 dari 5 benar (KKM 80). Bank soal buku berisi 10 soal per
     pertemuan, jadi setiap set dibelah dua:

       `bagianSoal: 1` → soal ke-1 sampai ke-5
       `bagianSoal: 2` → soal ke-6 sampai ke-10

     Dua sesi yang memakai set yang sama diberi bagian berbeda supaya
     tidak ada soal yang terulang di sesi berurutan.

     ⚠️ Pemetaan sesi → set soal DAN pembelahan 10 soal jadi dua bagian
        disusun berdasarkan urutan di buku, BUKAN dari instruksi
        puskesmas. Perlu dikonfirmasi: apakah 5 soal yang dipakai memang
        5 pertama / 5 terakhir, atau puskesmas punya pilihan sendiri.

     Kalau menambah / mengurangi sesi di sini, sesuaikan juga
     TOTAL_SESI di config.js.
     ══════════════════════════════════════════════════════════ */
  sesi: [
    {
      ke: 1,
      judul: 'Kehamilan yang Sehat',
      label: 'Buku KIA & Gizi 1000 HPK',
      setSoal: 1, bagianSoal: 1,
      materi: ['VID_MATERNAL_1', 'VID_GIZI_1000HPK'],
      pokok: ['Tentang Buku KIA dan manfaatnya', 'Gizi dalam 1000 HPK',
              'Pengertian kehamilan', 'Keluhan umum saat hamil dan cara mengatasinya',
              'Perubahan tubuh dan mental ibu selama kehamilan']
    },
    {
      ke: 2,
      judul: 'Pemeriksaan Kehamilan & Gizi',
      label: 'Pemeriksaan ANC, KEK & TTD',
      setSoal: 1, bagianSoal: 2,
      materi: ['VID_MATERNAL_2', 'VID_KEK', 'VID_GIZI_BUMIL'],
      pokok: ['Jenis pelayanan pemeriksaan kehamilan dan manfaat setiap kunjungan',
              'Ibu hamil KEK', 'Penambahan BB sesuai IMT pra hamil',
              'Anemia dan Tablet Tambah Darah / MMS',
              'Manfaat TTD/MMS mencegah anemia dan BBLR']
    },
    {
      ke: 3,
      judul: 'Perawatan Diri Selama Kehamilan',
      label: 'Perawatan diri & mitos',
      setSoal: 3, bagianSoal: 1,
      materi: ['VID_MITOS_TTD'],   // wilayah MMS: kosong, tidak ada padanan videonya
      pokok: ['Perawatan sehari-hari ibu hamil',
              'Hal-hal yang tidak boleh dilakukan selama kehamilan',
              'Aktivitas fisik yang tidak boleh dilakukan',
              'Mitos selama kehamilan, mitos dan fakta TTD']
    },
    {
      ke: 4,
      judul: 'Tanda Bahaya & Faktor Risiko',
      label: 'Tanda bahaya & penyakit penyerta',
      setSoal: 3, bagianSoal: 2,
      materi: [],   // kosong - materi PDF ditahan, belum ada pengganti
      pokok: ['Tanda bahaya kehamilan', 'Lembar pemantauan ibu hamil', 'Kesehatan jiwa',
              'Diabetes gestasional, obesitas, malaria',
              'Infeksi Menular Seksual (IMS), tripel eliminasi',
              'Anemia pada kehamilan']
    },
  ],

  /* ══════════════════════════════════════════════════════════
     B2. SESI DITAHAN — sesi 5–10, tidak aktif

     Puskesmas konfirmasi materi untuk sesi ini belum ada.
     Untuk menghidupkan kembali:
       1. pindahkan entri yang sudah siap ke `sesi` di atas
       2. naikkan TOTAL_SESI di config.js sesuai jumlah barunya

     Video yang sudah ada di media/ tapi baru terpakai di sesi ditahan:
       VID_IMD (18 MB), VID_ASI_EKSKLUSIF (30 MB), VID_PELEKATAN (59 MB)
     File-nya sengaja tidak dihapus karena akan dipakai lagi.

     ⚠️ SOAL BELUM CUKUP UNTUK SESI INI. Dengan aturan 5 soal per sesi,
        satu set 10 soal hanya cukup untuk DUA sesi. Tapi peta topik
        menaruh 4 sesi (5, 6, 7, 8) di set 2, dan 2 sesi (9, 10) di set 4.
        Artinya sesi 5 & 7 akan memakai soal yang sama, begitu juga 6 & 8.
        `bagianSoal` di bawah sudah diisi supaya tidak error, tapi ini
        HARUS dibereskan sebelum sesi 5–10 dihidupkan — entah puskesmas
        menambah bank soal, atau peta sesi→set diubah.
     ══════════════════════════════════════════════════════════ */
  sesiDitahan: [
    {
      ke: 5,
      judul: 'Persiapan Persalinan & IMD',
      label: 'Persalinan & IMD',
      setSoal: 2, bagianSoal: 1,
      materi: ['VID_IMD'],
      pokok: ['Persiapan persalinan', 'Tanda persalinan', 'Proses persalinan',
              'Inisiasi Menyusu Dini (IMD)']
    },
    {
      ke: 6,
      judul: 'Nifas & Mitos Masa Nifas',
      label: 'Nifas & mitos nifas',
      setSoal: 2, bagianSoal: 2,
      materi: [],   // kosong - materi PDF ditahan, belum ada pengganti
      pokok: ['Tanda bahaya setelah melahirkan', 'Pelayanan nifas',
              'Menjaga kesehatan ibu dan bayi pada masa nifas',
              'Lembar pemantauan ibu nifas', 'Mitos pada masa nifas']
    },
    {
      ke: 7,
      judul: 'Menjaga Ibu Nifas & Bayi Sehat',
      label: 'Ibu nifas & bayi sehat',
      setSoal: 2, bagianSoal: 1,   // ⚠️ sama dengan sesi 5
      materi: [],   // kosong - materi PDF ditahan, belum ada pengganti
      pokok: ['Menjaga ibu bersalin, nifas, dan bayi sehat',
              'Tanda bahaya pada ibu nifas',
              'Hal-hal yang tidak boleh dilakukan setelah melahirkan',
              'Depresi setelah melahirkan']
    },
    {
      ke: 8,
      judul: 'KB Pasca Persalinan',
      label: 'KB pasca persalinan',
      setSoal: 2, bagianSoal: 2,   // ⚠️ sama dengan sesi 6
      materi: [],   // kosong - materi PDF ditahan, belum ada pengganti
      pokok: ['KB pasca persalinan', 'Metode Amenorhae Laktasi (MAL)']
    },
    {
      ke: 9,
      judul: 'Bayi Baru Lahir & ASI Eksklusif',
      label: 'Bayi baru lahir & ASI',
      setSoal: 4, bagianSoal: 1,
      materi: ['VID_ASI_EKSKLUSIF', 'VID_PELEKATAN'],
      pokok: ['Tanda bayi lahir sehat', 'Tanda bahaya bayi baru lahir', 'Cacat bawaan',
              'Perawatan bayi baru lahir dan pelayanan neonatus',
              'Perawatan Metode Kangguru (PMK)',
              'ASI eksklusif, posisi pelekatan, cara memerah dan menyimpan ASI',
              'Layanan konseling menyusui']
    },
    {
      ke: 10,
      judul: 'Imunisasi & Perawatan Bayi',
      label: 'Imunisasi & perawatan bayi',
      setSoal: 4, bagianSoal: 2,
      materi: [],   // kosong - materi PDF ditahan, belum ada pengganti
      pokok: ['Imunisasi', 'Menjaga bayi tetap sehat',
              'Hal-hal yang harus dihindari dalam merawat bayi baru lahir',
              'Akta kelahiran', 'Peran suami', 'Mitos perawatan bayi']
    }
  ],

  /* ══════════════════════════════════════════════════════════
     C. BANK SOAL — Benar / Salah

     Sumber: Buku Pegangan Fasilitator Kelas Ibu Hamil 2025,
             Tabel 22–25, halaman 169–172.

     Format berubah total dari FORMAT KIARA:
       • bukan pilihan ganda A/B/C, tapi Benar/Salah
       • bank soal 4 set × 10 soal = 40 soal

     YANG DIPAKAI PER SESI HANYA 5 SOAL. Puskesmas konfirmasi (4 Agu)
     tiap sesi berisi pre-test dan post-test 5 soal, lulus 4 dari 5.
     Jadi tiap set 10 soal dibelah dua lewat `bagianSoal` di peta sesi:
     bagian 1 = soal 1–5, bagian 2 = soal 6–10. Dengan 5 soal, satu soal
     bernilai 20 poin dan skor hanya 0/20/40/60/80/100.

     kunci: true = Benar, false = Salah
     varian: soal yang berbeda antara wilayah TTD dan MMS
     perluKonfirmasi: kunci jawaban di buku terlihat keliru — lihat README
     ══════════════════════════════════════════════════════════ */
  setSoal: {

    // ── Tabel 22 — Pertemuan I ────────────────────────────────
    1: {
      nama: 'Pertemuan I',
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

    // ── Tabel 23 — Pertemuan II ───────────────────────────────
    2: {
      nama: 'Pertemuan II',
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

    // ── Tabel 24 — Pertemuan III ──────────────────────────────
    3: {
      nama: 'Pertemuan III',
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

    // ── Tabel 25 — Pertemuan IV ───────────────────────────────
    4: {
      nama: 'Pertemuan IV',
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
