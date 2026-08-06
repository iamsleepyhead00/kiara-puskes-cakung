# Media KIARA vs Batas GitHub

Diperbarui **6 Agustus 2026**, setelah puskesmas mengirim folder
`DATA BASE VIDEO`.

---

## Kesimpulan sekarang: GitHub cukup

Paket aktif hanya **6 video, 186 MB**, berkas terbesar 68 MB. Semuanya lolos
batas 100 MB/berkas GitHub, jadi video **ikut repo** dan dilayani GitHub Pages.
Tidak perlu YouTube atau Cloudflare R2.

| Berkas | Ukuran | Kunjungan |
|---|---|---|
| `K1-Tanda-Kehamilan.mp4` | 8,9 MB | 1 |
| `K1-Gizi-1000-HPK.mp4` | 50,9 MB | 1 |
| `K2-Gizi-Ibu-Hamil.mp4` | 67,9 MB | 2 |
| `K2-KEK.mp4` | 41,6 MB | 2 |
| `K3-Perawatan-Sehari-hari.mp4` | 4,4 MB | 3 |
| `K4-Hal-yang-Dihindari.mp4` | 12,5 MB | 4 |
| **Total** | **186,2 MB** | |

Ter-commit di `4c5a265`. Dua berkas di atas 50 MB kena *warning* GH001 saat
push (saran pakai Git LFS), tapi bukan penolakan — push berhasil.

---

## Batas GitHub yang berlaku

| Batas | Angka | Sifat | Posisi kita |
|---|---|---|---|
| Ukuran satu berkas | 100 MB | **Keras** — push ditolak | ✅ maks 68 MB |
| Peringatan ukuran berkas | 50 MB | Lunak — hanya warning | ⚠️ 2 berkas kena |
| Ukuran repo disarankan | 1 GB | Lunak | ✅ ± 190 MB |
| Ukuran situs GitHub Pages | 1 GB | **Keras** untuk Pages | ✅ ± 190 MB |
| Bandwidth GitHub Pages | ± 100 GB/bulan | Lunak — bisa di-throttle | ✅ lihat bawah |

---

## Hitungan bandwidth

Satu ibu menonton seluruh 4 kunjungan = **186 MB** (tiap video diputar sekali).

| | Angka |
|---|---|
| Per ibu, 4 kunjungan | 186 MB |
| Kuota Pages per bulan | 100 GB |
| **Kapasitas** | **± 537 ibu/bulan** |

Pada kapasitas 40 pasien/hari (± 880 sesi/bulan) dengan rata-rata 47 MB per
sesi, pemakaiannya sekitar **41 GB/bulan** — masih separuh kuota, cukup ruang
untuk ibu yang memutar ulang video.

Bandingkan dengan paket lama: 896 MB per ibu, hanya cukup untuk ± 111 ibu.

> **WiFi puskesmas tetap perlu diperhatikan.** Kunjungan 1 mengunduh 60 MB dan
> kunjungan 2 mengunduh 110 MB. Jauh lebih ringan dari paket lama (400 MB per
> sesi), tapi kalau beberapa ibu menonton serentak di ruang tunggu, tetap berat.

---

## Kalau bandwidth ternyata jadi masalah

Aplikasi sudah siap untuk dua-duanya, jadi pindah hosting tidak perlu ubah logika.

**YouTube unlisted** — bandwidth Rp 0, kualitas menyesuaikan sinyal otomatis
sehingga tidak buffering di sinyal lemah. Watch-gate sudah didukung lewat
IFrame Player API (`controls:0` + `disablekb:1`). Di `content.js` ubah entrinya:

```js
K1_GIZI_1000HPK: {
  tipe: 'youtube',
  judul: 'Gizi 1000 HPK',
  youtubeId: 'ID_DARI_URL'
},
```

⚠️ **Perlu izin puskesmas.** Walau unlisted, link-nya terlihat di source aplikasi.

**Cloudflare Pages / R2** — bandwidth tanpa batas, egress $0. Lebih bersih dari
sisi kepemilikan konten, tapi mp4 statis tidak bisa menurunkan resolusi otomatis
saat sinyal lemah.

**Jangan pakai Git LFS.** Kuota gratisnya 1 GB simpan + 1 GB transfer/bulan.
Transfer 1 GB habis oleh 5 ibu saja.

---

## Yang tidak ikut repo

`.gitignore` memblokir semua `media/**/*.mp4` lalu mengizinkan 6 berkas K1–K4
secara eksplisit. Sisanya sengaja ditinggal:

| Berkas | Ukuran | Alasan |
|---|---|---|
| `Video-Maternal-1-Kelas-Ibu-Hamil.mp4` | 366,4 MB | **Ditolak keras GitHub** (>100 MB). Digantikan `K1-Tanda-Kehamilan.mp4` yang hanya 8,9 MB |
| `Video-Maternal-2-Pemeriksaan-ANC.mp4` | 309,3 MB | **Ditolak keras GitHub** |
| `TTD/7-Video-TTD-Mitos-dan-Fakta.mp4` | 98,5 MB | Tidak dipakai. Kandidat untuk soal K.3 "Mitos dan Fakta" yang belum ada videonya — lihat CATATAN-SESI 5.2 |
| `Video-Posisi-Pelekatan.mp4` | 59,4 MB | Untuk sesi 9, belum aktif |
| `Video-ASI-Eksklusif.mp4` | 30,0 MB | Untuk sesi 9, belum aktif |
| `5-Video-IMD.mp4` | 17,6 MB | Untuk sesi 5, belum aktif |
| `TTD/1-`, `TTD/3-` | 80,1 MB | Varian TTD, tidak dipakai paket baru |
| `MMS/1-`, `MMS/3-`, `2-Video-Audio-KEK.mp4` | 160,4 MB | **Duplikat byte-per-byte** dari K1/K2 — boleh dihapus dari disk |
| Seluruh PDF (komik + slide) | — | Sudah dihapus. Materi PDF tidak dipakai sejak 2 Agustus |

Definisi semuanya tersimpan di `materiDitahan` pada `content.js`, jadi
pemetaannya tidak hilang kalau sesi 5+ dihidupkan nanti.

---

## Riwayat — paket lama (1.299,7 MB)

Sebelum 5 Agustus, sumbernya `drive-download-20260802T081008Z-1-001.zip` +
`MATERI 1-10 KIARA-20260802T075419Z-1-001.zip`: 33 berkas, 1,27 GB, terbagi
wilayah TTD/MMS.

Kesimpulan dokumen versi lama: **GitHub tidak layak untuk video KIARA.**
Alasannya masih benar untuk paket itu:

- 2 berkas di atas 100 MB → push ditolak, bukan cuma diperingatkan
- 5 berkas lain 50–100 MB → repo berat, clone lambat
- satu ibu mengunduh ± 1 GB untuk 10 sesi → kuota Pages habis di 100 ibu

Kesimpulan itu **tidak lagi berlaku** karena kurasi puskesmas memotong ukuran
paket sampai 86%: 1.122 MB → 186 MB. Video pengganti bukan hasil kompresi,
tapi memang video berbeda yang jauh lebih pendek.

Rencana lama (kompres 720p pakai `compress_video.py` dari EduCatin → unggah ke
YouTube unlisted → repo isi kode saja) jadi tidak perlu dijalankan. Skripnya
tetap relevan kalau suatu saat dua video Maternal dipakai lagi.
