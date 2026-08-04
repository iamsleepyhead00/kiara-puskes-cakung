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

## Peta 10 Sesi

Jumlah materi per sesi **berbeda-beda** (1 sampai 6 item), tidak lagi selalu 2 video.

| Sesi | Topik | Materi | Set Soal |
|---|---|---|---|
| 1 | Kehamilan yang Sehat | slide + 2 video | Pertemuan I |
| 2 | Pemeriksaan Kehamilan & Gizi | slide + 3 video (+2 komik di MMS) | Pertemuan I |
| 3 | Perawatan Diri Selama Kehamilan | slide + video Mitos TTD* + komik | Pertemuan III |
| 4 | Tanda Bahaya & Faktor Risiko | slide | Pertemuan III |
| 5 | Persiapan Persalinan & IMD | slide + video IMD + komik IMD | Pertemuan II |
| 6 | Nifas & Mitos Masa Nifas | slide | Pertemuan II |
| 7 | Menjaga Ibu Nifas & Bayi Sehat | slide | Pertemuan II |
| 8 | KB Pasca Persalinan | slide | Pertemuan II |
| 9 | Bayi Baru Lahir & ASI Eksklusif | slide + 2 video | Pertemuan IV |
| 10 | Imunisasi & Perawatan Bayi | slide | Pertemuan IV |

\* Video Mitos TTD tidak ada padanannya di paket MMS — sesi 3 wilayah MMS jadi tanpa video.

Buku fasilitator hanya menyediakan **4 set soal** untuk **10 sesi**, jadi ada set yang
dipakai lebih dari sekali. Pemetaan di atas disusun berdasarkan kecocokan topik —
belum dikonfirmasi puskesmas. Ubah di `content.js` → `sesi[].setSoal`.

---

## Cara Menjalankan Lokal

Web Crypto API (hash NIK) butuh HTTPS atau `localhost`. Jangan buka lewat `file://`.

```powershell
cd dashboard\kiara-puskes-cakung
python -m http.server 8000
```

Buka `http://localhost:8000`. Untuk uji alur sesi 1 → 10 tanpa backend, `config.js`
sudah disetel `OFFLINE_MODE: true`. Reset riwayat dari console: `KIARA_DEBUG.resetOffline()`.

Cek pemetaan dari console: `KIARA_DEBUG.soalSesi(3)` dan `KIARA_DEBUG.materiSesi(3)`.

---

## Menyiapkan Media

File media masih di dua zip di folder Downloads dan **belum dipindahkan** ke sini.
Struktur folder yang diharapkan `content.js`:

```
media/
├── Video-Maternal-1-Kelas-Ibu-Hamil.mp4
├── Video-Maternal-2-Pemeriksaan-ANC.mp4
├── 2-Video-Audio-KEK.mp4
├── 5-Video-IMD.mp4
├── 4-Komik-IMD.pdf
├── Video-ASI-Eksklusif.mp4
├── Video-Posisi-Pelekatan.mp4
├── TTD/
│   ├── 1-Video-Gizi-1000-HPK-TTD.mp4
│   ├── 3-Video-Gizi-Ibu-Hamil-TTD.mp4
│   ├── 6-Komik-MAMAMIA-Anemia-dan-TTD.pdf
│   └── 7-Video-TTD-Mitos-dan-Fakta.mp4
├── MMS/
│   ├── 1-Video-Gizi-1000-Hari.mp4
│   ├── 3-Video-Gizi-Ibu-Hamil.mp4
│   ├── 6-Komik-MAMAMIA-Anemia-MMS.pdf
│   ├── 7-Komik-MMS.pdf
│   └── 11-MMS-Gambar-otak-anak.pdf
└── slide/
    └── Sesi-01.pdf … Sesi-10.pdf
```

Dua pekerjaan mekanis yang belum dilakukan:

**1. Konversi slide.** File aslinya `.pptx` dan tidak bisa ditampilkan di browser.
Perlu diekspor ke PDF:

```powershell
# butuh LibreOffice terpasang
soffice --headless --convert-to pdf --outdir media\slide "MATERI 1-10 KIARA\*.pptx"
```

Lalu ganti nama sesuai urutan sesi (`KUNJUNGAN KE - 1` → `Sesi-01.pdf`, dst).

**2. Kompres video.** Ini bukan opsional:

| Video | Ukuran asli |
|---|---|
| Video Maternal 1 — Kelas Ibu Hamil | **366 MB** |
| Video Maternal 2 — Pemeriksaan ANC | **309 MB** |
| Video TTD Mitos dan Fakta | 99 MB |
| Total seluruh media | ~1,27 GB |

> **GitHub Pages tidak bisa dipakai untuk video ini.** Batas keras GitHub adalah
> 100 MB per file, jadi dua video Maternal **tidak bisa di-commit sama sekali**.
> Ditambah lagi: satu pasien menonton satu video 300 MB berarti 300 MB bandwidth.
> Pada 40 pasien/hari, angkanya jauh melewati batas wajar.
>
> Pilihan yang realistis:
> 1. **YouTube unlisted + embed** — bandwidth Rp 0, kualitas menyesuaikan sinyal
>    otomatis. Di `content.js` ubah jadi `{ tipe:'youtube', youtubeId:'...' }`.
>    App sudah mendukung watch-gate lewat IFrame Player API.
> 2. **Cloudflare R2** — egress gratis, kalau puskesmas tidak mau konten di YouTube.
> 3. Kompres dulu ke 720p pakai `compress_video.py` dari folder EduCatin, tetap
>    di-host di luar GitHub.

Setelah media siap, set `PLACEHOLDER_MODE: false` di `config.js`.

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
| 1 | **Wilayah TTD atau MMS** | `config.js` → `WILAYAH` | Menentukan video gizi, komik anemia, dan 3 soal. Salah pilih = ibu dapat materi program yang bukan wilayahnya. Puskesmas mengirim dua-duanya, jadi belum jelas. |
| 2 | **File media** | `media/` | Slide masih `.pptx` (perlu PDF), video perlu dipindah ke YouTube/R2. `PLACEHOLDER_MODE` masih `true`. |
| 3 | **Kunci jawaban yang terlihat keliru** | `content.js` → `perluKonfirmasi` | Dua soal, lihat bawah. |
| 4 | **Pemetaan sesi → set soal** | `content.js` → `sesi[].setSoal` | Buku hanya punya 4 set untuk 10 sesi. Pemetaan sekarang disusun sendiri. |
| 5 | **5 soal mana dari 10 di buku** | `content.js` → `sesi[].bagianSoal` | Puskesmas menetapkan 5 soal per sesi, buku punya 10 per pertemuan. Sekarang dibelah dua (soal 1–5 dan 6–10) menurut urutan buku. Perlu dipastikan puskesmas tidak punya pilihan sendiri. |
| 6 | **Template pesan WhatsApp** | `content.js` → `waTemplateHasil` | Dokumen tidak memuat format pesan. Perlu disetujui bidan. |
| 7 | `OFFLINE_MODE` | `config.js` | Masih `true` untuk preview. Data pasien belum masuk ke bidan. |

Saat aplikasi dibuka, semua item yang masih tersisa muncul otomatis sebagai
peringatan di **console browser**.

### Dua kunci jawaban yang perlu dicek ke bidan

**Pertemuan II no. 3** — *"Kepanjangan dari IMD adalah Inisiasi Menyusu Dini."*
Buku menulis kunci **S (Salah)**. Padahal IMD memang Inisiasi Menyusu Dini, dan
slide Pertemuan ke-5 pun menulis demikian. Kalau dipakai apa adanya, ibu yang
menjawab benar justru disalahkan.

**Pertemuan III no. 3 varian MMS** — *"Tinja berwarna kehitaman adalah salah satu
efek samping minum MMS."* Kunci **S**, sementara varian TTD-nya menyatakan tinja
kehitaman *tidak berbahaya* dengan kunci **B**. Dua pernyataan itu berlawanan arah,
kemungkinan salah satu kuncinya tertukar.

Kunci di `content.js` **ditulis apa adanya sesuai buku** — tidak diperbaiki
sendiri, karena ini konten kesehatan. Tandai `perluKonfirmasi` dihapus setelah
bidan memberi keputusan.

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
