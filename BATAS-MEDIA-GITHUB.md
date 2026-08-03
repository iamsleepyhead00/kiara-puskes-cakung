# Media KIARA — Apa yang Tidak Bisa Masuk GitHub

Dokumen ini mendata file media Kelas Ibu Hamil dari puskesmas terhadap batas
teknis GitHub, dan apa yang harus dilakukan untuk masing-masing.

Sumber data: `drive-download-20260802T081008Z-1-001.zip` dan
`MATERI 1-10 KIARA-20260802T075419Z-1-001.zip`.
Total **33 file, 1.299,7 MB (1,27 GB)**.

---

## Kesimpulan

**GitHub tidak bisa dipakai untuk menampung video KIARA.** Ada tiga alasan, dan
alasan ketiga yang paling menentukan.

1. **2 file langsung ditolak.** Ukurannya di atas 100 MB, batas keras GitHub.
   Push akan gagal, bukan cuma diperingatkan.
2. **5 file lain kena warning** karena di atas 50 MB. Masih bisa masuk, tapi
   bikin repo berat dan clone lambat.
3. **Bandwidth-nya yang membunuh.** Satu ibu yang menyelesaikan 10 sesi akan
   mengunduh sekitar **1 GB video**. Hitungannya ada di bawah.

Yang harus dilakukan: **video dan komik dipindah ke YouTube unlisted atau
Cloudflare R2. Repo GitHub hanya berisi kode.**

---

## Batas GitHub yang Berlaku

| Batas | Angka | Sifat |
|---|---|---|
| Ukuran satu file | **100 MB** | Keras — push ditolak |
| Peringatan ukuran file | 50 MB | Lunak — hanya warning |
| Ukuran repo yang disarankan | 1 GB | Lunak |
| Ukuran situs GitHub Pages | 1 GB | Keras untuk Pages |
| Bandwidth GitHub Pages | ~100 GB/bulan | Lunak — bisa di-throttle |
| Git LFS gratis | 1 GB simpan + 1 GB transfer/bulan | Tidak cukup untuk kasus ini |

---

## 1. Ditolak GitHub — di atas 100 MB

Dua file ini **tidak bisa di-commit sama sekali**. Push akan gagal dengan
error `file is 366.40 MB; this exceeds GitHub's file size limit of 100.00 MB`.

| # | File | Ukuran | Dipakai di |
|---|---|---|---|
| 1 | `Copy of Video Maternal 1 - Kelas Ibu Hamil (FINAL SUB IDN).mp4` | **366,4 MB** | Sesi 1 |
| 2 | `Copy of Video Maternal 2 - Pemeriksaan ANC (FINAL SUB IDN).mp4` | **309,3 MB** | Sesi 2 |

**Subtotal: 675,7 MB** — lebih dari separuh seluruh paket media.

> Kedua file ini bukan bagian dari paket TTD/MMS. Namanya diawali "Copy of",
> jadi perlu dipastikan ke puskesmas apakah keduanya memang materi resmi atau
> kiriman tambahan.

---

## 2. Kena Warning — 50 sampai 100 MB

Masih bisa masuk GitHub, tapi tidak disarankan. Setiap `git clone` akan
menarik seluruh ukuran ini.

| # | File | Ukuran | Wilayah | Dipakai di |
|---|---|---|---|---|
| 1 | `7. Video TTD Mitos dan Fakta.mp4` | 98,5 MB | TTD | Sesi 3 |
| 2 | `3. Video GIZI IBU HAMIL.mp4` | 67,9 MB | MMS | Sesi 2 |
| 3 | `9. Video Posisi Pelekatan.mp4` | 59,4 MB | TTD | Sesi 9 |
| 4 | `13. Video Posisi Pelekatan.mp4` | 59,4 MB | MMS | Sesi 9 |
| 5 | `1. Video GIZI 1000 HARI.mp4` | 50,9 MB | MMS | Sesi 1 |

**Subtotal: 336,1 MB.** Nomor 3 dan 4 file yang sama persis — lihat bagian 4.

---

## 3. Ukurannya Aman, Tapi Tetap Sebaiknya di Luar Repo

Secara teknis boleh masuk GitHub. Tapi kalau video lain sudah pindah ke
YouTube/R2, video ini ikut saja supaya penanganannya seragam.

| File | Ukuran | Wilayah |
|---|---|---|
| `3. Video GIZI IBU HAMIL-TTD.mp4` | 47,4 MB | TTD |
| `2. Video Audio KEK.mp4` | 41,6 MB | TTD & MMS (kembar) |
| `1. Video Gizi 1000 HPK-TTD.mp4` | 32,7 MB | TTD |
| `8. / 12. Video ASI EKSKLUSIF.mp4` | 30,0 MB | TTD & MMS (kembar) |
| `5. Video IMD.mp4` | 17,6 MB | TTD & MMS (kembar) |

Dokumen PDF berikut **aman dan boleh masuk repo**:

| File | Ukuran |
|---|---|
| `Buku Pegangan Fasilitator Kelas Ibu Hamil 2025.pdf` | 13,6 MB |
| `4. Komik IMD.pdf` | 3,9 MB |
| `6. Komik MAMAMIA Anemia MMS_rev.pdf` | 2,1 MB |
| `10. Lagu MMS.pdf` | 2,0 MB |
| `6. Komik MAMAMIA Anemia dan TTD_rev.pdf` | 0,6 MB |
| `7. Komik MMS.pdf` | 0,3 MB |
| `11. MMS-Gambar otak anak.pdf` | 0,2 MB |
| 10 file `.pptx` slide materi | 2,7 MB total |

Catatan: buku fasilitator 13,6 MB itu rujukan internal, bukan materi yang
ditampilkan ke pasien. Tidak perlu ikut ke repo aplikasi.

---

## 4. File Kembar — Bisa Hemat 152,5 MB

Lima file identik (CRC dan ukuran sama persis) muncul dua kali karena
disalin ke folder TTD dan MMS:

| File | Ukuran | Muncul |
|---|---|---|
| `Video Posisi Pelekatan.mp4` | 59,4 MB | TTD & MMS |
| `Video Audio KEK.mp4` | 41,6 MB | TTD & MMS |
| `Video ASI EKSKLUSIF.mp4` | 30,0 MB | TTD & MMS |
| `Video IMD.mp4` | 17,6 MB | TTD & MMS |
| `Komik IMD.pdf` | 3,9 MB | TTD & MMS |

Kalau disimpan sekali saja, hemat **152,5 MB**. Struktur folder `media/` di
`content.js` sudah menerapkan ini: file kembar diletakkan di root, file khusus
wilayah di subfolder `TTD/` dan `MMS/`.

| | Ukuran |
|---|---|
| Total mentah | 1.299,7 MB |
| Setelah dedup | **1.147,2 MB** |
| Setelah dedup, tanpa 2 file yang ditolak | **± 456 MB** |

---

## 5. Hitungan Bandwidth — Alasan Utama Menolak GitHub

Batas 100 MB per file bisa diakali dengan kompres. Bandwidth tidak bisa.

Video yang diunduh satu ibu per sesi (wilayah TTD):

| Sesi | Video | Unduhan per ibu |
|---|---|---|
| 1 | Maternal 1 + Gizi 1000 HPK | **399 MB** |
| 2 | Maternal 2 + KEK + Gizi Ibu Hamil | **398 MB** |
| 3 | Mitos dan Fakta TTD | 98 MB |
| 4 | — (slide saja) | 0 |
| 5 | IMD | 18 MB |
| 6 | — | 0 |
| 7 | — | 0 |
| 8 | — | 0 |
| 9 | ASI Eksklusif + Posisi Pelekatan | 89 MB |
| 10 | — | 0 |
| | **Total 10 sesi** | **± 1.002 MB per ibu** |

Artinya:

- **1 ibu menyelesaikan program = ± 1 GB bandwidth**
- 100 ibu = 100 GB → **satu bulan kuota Pages habis untuk 100 ibu saja**
- Pada kapasitas 40 pasien/hari (± 880 sesi/bulan), rata-rata 100 MB per sesi
  berarti sekitar **88 GB/bulan** — mentok di batas, sebelum dihitung ibu yang
  memutar ulang video

Ditambah lagi, WiFi puskesmas harus melayani unduhan 400 MB untuk satu ibu di
sesi 1. Praktiknya akan buffering berat, terlepas dari batas GitHub.

---

## 6. Rekomendasi

### Prioritas 1 — pindahkan video ke YouTube unlisted

Paling murah dan paling cocok:

- bandwidth **Rp 0**, tidak ada batas kuota
- kualitas menyesuaikan kekuatan sinyal otomatis, jadi tidak buffering
- unlisted = tidak muncul di pencarian, hanya bisa dibuka yang punya link
- aplikasi **sudah mendukung** watch-gate YouTube lewat IFrame Player API

Di `content.js`, ubah entri video jadi:

```js
VID_MATERNAL_1: {
  tipe: 'youtube',
  judul: 'Kelas Ibu Hamil',
  youtubeId: 'ID_VIDEO_DARI_URL'
},
```

Kalau puskesmas menolak konten di YouTube, alternatifnya **Cloudflare R2**
(egress gratis) atau **Google Drive** milik puskesmas.

### Prioritas 2 — kompres dulu sebelum diunggah ke mana pun

Video 366 MB untuk materi edukasi itu kelewat besar. Skrip
`compress_video.py` sudah ada di folder EduCatin (`dashboard/questionnaire/`).
Turunkan ke 720p; biasanya ukuran turun 60–80% tanpa penurunan yang terasa di HP.

### Prioritas 3 — jangan pakai Git LFS

Kuota gratisnya 1 GB simpan + 1 GB transfer per bulan. Media KIARA 1,12 GB, jadi
kuota simpan sudah lewat sebelum dipakai, dan transfer 1 GB habis oleh satu ibu.

### Yang tetap boleh masuk repo GitHub

Kode aplikasi, dan slide materi setelah dikonversi ke PDF (total ± 3 MB).
Komik PDF (total ± 12 MB) juga masih wajar kalau mau disimpan di repo.

---

## 7. `.gitignore` yang Harus Dipakai

Buat file `.gitignore` di `dashboard/kiara-puskes-cakung/`:

```gitignore
# Media besar — dihost di YouTube unlisted / Cloudflare R2, bukan di repo.
# Lihat BATAS-MEDIA-GITHUB.md
media/*.mp4
media/**/*.mp4
media/*.mov
media/**/*.mov

# Buku rujukan internal, bukan materi yang ditampilkan ke pasien
media/**/Buku*Fasilitator*.pdf

# Sisa hasil ekstrak zip
*.zip
```

Slide PDF (`media/slide/*.pdf`) dan komik PDF sengaja **tidak** di-ignore
karena ukurannya kecil dan memang perlu tampil di aplikasi.

---

## 8. Ringkasan Tindakan

| # | Tindakan | Untuk |
|---|---|---|
| 1 | Konfirmasi ke puskesmas: apakah 2 video "Copy of Video Maternal" memang materi resmi | 675,7 MB |
| 2 | Kompres seluruh video ke 720p | 15 file |
| 3 | Unggah video ke YouTube unlisted, catat `youtubeId` masing-masing | 11 video unik |
| 4 | Ubah `tipe` video di `content.js` jadi `'youtube'` | `content.js` |
| 5 | Konversi 10 slide `.pptx` ke PDF, taruh di `media/slide/` | ± 3 MB |
| 6 | Salin komik PDF ke `media/`, hilangkan yang kembar | 7 file, ± 12 MB |
| 7 | Buat `.gitignore` seperti bagian 7 | repo |
| 8 | Set `PLACEHOLDER_MODE: false` di `config.js` | aktifkan gate asli |
