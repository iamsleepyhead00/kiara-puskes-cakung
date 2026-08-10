# KIARA — Kelas Ibu Hamil Digital

Aplikasi edukasi ibu hamil untuk **Puskesmas Kecamatan Cakung**. Pasien scan QR di
ruang tunggu, aplikasi mengenali NIK dan otomatis tahu ini sesi ke berapa dari 10.

## Dokumen acuan

| Dokumen | Peran |
|---|---|
| `konsep KIARA.docx` (2 Agu 2026) | **acuan aktif** — 10 sesi, form, nomor WA |
| `FORMAT KIARA.docx` (31 Jul 2026) | sudah digantikan, jangan dipakai lagi |
| Buku Pegangan Fasilitator Kelas Ibu Hamil 2025, hal. 169–172 | bank soal (40 soal Benar/Salah, dipakai 5 per sesi) |
| `MATERI 1-10 KIARA.zip` | 10 slide deck per sesi + buku fasilitator |
| `drive-download-...zip` | 15 mp4 + 7 PDF komik, terbagi wilayah TTD & MMS |

---

## Struktur

| File | Isi |
|---|---|
| `index.html` | Markup 12 screen + modal koreksi manual (SPA) |
| `style.css` | Palet rose/maternal, mobile-first |
| `config.js` | **Satu-satunya file yang perlu diubah saat deploy** |
| `content.js` | Pustaka materi, peta 10 sesi, 4 set soal, template WA |
| `visit-tracker.js` | Auto-detect sesi: hash NIK, lookup riwayat, guard duplikat |
| `app.js` | Router, engine kuis Benar/Salah, gate materi, scoring, submit |
| `gas/Code.gs` | Google Apps Script — 2 sheet, `lookup` / `save` / `waSent` |

---

## Alur

```
S1 Splash
  └→ S2 Identifikasi ──→ hash NIK ──→ lookup riwayat
        (NIK, Nama, HP,               ├→ sudah 10 sesi ────→ S10 Sudah Lulus
         Alamat, Kelurahan,           ├→ submit hari ini ──→ S11 Duplikat
         Puskesmas)                   └→ S3 Konfirmasi Sesi
                                           (S3a Koreksi Manual)
                                             └→ S4 Pre-Test (5 soal B/S)
                                                └→ S5 Hasil Pre-Test
                                                   └→ S6 Materi (n item, tiap item bergate)
                                                      └→ S7 Post-Test (5 soal + feedback)
                                                         └→ simpan ke Sheets
                                                            ├→ ≥ KKM → S8 Hasil Akhir
                                                            └→ < KKM → S12 Belum KKM
                                                                       (simak ulang / ulangi)
                                S9 Progress 10 Sesi — dari S8 atau S11
```

Sertifikat kelulusan **tidak ada** — lihat bagian "Yang Di-Hold".

### Panjang program: 10 sesi, baru 4 yang bisa dijalankan

Dua angka di `config.js`, dan bedanya penting:

| Konfigurasi | Arti |
|---|---|
| `TOTAL_SESI: 10` | panjang program sebenarnya. Semua tampilan menyebut "dari 10", status LULUS baru terbit setelah kunjungan ke-10 |
| `SESI_TERSEDIA: 4` | berapa sesi yang benar-benar bisa dijalankan aplikasi |

Sesi 5–10 terdaftar di `content.js` dengan judul dan pokok bahasan, tapi
`materi` dan `setSoal` kosong — puskesmas baru mengirim K.1–K.4. Ibu yang
riwayatnya sampai di sesi 5 melihat layar `s-belum` ("Materi Belum Tersedia"),
bukan pre-test nol soal.

Dropdown koreksi sesi difilter `SESI_TERSEDIA`, jadi petugas tidak bisa memilih
sesi yang soalnya kosong.

Untuk menghidupkan satu sesi: isi `materi` dan `setSoal`-nya di `content.js`
(tiap topik berisi `SOAL_PER_TOPIK` = 5 soal), lalu naikkan `SESI_TERSEDIA`.

⚠️ Judul sesi 5–10 dari nama slide deck `MATERI 1-10 KIARA.zip` kiriman
puskesmas — sumbernya sah, tapi penomoran deck itu belum tentu sejajar dengan
penomoran K.1–K.4. Perlu dikonfirmasi.

### Layar penuh video

Kontrol bawaan video dimatikan oleh `ANTI_SKIP` karena membawa progress bar
yang bisa digeser — dan tombol layar penuh ikut hilang bersamanya. Diganti
tombol sendiri (`#mt-fs`) yang me-fullscreen **kotak pembungkus** `.vid`, bukan
elemen `<video>`. Kalau elemen videonya yang di-fullscreen, browser
memunculkan pemutar bawaannya lengkap dengan seek bar.

Bar progres tetap tampil di layar penuh. Aplikasi juga mencoba memutar layar ke
lanskap; banyak browser menolak dan kegagalannya diabaikan.

⚠️ **Safari iOS tidak mendukung fullscreen untuk elemen sembarang**, hanya
untuk `<video>`. Di sana tombolnya tidak muncul — itu pilihan sadar, lebih baik
tidak ada tombol daripada tombol yang menghadirkan seek bar.

### Kecepatan

Tiga hal yang menentukan aplikasi ini terasa cepat atau lambat:

**1. `handleSave` di backend.** Dulu membaca seluruh sheet empat kali untuk satu
penyimpanan (`bedaHeader`, `ambilData`, `nomorBerikut`, lalu `handleLookup` di
akhir). Setiap panggilan Sheets dari Apps Script itu perjalanan jaringan.
Sekarang satu `getValues()` untuk header + data, nomor urut dan riwayat dihitung
dari memori. Tulisan juga dibatch. Hasilnya 4 pembacaan + 3 tulisan → 1 + 1.

**2. Pra-ambil riwayat.** NIK adalah kolom pertama. Begitu 16 digitnya lengkap,
pencarian riwayat jalan di belakang layar sementara ibu masih mengisi lima
kolom lainnya. Saat SUBMIT ditekan hasilnya biasanya sudah siap. Hasil hanya
dipakai kalau NIK-nya masih sama; kegagalannya ditelan dan
`jalankanLookup()` mencoba lagi normal.

**3. `VT.pemanasan()`.** Ping murah untuk membangunkan container Apps Script
yang kena cold start. Dipanggil saat splash dan saat post-test mulai — yang
kedua penting karena penyimpanan terjadi ±1 menit kemudian, saat container bisa
sudah dingin lagi. Tidak jalan saat `OFFLINE_MODE`.

Kalau `handleSave` masih terasa lambat setelah semua ini, yang perlu diperiksa
pertama: **apakah `Code.gs` sudah di-deploy?** Perbaikan backend tidak ada
efeknya sampai deployment diperbarui. Cek dengan `?action=ping` — harus balas
`versi: 8`.

### Ikon dan animasi splash

Ikon aplikasi memakai **Google Material Symbols `pregnant_woman` varian Rounded**,
lisensi **Apache 2.0** — bebas komersial, boleh dimodifikasi, atribusi tidak
diwajibkan. Sumber: [google/material-design-icons](https://github.com/google/material-design-icons).

Dipasang sebagai SVG inline di **tiga tempat**: splash (S1) dan header (S2 dst)
di `index.html`, plus `icons/favicon.svg`. Kalau diganti, ganti ketiganya.

Bentuknya padat (fill), berbeda dari ikon Lucide lain di aplikasi yang bergaris.
Itu disengaja: di favicon 16px garis tipis nyaris hilang.

Splash memakai animasi **halo berdenyut** — dua cincin menyebar keluar dari
kotak logo, plus hati kecil di bawah tulisan KIARA yang ikut berdenyut. Keduanya
mulai setelah 0,7 detik supaya tidak bertabrakan dengan animasi masuk yang juga
memakai `transform`. Siklusnya 1,9 detik, dibatasi `SPLASH_DURATION_MS` yang
hanya 2500ms.

Untuk pengguna yang menyetel `prefers-reduced-motion`, cincin halo
**dimatikan total**, bukan dipercepat — aturan `animation-duration:.01ms` pada
animasi `infinite` justru membuatnya berkedip cepat.

### Melanjutkan sesi yang tertunda

Kalau browser tertutup di tengah sesi, progres ibu tidak hilang. Saat aplikasi
dibuka lagi muncul layar `s-lanjut` yang **menawarkan** melanjutkan dari tempat
terakhir — termasuk progres nonton video, jadi video 68 MB tidak perlu ditonton
ulang dari nol.

| Aturan | Alasan |
|---|---|
| Berlaku **sehari saja** | Progres kemarin tidak dipulihkan — ibu datang untuk kunjungan baru |
| **Ditawarkan**, tidak otomatis | Kalau HP-nya dipakai ibu lain, dia tidak terjebak melanjutkan data orang |
| **Dihapus setelah tuntas** | Mencegah pemulihan memicu submit dobel |
| Dipertahankan kalau simpan **gagal** | Ibu bisa buka ulang dan coba kirim lagi |

Layar yang bisa dipulihkan: S3–S7 dan S12. Progres disimpan di `localStorage`
kunci `kiara_progres_v1`. Soal tidak ikut disimpan — dibangun ulang dari
`content.js`, dan kalau jumlahnya tidak lagi cocok progresnya dibuang supaya
jawaban tidak bergeser.

Uji dari console: `KIARA_DEBUG.bacaProgres()`, `KIARA_DEBUG.hapusProgres()`.

---

## Peta Kunjungan 1–4

Sumber: `drive-download-20260809T015409Z-1-001` dari puskesmas (9 Agustus 2026),
**dengan kunci jawaban ditandai huruf tebal**. Prefiks `K.1`–`K.4` pada nama
berkas = kunjungan 1–4.

Tiap topik punya satu video dan satu set 5 soal. Seluruh topik dalam satu
kunjungan digabung jadi **satu** pre-test dan **satu** post-test — supaya
struktur 13 kolom sheet tetap utuh (satu baris per kunjungan, satu skorPre,
satu skorPost).

| Kunj. | Topik | Video | Soal |
|---|---|---|---|
| 1 | Tanda Kehamilan & Pemeriksaan | `K1-Tanda-Kehamilan.mp4` (9 MB) | 5 |
| 1 | 1000 HPK | `K1-Gizi-1000-HPK.mp4` (51 MB) | 5 |
| 2 | Gizi Ibu Hamil | `K2-Gizi-Ibu-Hamil.mp4` (68 MB) | 5 |
| 2 | Ibu Hamil KEK | `K2-KEK.mp4` (42 MB) | 5 |
| 3 | Perawatan Sehari-hari | `K3-Perawatan-Sehari-hari.mp4` (4 MB) | 5 |
| 3 | Mitos dan Fakta | `K3-Mitos-dan-Fakta.mp4` (20 MB) | 5 |
| 3 | **Anemia** | `K3-Anemia.mp4` (13 MB) — dari EduCatin | 5 |
| 4 | Hal yang Harus Dihindari | `K4-Hal-yang-Dihindari.mp4` (13 MB) | 5 |
| 4 | Tanda Bahaya Kehamilan | `K4-Tanda-Bahaya.mp4` (14 MB) | 5 |

Total media aktif **233 MB** dalam 9 berkas, terbesar 68 MB — semuanya di bawah
batas 100 MB/berkas GitHub.

### ⚠️ Jumlah soal per kunjungan tidak seragam

Kunjungan 3 punya **tiga** topik, sisanya dua:

| Kunjungan | Soal | KKM 80 berarti |
|---|---|---|
| 1, 2, 4 | 10 | 8 dari 10 |
| **3** | **15** | **12 dari 15** |

Persentase lulusnya sama (80%), jumlah soalnya beda. Skor dihitung
`benar / jumlah soal × 100` dibulatkan, jadi 15 soal menghasilkan 0, 7, 13, 20,
27, 33, … 100.

**Karena itu validasi "skor harus kelipatan 10" di `gas/Code.gs` dicabut** dan
diganti batas bilangan bulat 0–100. Ini sudah di-deploy dan terverifikasi pada
`versi: 10`: seluruh 16 kemungkinan skor 15 soal diterima, dan garis LULUS
jatuh tepat di 12/15.

Sejak `versi: 10`, skor **kosong** juga ditolak (`"Post-Test tidak terkirim"`)
alih-alih ditulis 0 diam-diam. Skor 0 yang sungguhan tetap diterima.

Peredam lain tetap jalan: clamp KKM, throttle, anti-injeksi formula, dan validasi
kelurahan/puskesmas/nama/NIK.

`SOAL_PER_TOPIK: 5` di `config.js` dipakai untuk memeriksa kewajaran, bukan
memotong — jumlah soal sebenarnya dihitung dari `setSoal` di `content.js`.

### Video anemia dari EduCatin

Puskesmas mengirim soal Anemia tanpa videonya. Atas instruksi klien (9 Agu),
videonya diambil dari `dashboard/questionnaire/video-anemia.mp4` (EduCatin) dan
disalin ke `media/K3-Anemia.mp4`.

### Berkas yang tidak dipakai

`SOAL PRETEST & POSTTEST IMUNISASI.docx` hanya ada di paket 5 Agustus, **tanpa
prefiks K** sehingga belum jelas masuk kunjungan ke berapa, dan paket 9 Agustus
tidak menyertakannya lagi. Soalnya ada di `setSoalDitahan` dengan **kunci masih
turunan** — harus diverifikasi bidan kalau nanti diaktifkan.

### ⚠️ Hati-hati: ekstensi berkas bisa menipu

Tiga berkas di paket 9 Agustus berekstensi `.docx` tapi isinya **mp4**:
`K.1 TANDA KEHAMILAN.docx`, `K.3 VIDEO PERAWATAN....docx`,
`K.4 VIDEO HAL-HAL....docx`. Diperiksa dari magic bytes (`ftyp` di offset 4).

Ketiganya kebetulan duplikat byte-per-byte dari video yang sudah ada, jadi tidak
berdampak. Tapi kalau puskesmas mengirim lagi dengan pola sama, isinya bisa video
baru yang terlewat. **Periksa jenis berkas dari magic bytes, jangan percaya
ekstensinya.**

### Sumber yang tidak lagi dipakai

Bank soal Buku Pegangan Fasilitator (4 set × 10 soal) dan paket video TTD/MMS
tidak dihapus, dipindah ke `setSoalDitahan` dan `materiDitahan` di `content.js`.
Rujukan resmi kalau kunjungan 5+ butuh soal dan puskesmas belum mengirim.

Wilayah TTD/MMS **tidak lagi memengaruhi materi** — paket baru hanya satu set.
Masih memengaruhi satu kunci soal (K.1 no. 5, "semua ibu hamil dapat TTD").

---

## Cara Menjalankan Lokal

Web Crypto API (hash NIK) butuh HTTPS atau `localhost`. Jangan buka lewat `file://`.

```powershell
cd dashboard\kiara-puskes-cakung
python -m http.server 8000
```

Buka `http://localhost:8000`. `OFFLINE_MODE` sekarang `false` — data masuk ke sheet
sungguhan. Setel `true` kalau perlu uji alur tanpa mengotori sheet, lalu reset
riwayat dari console: `KIARA_DEBUG.resetOffline()`.

Cek pemetaan dari console: `KIARA_DEBUG.soalSesi(3)` dan `KIARA_DEBUG.materiSesi(3)`.

---

## Menyiapkan Media

Enam video aktif **sudah ada** di `media/`, diambil dari folder `DATA BASE VIDEO`
dan dirapikan namanya:

```
media/
├── K1-Tanda-Kehamilan.mp4          9 MB
├── K1-Gizi-1000-HPK.mp4           51 MB
├── K2-Gizi-Ibu-Hamil.mp4          68 MB
├── K2-KEK.mp4                     42 MB
├── K3-Perawatan-Sehari-hari.mp4    4 MB
└── K4-Hal-yang-Dihindari.mp4      13 MB
```

Sisa berkas di `media/` (paket TTD/MMS lama, `Video-Maternal-*`, folder `TTD/`
dan `MMS/`) **tidak dipakai** aplikasi. Definisinya ada di `materiDitahan`.

Tiga di antaranya duplikat byte-per-byte dari berkas di atas — boleh dihapus untuk
menghemat 160 MB:

```
media/MMS/1-Video-Gizi-1000-Hari.mp4   = K1-Gizi-1000-HPK.mp4
media/MMS/3-Video-Gizi-Ibu-Hamil.mp4   = K2-Gizi-Ibu-Hamil.mp4
media/2-Video-Audio-KEK.mp4            = K2-KEK.mp4
```

Seluruh PDF (komik + slide) sudah dihapus dari disk — materi PDF tidak dipakai
sejak konfirmasi puskesmas 2 Agustus.

### Catatan lama — hanya berlaku kalau materi PDF dihidupkan lagi

Dua pekerjaan mekanis yang belum dilakukan:

**1. Konversi slide.** File aslinya `.pptx` dan tidak bisa ditampilkan di browser.
Perlu diekspor ke PDF:

```powershell
# butuh LibreOffice terpasang
soffice --headless --convert-to pdf --outdir media\slide "MATERI 1-10 KIARA\*.pptx"
```

Lalu ganti nama sesuai urutan sesi (`KUNJUNGAN KE - 1` → `Sesi-01.pdf`, dst).

**2. Kompres video paket lama.** Berlaku hanya kalau `Video-Maternal-1` (366 MB)
atau `Video-Maternal-2` (309 MB) dipakai lagi — keduanya melewati batas keras
100 MB/berkas GitHub dan tidak bisa di-commit sama sekali. Presedennya
`dashboard/questionnaire/compress_video.py` dari EduCatin.

---

## Hosting Video

Paket aktif **186 MB**, berkas terbesar 68 MB — semuanya lolos batas 100 MB/berkas
GitHub. 186 MB per ibu untuk 4 kunjungan, kuota GitHub Pages 100 GB/bulan →
**±537 ibu/bulan**.

Artinya video bisa langsung ikut repo. `.gitignore` masih memblokirnya karena
sekali di-push, blob 186 MB permanen di riwayat git dan repo masih publik. Kalau
disetujui, tambahkan:

```gitignore
!media/K1-Tanda-Kehamilan.mp4
!media/K1-Gizi-1000-HPK.mp4
!media/K2-Gizi-Ibu-Hamil.mp4
!media/K2-KEK.mp4
!media/K3-Perawatan-Sehari-hari.mp4
!media/K4-Hal-yang-Dihindari.mp4
```

Alternatifnya:

1. **YouTube unlisted + embed** — bandwidth Rp 0, kualitas menyesuaikan sinyal
   otomatis. Di `content.js` ubah jadi `{ tipe:'youtube', youtubeId:'...' }`.
   App sudah mendukung watch-gate lewat IFrame Player API. **Perlu izin
   puskesmas** — link unlisted tetap terlihat di source aplikasi.
2. **Cloudflare Pages / R2** — bandwidth tanpa batas, egress $0. Lebih bersih,
   tapi mp4 statis tidak bisa menurunkan resolusi otomatis saat sinyal lemah.

`PLACEHOLDER_MODE` sudah `false` — gate materi asli sudah aktif.

---

## Deploy

### 1. Backend — Google Sheets + Apps Script

1. Spreadsheet baru → **Extensions → Apps Script**
2. Tempel isi `gas/Code.gs`, Save
3. **Run → setupSheets** sekali, beri izin. Membuat `MASTER_PASIEN` (14 kolom)
   dan `LOG_KUNJUNGAN` (14 kolom)
4. **Deploy → New deployment → Web app** — Execute as: **Me**, Who has access: **Anyone**
5. Salin Web app URL ke `SHEETS_ENDPOINT`

> Setiap `Code.gs` diubah: **Deploy → Manage deployments → Edit → New version.**
> Kalau tidak, perubahan tidak terpakai.

### 2. Isi `config.js`

```js
WILAYAH: 'TTD',            // atau 'MMS' — konfirmasi dulu
SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfyc.../exec',
OFFLINE_MODE: false,
PLACEHOLDER_MODE: false,   // setelah media siap
```

### 3. Frontend — GitHub Pages

```powershell
cd dashboard\kiara-puskes-cakung
git init
git add .
git commit -m "KIARA - aplikasi kelas ibu hamil Puskesmas Cakung"
git branch -M main
git remote add origin https://github.com/iamsleepyhead00/kiara-puskes-cakung.git
git push -u origin main
```

**Settings → Pages → Source: main / (root)**. Jangan commit folder `media/`
kalau videonya masih mp4 besar — pakai `.gitignore`.

### 4. QR Code

Generate dari URL Pages, cetak, tempel di ruang tunggu.

---

## Yang Di-Hold

**Sertifikat kelulusan.** `konsep KIARA.docx` menulis:

> "KALAU SUDAH KUNJUNGAN 10x mengikuti, TERBIT SERTIFIKAT LULUS **(Di hold dlu)**"

Puskesmas menahan fitur ini, jadi **tidak dibangun**. Setelah 10 sesi, alur berhenti
di S10 (rekap) + kirim WhatsApp. `ENABLE_SERTIFIKAT: false` di `config.js` sengaja
dibiarkan sebagai penanda. Jangan kerjakan sampai ada instruksi baru.

---

## ⚠️ Wajib Dibereskan Sebelum Dipakai Pasien

| # | Item | Lokasi | Kenapa penting |
|---|---|---|---|
| 1 | **Deploy `Code.gs` ke `versi: 12`** | `gas/Code.gs` | Deployment masih `versi: 10`. Opsi tempat periksa "Klinik/Praktik Bidan" belum dikenal backend, jadi ibu yang memilihnya **gagal simpan** dengan pesan "Puskesmas tidak dikenal". Cek berhasil: `?action=ping` balas `versi: 12`. |
| 2 | **Setelan grup WhatsApp** | `config.js` → `WA_GRUP_LINK` | Tautan undangan grup ada di repo publik. Di dalam grup, nomor HP antar anggota saling terlihat — itu data ibu hamil. Nyalakan "Setujui anggota baru", atau kosongkan `WA_GRUP_LINK` dulu. |
| 3 | **Endpoint Apps Script terbuka** | `config.js` → `SHEETS_ENDPOINT` | URL memberi akses tulis ke sheet bagi siapa pun yang memilikinya, dan repo publik berarti bisa ditemukan pemindai. Ganti deployment (URL baru) atau jadikan repo private. |
| 4 | **Jalankan `hapusUji()`** | Apps Script | 8 baris uji NIK `9999999999999999` masih di sheet. Fungsi itu hanya menyapu baris yang NIK **dan** namanya cocok `UJI COBA - HAPUS`. |
| 5 | **Kunjungan untuk soal Imunisasi** | `content.js` → `setSoalDitahan` | Berkasnya tanpa prefiks K, belum jelas kunjungan ke berapa. Ditahan, tidak dipakai. |
| 6 | **Template pesan WhatsApp** | `content.js` → `waTemplateHasil` | Dokumen tidak memuat format pesan. Perlu disetujui bidan. |
| 7 | **Rujukan halaman Buku KIA** | belum ada di kode | Satu-satunya revisi klien yang belum dikerjakan. Butuh 8 nomor halaman dari bidan. |

**Sudah selesai:** kunci jawaban resmi (bukan turunan lagi), video untuk seluruh
9 topik aktif, hosting video di repo, dan wilayah TTD/MMS yang kini tidak lagi
memengaruhi konten aktif. Item `perluKonfirmasi` diabaikan atas keputusan klien
9 Agustus — kunci resmi puskesmas dipakai apa adanya.

Saat aplikasi dibuka, semua item yang masih tersisa muncul otomatis sebagai
peringatan di **console browser**.

### Kunci jawaban — sudah resmi sejak 9 Agustus

Paket 9 Agustus menandai jawaban yang benar dengan **huruf tebal** di berkas
.docx. Kunci dibaca langsung dari penanda itu lewat `python-docx` (`run.bold`),
jadi penanda `kunciTurunan` sudah dicabut dari seluruh set aktif.

Rinciannya di **`KUNCI-JAWABAN.md`** — 45 kunci resmi per kunjungan.

### Satu kunci resmi yang bertentangan

**K.3 Mitos dan Fakta no. 1** — *"Apakah selama kehamilan wajib melakukan periksa
hamil rutin?"* → kunci resmi **Salah**.

Itu bertentangan dengan **no. 5 di set yang sama** — *"Tidak perlu periksa hamil
jika tidak ada keluhan"* → juga **Salah**. Dua-duanya tidak bisa benar sekaligus.

Dugaan: seluruh set berisi mitos yang dijawab Salah, dan no. 1 terbawa padahal
kalimatnya bukan mitos. Ditulis apa adanya dan ditandai `perluKonfirmasi` —
konten kesehatan tidak dikoreksi sendiri. **Tanyakan ke bidan sebelum dipakai
pasien.**

### Kenapa kunci jawaban tidak boleh diturunkan sendiri

Sebelum 9 Agustus, berkas soal tidak memuat kunci sama sekali, jadi kunci
diturunkan dari pedoman Buku KIA. Setelah kunci resmi datang, **38 dari 40
cocok** — dua yang salah:

| Soal | Kunci turunan | Kunci resmi |
|---|---|---|
| K.1 Tanda Kehamilan no. 4 — *"trimester kedua 1 kali"* | Benar | **Salah** |
| K.2 KEK no. 5 — *"mual dan tidak nafsu makan menyebabkan KEK"* | Benar | **Salah** |

Yang pertama sudah ditandai perlu konfirmasi karena bergantung pedoman. Yang
kedua sebelumnya dinilai "tidak ambigu" — penilaian itu yang salah: KEK adalah
kekurangan energi *kronis*, sementara mual hamil bersifat akut.

Set **Imunisasi** di `setSoalDitahan` kuncinya **masih turunan** — harus
diverifikasi kalau nanti diaktifkan.

Bank soal buku fasilitator di `setSoalDitahan` punya kunci **asli dari buku** —
kecuali dua yang memang terlihat salah cetak (Pertemuan II no. 3 soal IMD, dan
Pertemuan III no. 3 varian MMS soal tinja kehitaman). Keduanya ditulis apa adanya
dan ditandai `perluKonfirmasi`.

---

## Keputusan yang Belum Diambil Puskesmas

| Pertanyaan | Perilaku sekarang |
|---|---|
| Pasien lompat sesi — urut atau ikut usia kehamilan? | **Urut.** S3 → berikutnya selalu S4. Bisa dioverride lewat koreksi manual. |
| Kehamilan berikutnya — counter reset? | **Tidak reset.** Kolom `NO_KEHAMILAN` sudah ada, default 1, belum dipakai. |
| Post-test boleh diulang berapa kali? | **Tanpa batas**, nilai terakhir yang dikirim. Atur `MAX_PERCOBAAN_POST`. |
| Bidan butuh dashboard rekap? | Di luar scope. `admin.html` belum dibuat. |
| Materi berbasis video atau slide? | Dua-duanya dipakai. Konsep menyebut video hanya di 7 titik; 5 sesi tanpa video sama sekali. |

---

## Catatan Teknis

**Istilah.** `konsep KIARA.docx` memakai "SESI" untuk materi tapi "KUNJUNGAN" di
form input. Aplikasi memakai "Sesi" di seluruh layar konten, dan kolom database
tetap bernama `SESI_KE`. Perlu diseragamkan dengan puskesmas.

**Kenapa backend lewat GET, bukan POST.** Web App Apps Script membalas POST dengan
redirect 302 yang bikin CORS gagal di browser. Semua endpoint memakai GET
berparameter — pola yang sama dipakai EduCatin.

**Gate materi — anti-skip.** Event "video selesai" **tidak dipakai sebagai patokan**,
karena pasien bisa menggeser progress bar ke ujung dan event itu tetap memicu.
Yang dihitung adalah **akumulasi detik yang benar-benar diputar**: tiap pembacaan,
selisih waktu hanya dikreditkan kalau wajar (≤1,5 detik). Lompatan maju tidak
dihitung dan posisinya dibalikin ke titik sah terakhir. Tombol lanjut aktif setelah
`MIN_TONTON_PERSEN` (default 90%) tercapai. Berlaku sama untuk mp4 dan YouTube.

Saat `ANTI_SKIP: true`, progress bar pemutar disembunyikan (`controls: 0` untuk
YouTube, `controls=false` untuk mp4) dan pintasan keyboard dimatikan
(`disablekb: 1`). Jeda/putar tetap bisa lewat ketuk video.

Batasnya: ini menghentikan skip yang santai, bukan pembobolan yang niat. Siapa pun
yang membuka DevTools tetap bisa memanggil fungsi gate langsung. Untuk konteks
puskesmas ini sudah memadai; kalau butuh lebih ketat, verifikasinya harus di sisi
server dan itu pekerjaan terpisah.

Dokumen PDF tidak punya event "selesai", jadi gate-nya berbasis waktu baca minimal
(`DOKUMEN_DWELL_MS`, default 15 detik) lalu pasien menekan konfirmasi.
Di `PLACEHOLDER_MODE` semua gate dilepas setelah `PLACEHOLDER_DWELL_MS`.

**PDF di HP.** Sebagian browser HP tidak me-render PDF di dalam iframe. Karena itu
setiap dokumen selalu disertai tautan "Buka di tab baru" sebagai jalan pintas.

**Privasi NIK.** NIK tidak pernah dikirim atau disimpan mentah — hanya hash SHA-256
(lookup) dan mask `3175••••••••1234` (verifikasi visual bidan). Jangan share
spreadsheet dengan opsi *anyone with the link*.

**Race condition.** `handleSave` memakai `LockService` supaya dua pasien yang submit
bersamaan tidak saling menimpa counter sesi.

**Counter tidak pernah turun.** Kalau ada submit menyusul dengan nomor sesi lebih
kecil, `SESI_TERAKHIR` di `MASTER_PASIEN` tidak diubah.

**Kapasitas.** Google Sheets + Apps Script cukup untuk sekitar 40 pasien/hari
(~1.200 sesi/bulan). Di atas itu pertimbangkan Supabase.
