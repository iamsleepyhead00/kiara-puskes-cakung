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

---

## Peta Kunjungan 1–4

Sumber: folder **DATA BASE VIDEO** dari puskesmas (5 Agustus 2026). Prefiks
`K.1`–`K.4` pada nama berkas = kunjungan 1–4.

Tiap kunjungan berisi **dua topik**, masing-masing satu video dan satu set 5 soal.
Kedua set digabung jadi **satu** pre-test dan **satu** post-test berisi 10 soal —
supaya struktur 13 kolom sheet tetap utuh (satu baris per kunjungan, satu skorPre,
satu skorPost).

| Kunj. | Topik | Video | Soal |
|---|---|---|---|
| 1 | Tanda Kehamilan & Pemeriksaan | `K1-Tanda-Kehamilan.mp4` (9 MB) | 5 |
| 1 | 1000 HPK | `K1-Gizi-1000-HPK.mp4` (51 MB) | 5 |
| 2 | Gizi Ibu Hamil | `K2-Gizi-Ibu-Hamil.mp4` (68 MB) | 5 |
| 2 | Ibu Hamil KEK | `K2-KEK.mp4` (42 MB) | 5 |
| 3 | Perawatan Sehari-hari | `K3-Perawatan-Sehari-hari.mp4` (4 MB) | 5 |
| 3 | Mitos dan Fakta | **belum ada** | 5 |
| 4 | Hal yang Harus Dihindari | `K4-Hal-yang-Dihindari.mp4` (13 MB) | 5 |
| 4 | Tanda Bahaya Kehamilan | **belum ada** | 5 |

Total media aktif **186 MB**, berkas terbesar 68 MB — semuanya di bawah batas
100 MB/berkas GitHub.

Skoring: 10 soal → 10 poin per soal, skor 0–100 kelipatan 10, **KKM 80 = 8 dari
10 benar**.

Berkas `SOAL PRETEST & POSTTEST IMUNISASI.docx` **tanpa prefiks K**, jadi belum
jelas masuk kunjungan ke berapa. Soalnya sudah disiapkan di `setSoalDitahan`,
belum aktif.

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
| 1 | **Verifikasi 45 kunci jawaban** | `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` | Berkas .docx puskesmas tidak memuat kunci. Yang dipakai sekarang kunci turunan. Kalau salah, skor dan status LULUS ikut salah. Lihat bawah. |
| 2 | **Deploy versi baru Apps Script** | `gas/Code.gs` | `POIN_PER_SOAL` sudah 20 → 10. Kalau belum di-deploy, endpoint menolak skor 10/30/50/70/90 dan sebagian pasien gagal simpan. |
| 3 | **Video untuk 2 topik** | `content.js` → `sesi[2].materi`, `sesi[3].materi` | K.3 "Mitos dan Fakta" dan K.4 "Tanda Bahaya" punya soal tanpa video. Pasien diuji tanpa materi. |
| 4 | **Hosting video** | `.gitignore` | 186 MB semuanya lolos batas GitHub, jadi bisa ikut repo. Belum diputuskan: repo publik atau YouTube unlisted. |
| 5 | **Kunjungan untuk soal Imunisasi** | `content.js` → `setSoalDitahan` | Berkasnya tanpa prefiks K, belum jelas kunjungan ke berapa. |
| 6 | **Wilayah TTD atau MMS** | `config.js` → `WILAYAH` | Tidak lagi memengaruhi materi, tapi masih memengaruhi kunci soal K.1 no. 5. |
| 7 | **Template pesan WhatsApp** | `content.js` → `waTemplateHasil` | Dokumen tidak memuat format pesan. Perlu disetujui bidan. |

Saat aplikasi dibuka, semua item yang masih tersisa muncul otomatis sebagai
peringatan di **console browser**.

### Kunci jawaban belum diverifikasi bidan

Sembilan berkas .docx dari puskesmas hanya memuat pertanyaan dan pilihan
"Benar/Salah" — **tanpa menandai mana yang benar**. Aplikasi butuh kunci untuk
menghitung skor, jadi 45 kunci diturunkan dari pedoman Buku KIA dan standar ANC.
Setiap set ditandai `kunciTurunan: true` di `content.js`.

Daftar cetaknya ada di **`KUNCI-JAWABAN-PERLU-VERIFIKASI.md`** — kirim ke bidan
untuk dicoret-koreksi, lalu ubah `kunci: true` ↔ `kunci: false` sesuai koreksinya
dan hapus penanda `kunciTurunan`.

Tiga kunci yang bergantung pedoman, bukan fakta medis, ditandai tambahan
`perluKonfirmasi`:

| Soal | Kunci turunan | Perlu ditanya |
|---|---|---|
| K.1 Tanda Kehamilan no. 4 — *"trimester kedua dilakukan 1 kali"* | Benar | Benar di standar ANC 6× (TM1 2×, TM2 1×, TM3 3×). Beda kalau puskesmas masih pakai standar 4×. |
| K.1 Tanda Kehamilan no. 5 — *"semua ibu hamil dapat TTD"* | Benar | Di wilayah program MMS ibu hamil menerima MMS, bukan TTD. |
| K.4 Hal Dihindari no. 1 — *"kopi tidak lebih dari 1 cangkir"* | Benar | Pedoman membatasi kafein tapi angka "1 cangkir" tidak baku. |

Bank soal buku fasilitator di `setSoalDitahan` punya kunci **asli dari buku**,
bukan turunan — kecuali dua yang memang terlihat salah cetak (Pertemuan II no. 3
soal IMD, dan Pertemuan III no. 3 varian MMS soal tinja kehitaman). Keduanya
ditulis apa adanya sesuai buku dan ditandai `perluKonfirmasi`, tidak diperbaiki
sendiri.

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
