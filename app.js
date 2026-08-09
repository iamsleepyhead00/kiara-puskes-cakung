/**
 * KIARA — Kelas Ibu Hamil Digital
 * Router screen, engine kuis Benar/Salah, gate materi, scoring, submit.
 *
 * Disesuaikan dengan konsep KIARA.docx (2 Agustus 2026):
 *   • 10 SESI dengan jumlah materi berbeda-beda (bukan lagi selalu 2 video)
 *   • materi bisa berupa video atau dokumen (komik / slide PDF)
 *   • soal Benar/Salah dari Buku Pegangan Fasilitator hal. 169–172
 *   • 4 set soal dipakai bergilir untuk 10 sesi
 *   • varian wilayah TTD / MMS
 *   • sertifikat DI HOLD — tidak dibangun
 *
 * Alur: S1 splash → S2 identifikasi → lookup NIK → S3 konfirmasi
 *       → S4 pre-test → S5 hasil pre → S6 materi (n item, bergate)
 *       → S7 post-test → simpan → S8 hasil akhir / S12 belum KKM
 * Edge: S10 sudah lulus · S11 duplikat harian · S9 progress
 */
(function () {
  'use strict';

  const CFG = window.KIARA_CONFIG;
  const CONTENT = window.KIARA_CONTENT;
  const VT = window.VisitTracker;

  /* ── HELPER DOM ────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const icons = () => window.lucide && window.lucide.createIcons();

  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const OPSI_BS = [
    { teks: 'Benar', val: true, kode: 'B' },
    { teks: 'Salah', val: false, kode: 'S' }
  ];

  /* ── STATE ─────────────────────────────────────────────── */
  const state = {
    nik: '', nikMask: '', nama: '', hp: '',
    alamat: '', kelurahan: '', puskesmas: '', pernahPeriksa: 'Tidak',

    sesiKe: 1, sumberData: 'SISTEM', riwayat: [], rataPost: 0,

    soal: [], setSoal: '',
    jawabanPre: [], jawabanPost: [],
    qIndex: 0,
    skorPre: 0, skorPost: 0, percobaanPost: 0,

    materi: [], materiIndex: 0, materiTuntas: [],

    tersimpan: false,
    screenSebelumnya: 's8',

    // Layar yang sedang tampil. Dipakai untuk memulihkan posisi kalau
    // browser tertutup di tengah sesi.
    layar: 's1'
  };

  let ytApiSiap = null;
  let ytPlayer = null;
  let gateTimer = null;
  let barTimer = null;

  // Penanda akumulasi tonton saat progres terakhir ditulis, supaya
  // localStorage tidak ditulis dua kali per detik selama video berjalan.
  let simpanTerakhir = 0;

  // Pelacak tonton: yang dihitung akumulasi detik yang benar-benar diputar,
  // bukan posisi progress bar. Bikin geser-ke-ujung tidak ada gunanya.
  const tonton = { akum: 0, last: 0, kunci: false, durasi: 0 };

  /* ══════════════════════════════════════════════════════
     PROGRES TERTUNDA — pulih setelah browser tertutup

     Sebelumnya seluruh state hanya ada di memori, jadi ibu yang keluar
     dari browser di tengah sesi kehilangan semuanya: NIK, skor pre-test,
     dan yang paling menyakitkan — progres nonton video. Anti-skip menghitung
     akumulasi detik di `tonton.akum`; kalau hilang, video 68 MB harus
     ditonton ulang dari nol beserta kuotanya.

     Tiga aturan yang dipatok:

     1. BERLAKU SEHARI SAJA. Progres dari kemarin tidak dipulihkan — ibu
        datang untuk kunjungan baru, bukan melanjutkan yang lalu.
     2. DITAWARKAN, TIDAK OTOMATIS. Kalau HP-nya dipakai ibu lain, dia
        tidak boleh terjebak melanjutkan data orang.
     3. DIHAPUS SETELAH TUNTAS. Begitu hasil masuk sheet dan KKM tercapai,
        progres dibuang supaya pemulihan tidak memicu submit dobel.

     Layar yang boleh dipulihkan hanya S3–S7 dan S12. S1/S2 tidak perlu
     (memang awal), S8/S10/S11 sudah selesai.

     Nama dan NIK ikut tersimpan di localStorage HP pasien. Karena ini HP
     ibu sendiri (scan QR di ruang tunggu) risikonya wajar. Jalan hapusnya:
     tombol "Bukan saya / mulai dari awal" di layar tawaran, tautan "Bukan
     saya" di layar duplikat dan sudah-lulus, otomatis saat sesi tuntas,
     dan otomatis lewat batas hari.
     ══════════════════════════════════════════════════════ */
  const LS_PROGRES = 'kiara_progres_v1';
  const LAYAR_PULIH = ['s3', 's4', 's5', 's6', 's7', 's12'];

  const LABEL_LAYAR = {
    s3: 'Konfirmasi data',
    s4: 'Pre-test',
    s5: 'Hasil pre-test',
    s6: 'Materi',
    s7: 'Post-test',
    s12: 'Hasil post-test'
  };

  function simpanProgres() {
    // Tanpa NIK belum ada yang perlu disimpan, dan layar akhir tidak
    // dipulihkan supaya tidak ada peluang submit dobel.
    if (!state.nik || LAYAR_PULIH.indexOf(state.layar) === -1) return;
    try {
      localStorage.setItem(LS_PROGRES, JSON.stringify({
        versi: 1,
        tanggal: VT.todayJakarta(),
        layar: state.layar,

        nik: state.nik, nikMask: state.nikMask, nama: state.nama, hp: state.hp,
        alamat: state.alamat, kelurahan: state.kelurahan,
        puskesmas: state.puskesmas, pernahPeriksa: state.pernahPeriksa,

        sesiKe: state.sesiKe, sumberData: state.sumberData,
        riwayat: state.riwayat, rataPost: state.rataPost,

        // Soal TIDAK disimpan — dibangun ulang dari content.js lewat
        // soalSesi(). Kalau bank soalnya berubah sejak progres dibuat,
        // jumlahnya tidak lagi cocok dan progres dibuang, bukan dipaksa
        // dipakai dengan jawaban yang bergeser.
        jumlahSoal: state.soal.length,
        jawabanPre: state.jawabanPre, jawabanPost: state.jawabanPost,
        qIndex: state.qIndex,
        skorPre: state.skorPre, skorPost: state.skorPost,
        percobaanPost: state.percobaanPost,

        materiIndex: state.materiIndex, materiTuntas: state.materiTuntas,
        tontonAkum: tonton.akum, tontonDurasi: tonton.durasi,

        tersimpan: state.tersimpan
      }));
    } catch (e) {
      // Kuota localStorage penuh atau mode privat. Bukan alasan menghentikan
      // sesi — pemulihan itu kenyamanan, bukan syarat.
      console.warn('[KIARA] progres gagal disimpan:', e);
    }
  }

  function bacaProgres() {
    let p;
    try {
      p = JSON.parse(localStorage.getItem(LS_PROGRES));
    } catch (e) {
      return null;
    }
    if (!p || p.versi !== 1) return null;
    if (p.tanggal !== VT.todayJakarta()) return null;      // bukan hari ini
    if (!p.nik || LAYAR_PULIH.indexOf(p.layar) === -1) return null;
    if (p.jumlahSoal !== soalSesi(p.sesiKe).length) return null;  // bank soal berubah
    return p;
  }

  function hapusProgres() {
    try {
      localStorage.removeItem(LS_PROGRES);
    } catch (e) { /* diabaikan */ }
  }

  /* ══════════════════════════════════════════════════════
     ROUTER
     ══════════════════════════════════════════════════════ */
  function showScreen(id) {
    hentikanTimer();
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('on'));
    const t = $(id);
    if (t) t.classList.add('on');
    window.scrollTo(0, 0);
    icons();

    state.layar = id;
    simpanProgres();
  }

  function busy(on, text) {
    $('loading').hidden = !on;
    if (text) $('loading-text').textContent = text;
  }

  function hentikanTimer() {
    clearTimeout(gateTimer);
    clearInterval(barTimer);
    gateTimer = null;
    barTimer = null;
  }

  /* ══════════════════════════════════════════════════════
     UTIL KONTEN
     ══════════════════════════════════════════════════════ */
  function wilayah() {
    return CFG.WILAYAH === 'MMS' ? 'MMS' : 'TTD';
  }

  function sesiData(ke) {
    return CONTENT.sesi.find((s) => s.ke === ke) || CONTENT.sesi[0];
  }

  /** Ambil satu materi, sudah disesuaikan wilayah. null = tidak berlaku di wilayah ini. */
  function resolveMateri(id) {
    const m = CONTENT.materi[id];
    if (!m) return null;
    if (m.hanyaWilayah && m.hanyaWilayah !== wilayah()) return null;
    const file = (m.file && typeof m.file === 'object') ? m.file[wilayah()] : m.file;
    if (!file) return null;
    const mb = (m.mbAsli && typeof m.mbAsli === 'object') ? m.mbAsli[wilayah()] : m.mbAsli;
    return {
      id: id,
      tipe: m.tipe,
      judul: m.judul,
      judulPanjang: m.judulPanjang || m.judul,
      slide: m.slide,
      mb: mb,
      url: CFG.MEDIA_BASE + file
    };
  }

  function materiSesi(ke) {
    return sesiData(ke).materi.map(resolveMateri).filter(Boolean);
  }

  /** Daftar kunci set soal untuk satu sesi, selalu dalam bentuk array. */
  function kunciSetSoal(ke) {
    const v = sesiData(ke).setSoal;
    if (Array.isArray(v)) return v;
    return v == null ? [] : [v];
  }

  /**
   * Bank soal untuk satu sesi.
   *
   * Satu kunjungan berisi DUA topik, masing-masing 5 soal dari berkas
   * puskesmas — jadi 10 soal digabung jadi satu pre-test dan satu
   * post-test. Ini yang menjaga struktur 13 kolom sheet tetap utuh:
   * satu baris per kunjungan, satu skorPre, satu skorPost.
   *
   * Tiap soal membawa `topik` (nama set asalnya) supaya bisa ditampilkan
   * di kartu soal — pasien tahu bagian mana yang sedang diuji.
   *
   * `varian` masih didukung untuk bank soal buku (lihat setSoalDitahan),
   * walau berkas puskesmas yang aktif sekarang tidak memakainya.
   */
  function soalSesi(ke) {
    const out = [];
    kunciSetSoal(ke).forEach((kunci) => {
      const set = CONTENT.setSoal[kunci];
      if (!set) return;
      set.soal.forEach((s) => {
        const src = s.varian ? (s.varian[wilayah()] || s.varian.TTD) : s;
        if (!src) return;
        out.push({
          pertanyaan: src.pertanyaan,
          kunci: src.kunci,
          perluKonfirmasi: src.perluKonfirmasi,
          kunciTurunan: !!set.kunciTurunan,
          topik: set.nama
        });
      });
    });
    return out;
  }

  function namaSet(ke) {
    const nama = kunciSetSoal(ke)
      .map((k) => (CONTENT.setSoal[k] || {}).nama)
      .filter(Boolean);
    return nama.length ? nama.join(' + ') : '-';
  }

  function hitungSkor(jawaban, soal) {
    if (!soal.length) return 0;
    return Math.round((jumlahBenar(jawaban, soal) / soal.length) * 100);
  }

  function jumlahBenar(jawaban, soal) {
    return soal.reduce((n, s, i) => n + (jawaban[i] === s.kunci ? 1 : 0), 0);
  }

  /* ── UTIL FORMAT ───────────────────────────────────────── */
  function tanggalTampil(iso) {
    const m = VT.normalizeDate(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? Number(m[3]) + ' ' + BULAN[Number(m[2]) - 1] + ' ' + m[1] : (iso || '-');
  }

  function tanggalSingkat(iso) {
    const m = VT.normalizeDate(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? Number(m[3]) + ' ' + BULAN[Number(m[2]) - 1] : '';
  }

  function inisial(nama) {
    return String(nama).trim().split(/\s+/).slice(0, 2)
      .map((w) => w[0] || '').join('').toUpperCase() || '-';
  }

  function isiTemplate(tpl, data) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (data[k] != null ? data[k] : '-'));
  }

  function jam(detik) {
    const s = Math.floor(detik || 0);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  /* ══════════════════════════════════════════════════════
     S1 · SPLASH
     ══════════════════════════════════════════════════════ */
  function initSplash() {
    // Bangunkan container Apps Script selagi splash tampil. Pencarian
    // riwayat berikutnya jadi tidak menanggung cold start.
    VT.pemanasan();

    setTimeout(() => {
      // Ada progres hari ini yang belum tuntas? Tawarkan melanjutkan,
      // jangan langsung ke form data yang berarti mengulang dari awal.
      const p = bacaProgres();
      if (p) return tampilTawaranLanjut(p);
      showScreen('s2');
    }, CFG.SPLASH_DURATION_MS);
  }

  /* ══════════════════════════════════════════════════════
     S-LANJUT · TAWARAN MELANJUTKAN SESI TERTUNDA
     ══════════════════════════════════════════════════════ */
  function tampilTawaranLanjut(p) {
    const sesi = sesiData(p.sesiKe);

    $('lj-sub').textContent = 'Tersimpan di HP ini hari ini';
    $('lj-nama').textContent = p.nama || '-';
    $('lj-nik').textContent = p.nikMask || VT.maskNIK(p.nik);
    $('lj-sesi').textContent = 'Ke-' + p.sesiKe + ' · ' + (sesi ? sesi.judul : '-');
    $('lj-posisi').textContent = LABEL_LAYAR[p.layar] || p.layar;

    // showScreen() menulis progres, dan di layar ini state masih kosong —
    // jadi layarnya diganti manual supaya progres yang tersimpan tidak
    // ketimpa sebelum pasien memilih.
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('on'));
    $('s-lanjut').classList.add('on');
    window.scrollTo(0, 0);
    icons();
  }

  function initLanjut() {
    $('btn-lanjut-progres').addEventListener('click', () => {
      const p = bacaProgres();
      if (!p) return showScreen('s2');
      pulihkanProgres(p);
    });

    $('btn-lanjut-baru').addEventListener('click', () => {
      hapusProgres();
      showScreen('s2');
    });
  }

  /**
   * Kembalikan state lalu antar ke layar tempat ibu berhenti.
   *
   * Soal dibangun ulang dari content.js, tidak dibaca dari simpanan —
   * `bacaProgres()` sudah memastikan jumlahnya masih cocok, jadi indeks
   * jawabannya tetap sejajar.
   */
  function pulihkanProgres(p) {
    state.nik = p.nik;
    state.nikMask = p.nikMask || VT.maskNIK(p.nik);
    state.nama = p.nama;
    state.hp = p.hp;
    state.alamat = p.alamat;
    state.kelurahan = p.kelurahan;
    state.puskesmas = p.puskesmas;
    state.pernahPeriksa = p.pernahPeriksa || 'Tidak';

    state.sesiKe = p.sesiKe;
    state.sumberData = p.sumberData || 'SISTEM';
    state.riwayat = p.riwayat || [];
    state.rataPost = p.rataPost || 0;

    state.soal = soalSesi(state.sesiKe);
    state.setSoal = kunciSetSoal(state.sesiKe).join(' + ');
    state.jawabanPre = p.jawabanPre || new Array(state.soal.length).fill(null);
    state.jawabanPost = p.jawabanPost || [];
    state.qIndex = Math.min(Number(p.qIndex) || 0, state.soal.length - 1);
    state.skorPre = p.skorPre || 0;
    state.skorPost = p.skorPost || 0;
    state.percobaanPost = p.percobaanPost || 0;

    state.materi = materiSesi(state.sesiKe);
    state.materiIndex = Math.min(Number(p.materiIndex) || 0,
                                 Math.max(0, state.materi.length - 1));
    state.materiTuntas = (p.materiTuntas && p.materiTuntas.length === state.materi.length)
      ? p.materiTuntas
      : new Array(state.materi.length).fill(false);

    state.tersimpan = !!p.tersimpan;

    switch (p.layar) {
      case 's4':
        $('pre-sub').textContent = 'Sesi ' + state.sesiKe;
        renderSoal('pre');
        showScreen('s4');
        break;

      case 's5':
        // selesaiPreTest() menghitung ulang skor dan menyiapkan playlist,
        // hasilnya sama dengan yang tersimpan karena jawabannya sama.
        selesaiPreTest();
        break;

      case 's6':
        tampilMateri();
        // tampilVideo() memanggil resetTonton(), jadi akumulasi tonton
        // dikembalikan SESUDAH materi tergambar.
        tonton.akum = Number(p.tontonAkum) || 0;
        tonton.durasi = Number(p.tontonDurasi) || 0;
        simpanTerakhir = tonton.akum;
        gambarProgresTonton();
        // Materi ini sudah pernah tuntas — buka gate-nya supaya tombol
        // lanjut langsung ada, tidak menonton ulang tanpa guna.
        if (state.materiTuntas[state.materiIndex]) bukaGate();
        else if (tonton.akum > 0) {
          $('mt-gate-text').textContent =
            'Ibu sudah menonton ' + jam(tonton.akum) +
            '. Tekan putar untuk melanjutkan dari sisa waktunya.';
        }
        break;

      case 's7':
        if (!state.jawabanPost.length) {
          state.jawabanPost = new Array(state.soal.length).fill(null);
        }
        $('post-sub').textContent = 'Sesi ' + state.sesiKe;
        renderSoal('post');
        showScreen('s7');
        break;

      case 's12':
        tampilBelumKKM('');
        break;

      default:
        // s3 dan sisanya: kembali ke konfirmasi data.
        tampilKonfirmasi();
    }
  }

  /* ══════════════════════════════════════════════════════
     PRA-AMBIL RIWAYAT

     Dulu pencarian riwayat baru dimulai SETELAH pasien menekan SUBMIT dan
     menjawab popup — jadi dia menatap "Mencari riwayat Ibu..." selama
     seluruh perjalanan jaringan plus cold start Apps Script.

     Padahal NIK adalah kolom PERTAMA yang diisi. Begitu 16 digitnya lengkap,
     pencarian bisa dimulai di belakang layar sementara ibu masih mengisi
     nama, HP, alamat, kelurahan, dan puskesmas — itu puluhan detik. Saat
     SUBMIT ditekan, hasilnya biasanya sudah siap dan spinner hampir tidak
     terlihat.

     Yang dijaga:
       • hasil hanya dipakai kalau NIK-nya masih sama — kalau pasien
         mengoreksi NIK, hasil lama dibuang
       • kegagalan pra-ambil TIDAK ditampilkan ke pasien; jalankanLookup()
         akan mencoba lagi secara normal dan pesan errornya muncul di sana
       • kalau pra-ambil masih berjalan saat dibutuhkan, hasilnya ditunggu —
         bukan memicu permintaan kedua
     ══════════════════════════════════════════════════════ */
  let praAmbil = { nik: '', janji: null };

  function mulaiPraAmbil(nik) {
    if (!VT.isNIKValid(nik)) {
      praAmbil = { nik: '', janji: null };
      return;
    }
    if (praAmbil.nik === nik && praAmbil.janji) return;   // sudah jalan
    praAmbil = {
      nik: nik,
      // .catch di sini penting: tanpa itu kegagalan pra-ambil jadi
      // unhandled rejection di console, padahal sudah ada penanganannya.
      janji: VT.lookup(nik).catch(() => null)
    };
  }

  /** Hasil pra-ambil kalau ada dan cocok, kalau tidak baru panggil sekarang. */
  async function ambilRiwayat(nik) {
    if (praAmbil.nik === nik && praAmbil.janji) {
      const hasil = await praAmbil.janji;
      if (hasil) return hasil;
    }
    return VT.lookup(nik);
  }

  /* ══════════════════════════════════════════════════════
     S2 · IDENTIFIKASI
     ══════════════════════════════════════════════════════ */
  /**
   * Isi dropdown dengan satu opsi placeholder di depan.
   *
   * Placeholder diberi `disabled` + `selected` + `hidden`:
   *   selected → jadi tampilan awal, memaksa pasien memilih sendiri
   *   disabled → tidak bisa dipilih balik
   *   hidden   → TIDAK ikut muncul sebagai baris saat daftar dibuka
   */
  function isiDropdown(sel, daftar, placeholder) {
    const kosong = el('option', null, placeholder);
    kosong.value = '';
    kosong.disabled = true;
    kosong.selected = true;
    kosong.hidden = true;
    sel.appendChild(kosong);
    daftar.forEach((v) => {
      const o = el('option', null, v);
      o.value = v;
      sel.appendChild(o);
    });
  }

  function initIdentifikasi() {
    isiDropdown($('in-kelurahan'), CFG.KELURAHAN, 'Pilih kelurahan');
    // Teks placeholder tidak lagi menyebut puskesmas/pustu: sejak 9 Agu
    // daftarnya memuat Klinik/Praktik Bidan juga, jadi label yang lebih
    // umum lebih tepat.
    isiDropdown($('in-puskesmas'), CFG.PUSKESMAS, 'Pilih tempat periksa');

    // Pertanyaan riwayat periksa hamil ditanyakan lewat popup setelah SUBMIT,
    // bukan sebagai radio di dalam form.
    $('btn-periksa-ya').addEventListener('click', () => jawabPeriksa('Ya'));
    $('btn-periksa-tidak').addEventListener('click', () => jawabPeriksa('Tidak'));
    $('btn-periksa-batal').addEventListener('click', tutupModalPeriksa);

    $('in-nik').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
      const hint = $('hint-nik');
      const n = e.target.value.length;
      if (n === 0) {
        hint.className = 'fh';
        hint.querySelector('span').textContent = '16 digit angka, tanpa spasi';
      } else if (n === 16) {
        hint.className = 'fh ok';
        hint.querySelector('span').textContent = '16 digit — valid';
        // Mulai cari riwayat sekarang, di belakang layar. Ibu masih punya
        // lima kolom lagi untuk diisi — waktu itu yang dipakai.
        mulaiPraAmbil(e.target.value);
      } else {
        // NIK dikoreksi setelah lengkap → hasil pra-ambil tidak lagi sah.
        praAmbil = { nik: '', janji: null };
        hint.className = 'fh err';
        hint.querySelector('span').textContent = n + ' dari 16 digit';
      }
      icons();
    });

    $('in-hp').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 15);
    });

    $('form-identifikasi').addEventListener('submit', (e) => {
      e.preventDefault();
      submitIdentifikasi();
    });
  }

  function errIdentifikasi(msg) {
    const box = $('err-identifikasi');
    if (!msg) { box.hidden = true; return; }
    box.textContent = msg;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Tahap 1 — validasi isian dan simpan ke state.
   * Kalau lolos, munculkan popup riwayat periksa hamil. Lookup NIK belum
   * dijalankan di sini supaya jawaban popup ikut menentukan hasilnya.
   */
  function submitIdentifikasi() {
    errIdentifikasi('');

    const nik = $('in-nik').value.trim();
    const nama = $('in-nama').value.trim();
    const hp = $('in-hp').value.trim();
    const alamat = $('in-alamat').value.trim();
    const kel = $('in-kelurahan').value;
    const pusk = $('in-puskesmas').value;

    if (!VT.isNIKValid(nik)) return errIdentifikasi('NIK harus 16 digit angka.');
    if (nama.length < 3) return errIdentifikasi('Nama lengkap belum diisi dengan benar.');
    if (!VT.isHPValid(hp)) return errIdentifikasi('No. HP harus dimulai angka 0 dan minimal 9 digit.');
    if (alamat.length < 5) return errIdentifikasi('Alamat belum diisi.');
    if (!kel) return errIdentifikasi('Kelurahan belum dipilih.');
    if (!pusk) return errIdentifikasi('Tempat periksa belum dipilih.');

    state.nik = nik;
    state.nama = nama;
    state.hp = hp;
    state.alamat = alamat;
    state.kelurahan = kel;
    state.puskesmas = pusk;
    state.nikMask = VT.maskNIK(nik);

    bukaModalPeriksa();
  }

  /* ── POPUP RIWAYAT PERIKSA HAMIL ───────────────────────── */
  function bukaModalPeriksa() {
    $('modal-periksa').hidden = false;
    icons();
  }

  function tutupModalPeriksa() {
    $('modal-periksa').hidden = true;
  }

  function jawabPeriksa(val) {
    state.pernahPeriksa = val;
    tutupModalPeriksa();
    jalankanLookup();
  }

  /**
   * Tahap 2 — cari riwayat NIK, lalu tentukan layar berikutnya.
   * Jawaban "Ya" tapi NIK tidak ketemu akan memicu tawaran koreksi manual.
   */
  async function jalankanLookup() {
    busy(true, 'Mencari riwayat Ibu...');
    try {
      // Biasanya sudah selesai lewat pra-ambil sejak NIK dilengkapi, jadi
      // baris ini langsung memberi hasil tanpa menunggu jaringan.
      const hasil = await ambilRiwayat(state.nik);
      const r = VT.resolve(hasil, state.pernahPeriksa);

      state.riwayat = r.riwayat || [];
      state.rataPost = hasil.rataPost || VT.rataPost(state.riwayat);
      state.sumberData = r.sumberData || 'SISTEM';

      busy(false);

      if (r.kondisi === 'LULUS') return tampilSudahLulus();
      if (r.kondisi === 'DUPLIKAT') return tampilDuplikat(r);

      // Programnya 10 pertemuan tapi aplikasi baru punya materi dan soal
      // untuk SESI_TERSEDIA pertama. Tanpa penjagaan ini, ibu masuk
      // pre-test tanpa soal sama sekali.
      if (r.kunjunganKe > CFG.SESI_TERSEDIA) return tampilBelumTersedia(r);

      state.sesiKe = r.kunjunganKe;
      tampilKonfirmasi();
      if (r.perluKoreksiManual) bukaKoreksi();

    } catch (err) {
      busy(false);
      // Jangan asal menyalahkan koneksi — kesalahan kode juga mendarat di sini,
      // dan pesan yang salah arah bikin bug seperti ini lama ketahuan.
      const jaringan = /fetch|network|failed to fetch|status \d|endpoint|timeout/i
        .test(err.message || '');
      errIdentifikasi(jaringan
        ? 'Gagal menghubungi server. Periksa koneksi internet, lalu coba lagi.'
        : 'Terjadi kesalahan pada aplikasi: ' + err.message +
          '. Mohon tunjukkan pesan ini ke petugas.');
      console.error('[KIARA] jalankanLookup gagal:', err);
    }
  }

  /* ══════════════════════════════════════════════════════
     S3 · KONFIRMASI SESI
     ══════════════════════════════════════════════════════ */
  function tampilKonfirmasi() {
    const sesi = sesiData(state.sesiKe);

    $('k-avatar').textContent = inisial(state.nama);
    $('k-nama').textContent = state.nama;
    $('k-sub').textContent = 'NIK ••••' + state.nik.slice(-4) + ' · ' + state.kelurahan;

    const baru = state.riwayat.length === 0;
    $('k-badge-label').textContent = baru ? 'DATA BARU' : 'TERDETEKSI';
    $('k-badge-nomor').textContent = 'SESI KE-' + state.sesiKe;

    const list = $('k-riwayat');
    list.innerHTML = '';
    if (baru) {
      list.appendChild(el('div', 'infobox teal', '<div>Data baru — mulai dari Sesi 1.</div>'));
    } else {
      state.riwayat.forEach((r) => {
        const row = el('div', 'hrow');
        row.innerHTML =
          '<div class="hdot done"><i data-lucide="check"></i></div>' +
          '<div class="t">Sesi ' + r.kunjunganKe + '</div>' +
          '<div class="dt">' + tanggalTampil(r.tanggal) + '</div>';
        list.appendChild(row);
      });
    }
    const now = el('div', 'hrow nowrow');
    now.innerHTML =
      '<div class="hdot now"><i data-lucide="play"></i></div>' +
      '<div class="t">Sesi ' + state.sesiKe + '</div>' +
      '<div class="dt">Hari ini</div>';
    list.appendChild(now);

    $('k-judul-sesi').textContent = 'Sesi ' + state.sesiKe + ' — ' + sesi.judul;
    const materi = materiSesi(state.sesiKe);
    $('k-materi').innerHTML =
      '<ul class="poin">' +
      (sesi.pokok || []).map((p) => '<li>' + p + '</li>').join('') +
      '</ul>' +
      (materi.length
        ? '<div class="subpoin">' + materi.length + ' materi</div><ol class="poin nomor">' +
          materi.map((m) => '<li>' + m.judul + '</li>').join('') + '</ol>'
        : '<div class="subpoin">Materi disampaikan langsung oleh bidan</div>');

    showScreen('s3');
  }

  function initKonfirmasi() {
    // Koreksi sesi pakai dropdown, bukan input angka. Nilainya cuma 1–10,
    // jadi tidak perlu ada peluang salah ketik. Labelnya ikut topik sesi
    // supaya petugas bisa memilih dengan yakin, bukan menghitung sendiri.
    // Hanya sesi yang benar-benar bisa dijalankan. Programnya 10 pertemuan,
    // tapi menawarkan sesi 5–10 di sini berarti petugas bisa memilih sesi
    // yang materi dan soalnya kosong — pre-test-nya nol soal.
    const sel = $('in-koreksi');
    CONTENT.sesi
      .filter((s) => s.ke <= CFG.SESI_TERSEDIA)
      .forEach((s) => {
        const o = el('option', null, 'Sesi ' + s.ke + ' · ' + s.label);
        o.value = String(s.ke);
        sel.appendChild(o);
      });

    $('btn-lanjut-konfirmasi').addEventListener('click', mulaiPreTest);
    $('btn-buka-koreksi').addEventListener('click', bukaKoreksi);
    $('btn-koreksi-tutup').addEventListener('click', tutupKoreksi);
    $('btn-koreksi-batal').addEventListener('click', tutupKoreksi);
    $('btn-koreksi-simpan').addEventListener('click', simpanKoreksi);
  }

  /* ── S3a · KOREKSI MANUAL ──────────────────────────────── */
  function bukaKoreksi() {
    $('in-koreksi').value = String(state.sesiKe);
    $('hint-koreksi').className = 'fh';
    $('hint-koreksi').querySelector('span').textContent = 'Pilih sesi yang sesuai riwayat Ibu';
    $('modal-koreksi').hidden = false;
    icons();
  }

  function tutupKoreksi() {
    $('modal-koreksi').hidden = true;
  }

  function simpanKoreksi() {
    const n = parseInt($('in-koreksi').value, 10);
    const hint = $('hint-koreksi');
    // Dibatasi SESI_TERSEDIA, bukan TOTAL_SESI — sesi 5–10 terdaftar tapi
    // soalnya kosong. Dropdown seharusnya sudah tidak menawarkannya; ini
    // jaring pengaman saja.
    if (isNaN(n) || n < 1 || n > CFG.SESI_TERSEDIA) {
      hint.className = 'fh err';
      hint.querySelector('span').textContent = 'Sesi belum dipilih';
      icons();
      return;
    }
    state.sesiKe = n;
    state.sumberData = 'MANUAL';
    tutupKoreksi();
    tampilKonfirmasi();
  }

  /* ══════════════════════════════════════════════════════
     S4 / S7 · ENGINE KUIS BENAR-SALAH
     ══════════════════════════════════════════════════════ */
  function mulaiPreTest() {
    state.soal = soalSesi(state.sesiKe);
    state.setSoal = kunciSetSoal(state.sesiKe).join(' + ');
    state.jawabanPre = new Array(state.soal.length).fill(null);
    state.qIndex = 0;
    $('pre-sub').textContent = 'Sesi ' + state.sesiKe;
    renderSoal('pre');
    showScreen('s4');
  }

  function mulaiPostTest() {
    // Post-test berlangsung sekitar satu menit, lalu hasilnya disimpan.
    // Container bisa sudah dingin lagi sejak pencarian riwayat tadi —
    // dibangunkan sekarang supaya "Menyimpan hasil..." tidak menanggung
    // cold start di atas waktu tulisnya.
    VT.pemanasan();

    state.jawabanPost = new Array(state.soal.length).fill(null);
    state.qIndex = 0;
    state.percobaanPost += 1;
    $('post-sub').textContent = 'Sesi ' + state.sesiKe;
    renderSoal('post');
    showScreen('s7');
  }

  function renderSoal(mode) {
    const soal = state.soal;
    const i = state.qIndex;
    const s = soal[i];
    const total = soal.length;
    const pct = Math.round(((i + 1) / total) * 100);
    const isPost = mode === 'post';
    const jawaban = isPost ? state.jawabanPost : state.jawabanPre;

    $(mode + '-count').textContent = (i + 1) + ' / ' + total;
    $(mode + '-meta').textContent = 'Soal ' + (i + 1) + ' dari ' + total;
    $(mode + '-pct').textContent = pct + '%';
    $(mode + '-bar').style.width = pct + '%';

    const slot = $(mode + '-slot');
    slot.innerHTML = '';
    if (isPost) $('post-feedback').innerHTML = '';

    const card = el('div', 'qc');
    // Label pakai topik soal itu sendiri, bukan gabungan nama semua set.
    // Satu kunjungan berisi dua topik, jadi pasien perlu tahu yang mana.
    card.appendChild(el('div', 'qn' + (isPost ? ' teal' : ''),
      'SOAL ' + (i + 1) + ' · ' + (s.topik || namaSet(state.sesiKe))));
    card.appendChild(el('div', 'qt', s.pertanyaan));

    OPSI_BS.forEach((o) => {
      const opt = el('button', 'opt');
      opt.type = 'button';
      opt.innerHTML = '<div class="k">' + o.kode + '</div><div>' + o.teks + '</div>';
      if (jawaban[i] === o.val) opt.classList.add('on');
      opt.addEventListener('click', () => pilihOpsi(mode, o.val));
      card.appendChild(opt);
    });

    slot.appendChild(card);

    const btn = $('btn-' + mode + '-lanjut');
    btn.textContent = i === total - 1 ? (isPost ? 'Lihat Hasil' : 'Selesai') : 'Lanjut';
    const belum = jawaban[i] === null;
    btn.disabled = belum;
    btn.className = 'btn ' + (belum ? 'd' : (isPost ? 'g' : 'p'));

    icons();
  }

  function pilihOpsi(mode, val) {
    const isPost = mode === 'post';
    const i = state.qIndex;
    const s = state.soal[i];
    const opts = $(mode + '-slot').querySelectorAll('.opt');

    if (isPost) {
      if (state.jawabanPost[i] !== null) return; // sudah dijawab
      state.jawabanPost[i] = val;

      opts.forEach((o, k) => {
        o.classList.add('lock');
        if (OPSI_BS[k].val === s.kunci) o.classList.add('ok');
        else if (OPSI_BS[k].val === val) o.classList.add('no');
      });

      const benar = val === s.kunci;
      const kunciTeks = s.kunci ? 'Benar' : 'Salah';
      const fb = el('div', 'infobox ' + (benar ? 'ok' : 'warn'));
      fb.innerHTML =
        '<i data-lucide="' + (benar ? 'check-circle-2' : 'x-circle') + '"></i>' +
        '<div><b>' + (benar ? 'Jawaban tepat.' : 'Belum tepat.') + '</b>' +
        'Jawaban yang benar: <b>' + kunciTeks + '</b>.</div>';
      $('post-feedback').innerHTML = '';
      $('post-feedback').appendChild(fb);
    } else {
      state.jawabanPre[i] = val;
      opts.forEach((o, k) => o.classList.toggle('on', OPSI_BS[k].val === val));
    }

    const btn = $('btn-' + mode + '-lanjut');
    btn.disabled = false;
    btn.className = 'btn ' + (isPost ? 'g' : 'p');
    icons();

    // Jawaban tersimpan begitu dipilih. Berpindah soal tidak memanggil
    // showScreen(), jadi progres harus ditulis di sini juga — kalau tidak,
    // ibu yang keluar di soal ke-7 kembali ke soal ke-1.
    simpanProgres();
  }

  function initKuis() {
    $('btn-pre-lanjut').addEventListener('click', () => {
      if (state.jawabanPre[state.qIndex] === null) return;
      if (state.qIndex < state.soal.length - 1) {
        state.qIndex += 1;
        renderSoal('pre');
        simpanProgres();
      } else {
        selesaiPreTest();
      }
    });

    $('btn-post-lanjut').addEventListener('click', () => {
      if (state.jawabanPost[state.qIndex] === null) return;
      if (state.qIndex < state.soal.length - 1) {
        state.qIndex += 1;
        renderSoal('post');
        simpanProgres();
      } else {
        selesaiPostTest();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     S5 · HASIL PRE-TEST
     ══════════════════════════════════════════════════════ */

  // Keliling lingkaran cincin skor — r=52 pada viewBox 120x120.
  const RING_LINGKAR = 2 * Math.PI * 52;

  /**
   * Gambar cincin skor lewat stroke-dasharray.
   * dashoffset = keliling penuh saat 0%, dan 0 saat 100%.
   * Nilai awal disetel penuh dulu supaya transisinya kelihatan bergerak.
   */
  function gambarRing(skor) {
    const isi = $('hp-ring-isi');
    if (!isi) return;
    const nilai = Math.max(0, Math.min(100, Number(skor) || 0));
    const penuh = RING_LINGKAR.toFixed(2);

    isi.style.stroke = nilai >= CFG.KKM ? 'var(--ok)'
      : nilai >= 50 ? 'var(--warn)' : 'var(--bad)';
    isi.style.strokeDasharray = penuh;
    isi.style.strokeDashoffset = penuh;

    const isiKan = () => {
      isi.style.strokeDashoffset = (RING_LINGKAR * (1 - nilai / 100)).toFixed(2);
    };
    // Dua frame supaya nilai awal sempat ter-commit sebelum transisi jalan.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(isiKan));
    } else {
      isiKan();
    }
  }

  function selesaiPreTest() {
    state.skorPre = hitungSkor(state.jawabanPre, state.soal);
    const benar = jumlahBenar(state.jawabanPre, state.soal);

    $('hp-sub').textContent = 'Sesi ' + state.sesiKe;
    $('hp-skor').textContent = state.skorPre;
    $('hp-benar').textContent = benar + ' dari ' + state.soal.length + ' jawaban benar';

    gambarRing(state.skorPre);

    state.materi = materiSesi(state.sesiKe);
    state.materiTuntas = new Array(state.materi.length).fill(false);
    renderPlaylist($('hp-playlist'), 0);

    // Label tombol ikut kondisi: kalau sesi ini tidak punya materi,
    // jangan menjanjikan "Mulai Materi" lalu langsung melompat.
    $('btn-mulai-materi').textContent = state.materi.length
      ? 'Mulai Materi'
      : 'Lanjut ke Post-Test';

    showScreen('s5');
  }

  function initHasilPre() {
    $('btn-mulai-materi').addEventListener('click', () => {
      state.materiIndex = 0;
      tampilMateri();
    });
  }

  /* ══════════════════════════════════════════════════════
     S6 · MATERI (video / dokumen) + GATE
     ══════════════════════════════════════════════════════ */
  function renderPlaylist(container, aktifIdx) {
    container.innerHTML = '';

    // Sesi tanpa materi digital. Terjadi karena materi PDF ditahan dan
    // konsep KIARA tidak menyebut video untuk sesi tersebut. Ditampilkan
    // terang-terangan supaya tidak terlihat seperti aplikasi yang melompat.
    if (!state.materi.length) {
      const kosong = el('div', 'infobox warn');
      kosong.innerHTML =
        '<i data-lucide="info"></i>' +
        '<div><b>Belum ada materi digital untuk sesi ini</b>' +
        'Materi sesi ini disampaikan langsung oleh bidan. ' +
        'Ibu bisa lanjut ke post-test.</div>';
      container.appendChild(kosong);
      icons();
      return;
    }

    state.materi.forEach((m, i) => {
      const tuntas = state.materiTuntas[i];
      const aktif = i === aktifIdx;
      const row = el('div', 'mitem' + (tuntas ? ' done' : aktif ? ' on' : ''));
      const ikon = tuntas ? 'check' : aktif ? (m.tipe === 'dokumen' ? 'book-open' : 'play') : 'lock';
      let ket;
      if (tuntas) ket = 'Selesai';
      else if (aktif) ket = (m.tipe === 'dokumen' ? 'Bacaan' : 'Video') +
        (m.slide ? ' · ' + m.slide + ' halaman' : m.mb ? ' · ' + m.mb + ' MB' : '');
      else ket = 'Terkunci';
      row.innerHTML =
        '<div class="mi"><i data-lucide="' + ikon + '"></i></div>' +
        '<div><div class="mt-t">' + m.judul + '</div><div class="mt-d">' + ket + '</div></div>';
      container.appendChild(row);
    });
    icons();
  }

  function tampilMateri() {
    hentikanTimer();
    const m = state.materi[state.materiIndex];
    if (!m) return mulaiPostTest();

    const idx = state.materiIndex;
    const total = state.materi.length;
    const terakhir = idx === total - 1;

    $('mt-sub').textContent = 'Sesi ' + state.sesiKe;
    $('mt-count').textContent = (idx + 1) + ' / ' + total;
    $('mt-label').textContent = 'MATERI ' + (idx + 1);
    $('mt-title').textContent = m.judulPanjang;

    // Tombol lanjut DISEMBUNYIKAN, bukan cuma dinonaktifkan. Selama materi
    // belum tuntas, tombolnya tidak ada — jadi tidak ada yang bisa ditekan
    // dan tidak menimbulkan kesan "tombol rusak".
    const btn = $('btn-materi-lanjut');
    btn.textContent = terakhir ? 'Lanjut ke Post-Test' : 'Materi Berikutnya';
    btn.className = 'btn p';
    btn.disabled = true;
    btn.hidden = true;

    $('mt-gate-note').hidden = false;
    $('btn-dok-selesai').hidden = true;
    $('btn-dok-selesai').className = 'btn o';
    $('btn-dok-selesai').disabled = false;

    if (m.tipe === 'dokumen') {
      tampilDokumen(m);
    } else {
      tampilVideo(m);
    }

    renderPlaylist($('mt-playlist'), idx);
    showScreen('s6');
  }

  /* ══════════════════════════════════════════════════════
     LAYAR PENUH

     Kontrol bawaan video dimatikan oleh ANTI_SKIP — dan tombol layar penuh
     ikut hilang bersamanya, karena dia bagian dari kontrol bawaan itu.

     Yang di-fullscreen adalah KOTAK PEMBUNGKUS (.vid), bukan elemen
     <video>-nya. Kalau elemen videonya yang di-fullscreen, browser
     memunculkan pemutar bawaannya beserta progress bar — dan anti-skip
     jadi sia-sia.

     Kalau Fullscreen API tidak tersedia (Safari iOS tidak mendukung
     fullscreen untuk elemen sembarang, hanya untuk <video>), tombolnya
     disembunyikan. Lebih baik tidak ada tombol daripada tombol yang
     menghadirkan seek bar.
     ══════════════════════════════════════════════════════ */
  function fullscreenDidukung() {
    const el = $('mt-video');
    return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen));
  }

  function sedangFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    const el = $('mt-video');
    if (!el) return;

    if (sedangFullscreen()) {
      const keluar = document.exitFullscreen || document.webkitExitFullscreen;
      if (keluar) keluar.call(document);
      return;
    }

    const masuk = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!masuk) return;

    // Promise-nya bisa ditolak (mis. gestur pengguna dianggap tidak sah).
    // Ditangkap supaya tidak muncul unhandled rejection di console.
    Promise.resolve(masuk.call(el)).then(() => {
      // Video 16:9 di HP tegak akan banyak kotak hitam. Coba putar ke
      // lanskap — banyak browser menolak, dan itu tidak masalah.
      const o = window.screen && window.screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(() => {});
    }).catch(() => {});
  }

  /** Samakan ikon tombol dengan keadaan sebenarnya. */
  function segarkanIkonFullscreen() {
    const btn = $('mt-fs');
    if (!btn) return;
    const penuh = sedangFullscreen();
    btn.innerHTML = '<i data-lucide="' + (penuh ? 'minimize' : 'maximize') + '"></i>';
    btn.setAttribute('aria-label', penuh ? 'Keluar dari layar penuh' : 'Layar penuh');
    icons();
  }

  /* ── Materi berupa video ───────────────────────────────── */
  function tampilVideo(m) {
    $('mt-video').hidden = false;
    $('mt-dok').hidden = true;
    $('mt-video').classList.remove('playing');
    $('mt-shell').innerHTML = '';
    $('mt-play').classList.remove('hide');
    $('mt-bar').style.width = '0%';
    $('mt-time').textContent = '';
    // Tombol layar penuh hanya untuk video, dan hanya kalau didukung.
    $('mt-fs').hidden = !fullscreenDidukung();
    segarkanIkonFullscreen();
    resetTonton();
    $('mt-gate-text').textContent = CFG.ANTI_SKIP
      ? 'Video tidak bisa dipercepat. Tombol lanjut aktif setelah ditonton ' +
        Math.round(CFG.MIN_TONTON_PERSEN * 100) + '%.'
      : 'Tonton sampai selesai untuk lanjut';
  }

  function resetTonton() {
    tonton.akum = 0;
    tonton.last = 0;
    tonton.kunci = false;
    tonton.durasi = 0;
  }

  /**
   * Gambar ulang bar dan keterangan tonton dari nilai `tonton` yang ada.
   * Dipakai juga saat memulihkan progres, supaya ibu langsung melihat
   * bagian yang sudah ia tonton tadi — bukan bar kosong yang bikin ragu.
   */
  function gambarProgresTonton() {
    if (!tonton.durasi) return;
    const target = tonton.durasi * CFG.MIN_TONTON_PERSEN;
    $('mt-bar').style.width = Math.min(100, (tonton.akum / target) * 100) + '%';
    $('mt-time').textContent =
      jam(tonton.akum) + ' ditonton dari ' + jam(tonton.durasi);
  }

  /**
   * Catat detik yang benar-benar diputar.
   *
   * Kenapa tidak mengandalkan event "selesai": pasien bisa menggeser progress
   * bar ke ujung, dan event itu tetap ikut memicu. Jadi yang dijadikan patokan
   * adalah akumulasi delta waktu yang wajar (≤1,5 detik per pembacaan).
   * Lompatan maju tidak dihitung, dan kalau ANTI_SKIP aktif posisinya dibalikin.
   *
   * @param seekBack fungsi untuk memundurkan pemutar ke posisi terakhir yang sah
   * @returns true kalau ambang tonton sudah tercapai
   */
  function catatTonton(t, durasi, seekBack) {
    if (!durasi || isNaN(durasi)) return false;
    const delta = t - tonton.last;

    if (delta > 0 && delta <= 1.5) {
      tonton.akum += delta;                       // pemutaran wajar
    } else if (delta > 1.5 && CFG.ANTI_SKIP && seekBack) {
      seekBack(tonton.last);                      // lompatan maju — balikin
      return false;                               // last sengaja tidak diubah
    }
    tonton.last = t;
    tonton.durasi = durasi;

    // Simpan tiap 5 detik tontonan, bukan tiap pembacaan (2×/detik) —
    // menulis localStorage 2×/detik selama video 10 menit itu sia-sia.
    if (tonton.akum - simpanTerakhir >= 5) {
      simpanTerakhir = tonton.akum;
      simpanProgres();
    }

    const target = durasi * CFG.MIN_TONTON_PERSEN;
    $('mt-bar').style.width = Math.min(100, (tonton.akum / target) * 100) + '%';
    $('mt-time').textContent =
      jam(tonton.akum) + ' ditonton dari ' + jam(durasi);
    return tonton.akum >= target;
  }

  /** Dipanggil dari kedua jenis pemutar saat ambang tercapai. */
  function cekGateVideo(cukup) {
    if (!cukup || tonton.kunci) return;
    tonton.kunci = true;
    bukaGate();
  }

  async function putarVideo() {
    const m = state.materi[state.materiIndex];
    if (!m || m.tipe === 'dokumen') return;

    $('mt-play').classList.add('hide');
    $('mt-video').classList.add('playing');
    hentikanTimer();

    // Mode placeholder: file media belum dipindahkan ke folder media/
    if (CFG.PLACEHOLDER_MODE) {
      $('mt-shell').innerHTML =
        '<div class="dok-kosong">Video belum tersedia di folder media/' +
        '<br><span>Mode placeholder — gate dilepas otomatis</span></div>';
      jalankanDwell(CFG.PLACEHOLDER_DWELL_MS);
      return;
    }

    if (m.tipe === 'youtube') {
      await siapkanYT();
      const holder = el('div');
      holder.id = 'yt-holder';
      $('mt-shell').innerHTML = '';
      $('mt-shell').appendChild(holder);
      if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy();
      ytPlayer = new window.YT.Player('yt-holder', {
        videoId: m.youtubeId,
        playerVars: {
          rel: 0,
          playsinline: 1,
          autoplay: 1,
          // Sembunyikan progress bar dan matikan pintasan keyboard supaya
          // tidak ada cara mudah melompat ke akhir video.
          controls: CFG.ANTI_SKIP ? 0 : 1,
          disablekb: CFG.ANTI_SKIP ? 1 : 0,
          fs: CFG.ANTI_SKIP ? 0 : 1
        },
        events: {
          onStateChange: (e) => {
            // ENDED hanya dihormati kalau akumulasi tontonnya memang cukup.
            if (e.data === window.YT.PlayerState.ENDED) {
              const d = ytPlayer.getDuration ? ytPlayer.getDuration() : 0;
              cekGateVideo(tonton.akum >= d * CFG.MIN_TONTON_PERSEN);
            }
          },
          onReady: () => {
            barTimer = setInterval(() => {
              if (!ytPlayer || !ytPlayer.getCurrentTime || tonton.kunci) return;
              cekGateVideo(catatTonton(
                ytPlayer.getCurrentTime(),
                ytPlayer.getDuration(),
                (kembali) => ytPlayer.seekTo(kembali, true)
              ));
            }, 500);
          }
        }
      });
      return;
    }

    // mp4 lokal
    const v = document.createElement('video');
    v.src = m.url;
    // Kalau anti-skip aktif, kontrol bawaan disembunyikan supaya tidak ada
    // progress bar untuk digeser. Jeda/putar tetap bisa lewat ketuk video.
    v.controls = !CFG.ANTI_SKIP;
    v.playsInline = true;
    v.autoplay = true;
    v.setAttribute('disablepictureinpicture', '');
    if (CFG.ANTI_SKIP) {
      v.style.cursor = 'pointer';
      v.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
    }
    v.addEventListener('timeupdate', () => {
      if (tonton.kunci) return;
      cekGateVideo(catatTonton(v.currentTime, v.duration,
        (kembali) => { v.currentTime = kembali; }));
    });
    v.addEventListener('ended', () => {
      cekGateVideo(tonton.akum >= (v.duration || 0) * CFG.MIN_TONTON_PERSEN);
    });
    /* Pesan galat lama hanya menulis "Video tidak bisa dimuat" tanpa alasan,
       jadi laporan dari lapangan ("video X tidak bisa") tidak bisa dilacak:
       jaringan putus, berkas hilang, dan codec tidak didukung semuanya
       terlihat sama. MediaError membedakan keempatnya — tampilkan. */
    v.addEventListener('error', () => {
      const e = v.error || {};
      const sebab = {
        1: 'Pemuatan dibatalkan.',
        2: 'Jaringan terputus saat memuat video.',
        3: 'Video rusak atau tidak bisa dibaca perangkat ini.',
        4: 'Format video tidak didukung perangkat ini, atau berkasnya tidak ditemukan.'
      }[e.code] || 'Penyebabnya tidak diketahui.';

      const saran = e.code === 2
        ? 'Coba lagi setelah sinyal stabil.'
        : e.code === 4
          ? 'Laporkan ke petugas — video ini perlu diperiksa.'
          : 'Coba muat ulang halaman.';

      console.error('[KIARA] video gagal:', {
        url: m.url, kode: e.code, pesan: e.message,
        networkState: v.networkState, readyState: v.readyState
      });

      $('mt-shell').innerHTML =
        '<div class="dok-kosong">Video tidak bisa dimuat.' +
        '<br><span>' + sebab + ' ' + saran + '</span>' +
        '<br><span>Kode ' + (e.code || '?') + ' &middot; ' + m.url + '</span></div>';
    });
    $('mt-shell').innerHTML = '';
    $('mt-shell').appendChild(v);
  }

  /* ── Materi berupa dokumen (komik / slide PDF) ─────────── */
  function tampilDokumen(m) {
    $('mt-video').hidden = true;
    $('mt-dok').hidden = false;
    $('mt-fs').hidden = true;   // layar penuh hanya untuk video

    $('mt-dok-info').textContent = m.judul + (m.slide ? ' · ' + m.slide + ' halaman' : '');
    $('mt-dok-open').href = m.url;
    $('mt-time').textContent = '';

    // PDF sering tidak bisa di-render inline di browser HP.
    // Iframe dicoba dulu, tautan "buka di tab baru" jadi jalan pintasnya.
    $('mt-dok-shell').innerHTML = CFG.PLACEHOLDER_MODE
      ? '<div class="dok-kosong">Dokumen belum tersedia di folder media/' +
        '<br><span>Mode placeholder — gate dilepas otomatis</span></div>'
      : '<iframe src="' + m.url + '#toolbar=0" title="' + m.judul + '"></iframe>';

    // Waktu baca minimal ikut jumlah halaman — 15 detik untuk deck 28 halaman
    // tidak masuk akal. Slide 28 halaman × 2 detik = 56 detik.
    const dwell = CFG.PLACEHOLDER_MODE
      ? CFG.PLACEHOLDER_DWELL_MS
      : Math.max(CFG.DOKUMEN_DWELL_MS,
                 (m.slide || 1) * (CFG.DOKUMEN_DETIK_PER_HALAMAN || 2) * 1000);

    const tombol = $('btn-dok-selesai');
    tombol.hidden = false;
    tombol.disabled = true;
    tombol.className = 'btn d';

    const selesaiBaca = () => {
      tombol.disabled = false;
      tombol.className = 'btn o';
      $('mt-gate-text').textContent =
        'Kalau sudah selesai membaca, tekan tombol konfirmasi di bawah.';
      icons();
    };

    jalankanDwell(dwell, selesaiBaca, (sisa) => {
      $('mt-gate-text').textContent = sisa > 0
        ? 'Baca materi ini dulu. Tombol konfirmasi aktif dalam ' + sisa + ' detik.'
        : 'Kalau sudah selesai membaca, tekan tombol konfirmasi di bawah.';
    });
  }

  /**
   * Timer bersama untuk gate berbasis waktu.
   * onSelesai kosong = langsung buka gate (dipakai mode placeholder video).
   */
  function jalankanDwell(durasi, onSelesai, onTick) {
    hentikanTimer();
    let lewat = 0;
    const langkah = 200;
    if (onTick) onTick(Math.ceil(durasi / 1000));
    barTimer = setInterval(() => {
      lewat += langkah;
      const pct = Math.min(100, (lewat / durasi) * 100);
      $('mt-bar').style.width = pct + '%';
      if (onTick) onTick(Math.max(0, Math.ceil((durasi - lewat) / 1000)));
      if (pct >= 100) clearInterval(barTimer);
    }, langkah);
    gateTimer = setTimeout(() => {
      if (onSelesai) onSelesai();
      else bukaGate();
    }, durasi);
  }

  function bukaGate() {
    hentikanTimer();
    const btn = $('btn-materi-lanjut');
    btn.hidden = false;          // baru muncul setelah materi tuntas
    btn.disabled = false;
    btn.className = 'btn p';
    $('mt-bar').style.width = '100%';
    $('mt-gate-note').hidden = true;
    $('btn-dok-selesai').hidden = true;
    state.materiTuntas[state.materiIndex] = true;
    renderPlaylist($('mt-playlist'), state.materiIndex);
    simpanProgres();
  }

  function siapkanYT() {
    if (ytApiSiap) return ytApiSiap;
    ytApiSiap = new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => resolve();
      document.head.appendChild(tag);
    });
    return ytApiSiap;
  }

  function initMateri() {
    $('mt-play').addEventListener('click', putarVideo);

    $('mt-fs').addEventListener('click', toggleFullscreen);
    // Ikut keadaan sebenarnya, bukan cuma saat tombol ditekan — pasien bisa
    // keluar dari layar penuh lewat tombol Back atau Esc tanpa lewat tombol ini.
    ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => {
      document.addEventListener(ev, segarkanIkonFullscreen);
    });

    $('btn-dok-selesai').addEventListener('click', bukaGate);
    $('btn-materi-lanjut').addEventListener('click', () => {
      if (state.materiIndex < state.materi.length - 1) {
        state.materiIndex += 1;
        tampilMateri();
      } else {
        mulaiPostTest();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     SIMPAN + S8 / S12
     ══════════════════════════════════════════════════════ */
  async function selesaiPostTest() {
    state.skorPost = hitungSkor(state.jawabanPost, state.soal);

    busy(true, 'Menyimpan hasil...');
    let gagal = '';
    try {
      // Payload mengikuti 13 kolom sheet yang disediakan puskesmas.
      // Jumlah percobaan post-test, materi yang tuntas, dan penanda
      // SUMBER_DATA=MANUAL tidak punya kolom, jadi tidak dikirim.
      const r = await VT.save({
        nik: state.nik,
        nama: state.nama,
        noHp: state.hp,
        alamat: state.alamat,
        kelurahan: state.kelurahan,
        puskesmas: state.puskesmas,
        kunjunganKe: state.sesiKe,
        tanggal: VT.todayJakarta(),
        skorPre: state.skorPre,
        skorPost: state.skorPost,
        allowUpdate: state.tersimpan
      });
      state.tersimpan = true;
      if (r && r.rataPost != null) state.rataPost = r.rataPost;
    } catch (err) {
      gagal = err.message;
    }
    busy(false);

    if (state.skorPost >= CFG.KKM) tampilHasilAkhir(gagal);
    else tampilBelumKKM(gagal);
  }

  function renderSteps(container, selesai, sekarang) {
    container.innerHTML = '';
    // Maksimal 5 kolom per baris; kalau sesinya kurang dari itu, kolomnya
    // ikut menyusut supaya tidak ada sel kosong di ujung baris.
    container.style.setProperty('--steps-kolom', Math.min(5, CFG.TOTAL_SESI));
    for (let i = 1; i <= CFG.TOTAL_SESI; i++) {
      const s = el('div', 'step');
      if (i <= selesai) { s.classList.add('done'); s.innerHTML = '<i data-lucide="check"></i>'; }
      else if (i === sekarang) { s.classList.add('now'); s.textContent = i; }
      else { s.textContent = i; }
      container.appendChild(s);
    }
    icons();
  }

  function tampilHasilAkhir(gagal) {
    const delta = state.skorPost - state.skorPre;

    $('ha-sub').textContent = 'Sesi ' + state.sesiKe + ' selesai';
    $('ha-badge').querySelector('span').textContent = 'LULUS · KKM ' + CFG.KKM;
    $('ha-pre').textContent = state.skorPre;
    $('ha-post').textContent = state.skorPost;
    $('ha-delta').textContent = (delta >= 0 ? '+' : '') + delta;
    $('ha-nama').textContent = state.nama;
    $('ha-sesi').textContent = 'Ke-' + state.sesiKe + ' dari ' + CFG.TOTAL_SESI;
    $('ha-kelurahan').textContent = state.kelurahan;
    $('ha-puskesmas').textContent = state.puskesmas;
    $('ha-tanggal').textContent = tanggalTampil(VT.todayJakarta());

    renderSteps($('ha-steps'), state.sesiKe, state.sesiKe);

    const sisa = CFG.TOTAL_SESI - state.sesiKe;
    $('ha-sisa').innerHTML = sisa > 0
      ? '<b class="c-rose">' + sisa + ' sesi lagi</b> untuk menyelesaikan kelas'
      : '<b class="c-ok">Seluruh ' + CFG.TOTAL_SESI + ' sesi sudah selesai</b>';

    peringatanSimpan($('ha-simpan-warn'), gagal);
    $('btn-wa-hasil').hidden = !CFG.ENABLE_WA_BUTTON;

    // Sesi tuntas dan KKM tercapai. Buang progres supaya pemulihan tidak
    // menawarkan sesi yang sudah masuk sheet — itu jalan menuju submit dobel.
    // Sekaligus NIK dan nama tidak tertinggal di HP lebih lama dari perlunya.
    //
    // Kalau simpan ke server GAGAL, progres justru dipertahankan: ibu masih
    // bisa membuka ulang dan mencoba kirim lagi, bukan kehilangan hasilnya.
    if (!gagal) hapusProgres();

    showScreen('s8');
  }

  function tampilBelumKKM(gagal) {
    const delta = state.skorPost - state.skorPre;

    $('kk-sub').textContent = 'Sesi ' + state.sesiKe;
    $('kk-badge').textContent = 'BELUM CAPAI KKM ' + CFG.KKM;
    $('kk-pre').textContent = state.skorPre;
    $('kk-post').textContent = state.skorPost;
    $('kk-delta').textContent = (delta >= 0 ? '+' : '') + delta;
    $('kk-note').textContent =
      'Kehadiran Ibu hari ini sudah masuk sebagai Sesi ke-' + state.sesiKe + '.';

    const batas = CFG.MAX_PERCOBAAN_POST;
    const boleh = batas == null || state.percobaanPost < batas;
    $('btn-kk-ulang').hidden = !boleh;
    $('btn-kk-tonton').hidden = !boleh;

    // Kalau percobaan sudah habis, tidak ada lagi tombol aksi di layar ini.
    // Catatannya diganti supaya pasien tahu harus lapor petugas, bukan
    // ditinggal menatap layar tanpa jalan keluar.
    $('kk-catatan').textContent = boleh
      ? 'Hasil dikirim ke bidan setelah nilai Ibu mencapai KKM. ' +
        'Kehadiran hari ini tetap tercatat.'
      : 'Batas percobaan post-test sudah tercapai. Kehadiran hari ini tetap ' +
        'tercatat — silakan lapor ke petugas.';

    peringatanSimpan($('kk-simpan-warn'), gagal);
    showScreen('s12');
  }

  function peringatanSimpan(box, msg) {
    if (!msg) { box.hidden = true; return; }
    box.textContent = 'Hasil belum tersimpan ke server (' + msg +
      '). Kirim hasil ke WhatsApp tetap bisa, tapi mohon tunjukkan layar ini ke petugas.';
    box.hidden = false;
  }

  /* ══════════════════════════════════════════════════════
     S9 · PROGRESS 10 SESI
     ══════════════════════════════════════════════════════ */
  function tampilProgress(dari) {
    state.screenSebelumnya = dari || 's8';
    const selesai = state.tersimpan ? state.sesiKe : Math.max(0, state.sesiKe - 1);
    const pct = Math.round((selesai / CFG.TOTAL_SESI) * 100);

    $('pg-nama').textContent = state.nama;
    $('pg-count').textContent = selesai + ' / ' + CFG.TOTAL_SESI;
    $('pg-bar').style.width = pct + '%';
    $('pg-meta').textContent = selesai + ' sesi selesai';
    $('pg-pct').textContent = pct + '%';

    const tgl = {};
    state.riwayat.forEach((r) => { tgl[r.kunjunganKe] = r.tanggal; });
    if (state.tersimpan) tgl[state.sesiKe] = VT.todayJakarta();

    const list = $('pg-list');
    list.innerHTML = '';
    CONTENT.sesi.forEach((s) => {
      const sudah = s.ke <= selesai;
      const kini = s.ke === selesai + 1;
      const row = el('div', 'hrow' + (kini ? ' nowrow' : sudah ? '' : ' lockrow'));
      const ikon = sudah ? 'check' : kini ? 'arrow-right'
        : s.ke === CFG.TOTAL_SESI ? 'flag' : 'lock';
      const dot = sudah ? 'done' : kini ? 'now' : 'lock';
      const ket = sudah ? tanggalSingkat(tgl[s.ke]) : kini ? 'Berikutnya' : '';
      row.innerHTML =
        '<div class="hdot ' + dot + '"><i data-lucide="' + ikon + '"></i></div>' +
        '<div class="t">S' + s.ke + ' · ' + s.label + '</div>' +
        '<div class="dt">' + ket + '</div>';
      list.appendChild(row);
    });

    showScreen('s9');
  }

  /* ══════════════════════════════════════════════════════
     S10 · SUDAH LULUS   ·   S11 · DUPLIKAT
     ══════════════════════════════════════════════════════ */
  function tampilSudahLulus() {
    $('ll-nama').textContent = state.nama;
    $('ll-jumlah').textContent = String(CFG.TOTAL_SESI);
    $('ll-total').textContent = CFG.TOTAL_SESI + ' dari ' + CFG.TOTAL_SESI;
    $('ll-rata').textContent = state.rataPost || '-';
    renderSteps($('ll-steps'), CFG.TOTAL_SESI, 0);
    showScreen('s10');
  }

  /**
   * Sesi berikutnya di luar jangkauan aplikasi.
   *
   * Bukan kesalahan pasien dan bukan kegagalan sistem — programnya memang
   * 10 pertemuan sementara materi yang dikirim puskesmas baru sampai
   * kunjungan ke-SESI_TERSEDIA. Ditampilkan terang-terangan supaya tidak
   * terlihat seperti aplikasi rusak.
   */
  function tampilBelumTersedia(r) {
    const ke = r.kunjunganKe;
    const sesi = sesiData(ke);
    state.sesiKe = ke;
    state.riwayat = r.riwayat || [];
    state.tersimpan = true;   // jangan sampai layar ini memicu penyimpanan

    $('bt-sub').innerHTML = 'Sesi ke-' + ke + ' dari ' + CFG.TOTAL_SESI +
      '<br>belum bisa dijalankan di aplikasi';
    $('bt-nama').textContent = state.nama || '-';
    $('bt-sesi').textContent = 'Ke-' + ke + (sesi ? ' · ' + sesi.judul : '');
    $('bt-selesai').textContent = state.riwayat.length + ' dari ' + CFG.TOTAL_SESI + ' sesi';

    showScreen('s-belum');
  }

  function tampilDuplikat(r) {
    const log = r.logHariIni;
    state.sesiKe = r.kunjunganKe;
    state.riwayat = r.riwayat || [];
    state.tersimpan = true;

    $('dp-sub').innerHTML = 'Sesi ke-' + r.kunjunganKe + ' Ibu <b>' + state.nama +
      '</b> sudah<br>tersimpan pada ' + tanggalTampil(VT.todayJakarta());

    if (log) {
      $('dp-data').hidden = false;
      $('dp-pre').textContent = log.skorPre != null ? log.skorPre : '-';
      $('dp-post').textContent = log.skorPost != null ? log.skorPost : '-';
      $('dp-status').textContent = log.statusKkm || '-';
      $('dp-status').className = log.statusKkm === 'LULUS' ? 'c-ok' : '';
    } else {
      $('dp-data').hidden = true;
    }

    showScreen('s11');
  }

  /* ══════════════════════════════════════════════════════
     WHATSAPP
     ══════════════════════════════════════════════════════ */
  function kirimWaHasil() {
    const delta = state.skorPost - state.skorPre;
    const pesan = isiTemplate(CONTENT.waTemplateHasil, {
      nama: state.nama,
      nikMask: state.nikMask,
      alamat: state.alamat,
      kelurahan: state.kelurahan,
      puskesmas: state.puskesmas,
      sesi: state.sesiKe,
      total: CFG.TOTAL_SESI,
      tanggal: tanggalTampil(VT.todayJakarta()),
      skorPre: state.skorPre,
      skorPost: state.skorPost,
      delta: (delta >= 0 ? '+' : '') + delta,
      statusKkm: state.skorPost >= CFG.KKM ? 'LULUS' : 'BELUM',
      kkm: CFG.KKM
    });
    // Tidak ada kolom "WA terkirim" di struktur sheet, jadi tidak ada
    // yang perlu ditandai ke backend.
    bukaWa(pesan);
  }

  function kirimWaRekap() {
    const pesan = isiTemplate(CONTENT.waTemplateRekap, {
      nama: state.nama,
      nikMask: state.nikMask,
      alamat: state.alamat,
      kelurahan: state.kelurahan,
      puskesmas: state.puskesmas,
      selesai: CFG.TOTAL_SESI,
      total: CFG.TOTAL_SESI,
      rataPost: state.rataPost || '-',
      status: 'LULUS'
    });
    bukaWa(pesan);
  }

  function bukaWa(pesan) {
    window.open('https://wa.me/' + CFG.TARGET_PHONE + '?text=' + encodeURIComponent(pesan), '_blank');
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  function initAksiLain() {
    // Layar belum-KKM (S12) tidak punya tombol kirim WhatsApp — hasil di
    // bawah KKM tidak dikirim ke bidan.
    $('btn-wa-hasil').addEventListener('click', kirimWaHasil);
    $('btn-wa-rekap').addEventListener('click', kirimWaRekap);
    $('btn-kk-selesai').addEventListener('click', () => location.reload());

    $('btn-lihat-progress').addEventListener('click', () => tampilProgress('s8'));
    $('btn-dup-progress').addEventListener('click', () => tampilProgress('s11'));
    $('btn-bt-progress').addEventListener('click', () => tampilProgress('s-belum'));
    $('btn-bt-awal').addEventListener('click', () => {
      hapusProgres();
      location.reload();
    });
    $('btn-progress-kembali').addEventListener('click', () => showScreen(state.screenSebelumnya));

    $('btn-selesai').addEventListener('click', () => location.reload());
    // Dua tautan ini artinya "ini bukan data saya". Progres di HP dibuang
    // dulu, kalau tidak muat ulang halaman justru menawarkan data yang
    // baru saja disangkal.
    $('btn-dup-awal').addEventListener('click', () => {
      hapusProgres();
      location.reload();
    });
    $('btn-lulus-bukan-saya').addEventListener('click', () => {
      hapusProgres();
      location.reload();
    });

    $('btn-kk-tonton').addEventListener('click', () => {
      state.materiIndex = 0;
      state.materiTuntas = new Array(state.materi.length).fill(false);
      tampilMateri();
    });
    $('btn-kk-ulang').addEventListener('click', mulaiPostTest);
  }

  function peringatanKonfigurasi() {
    const p = [];
    if (!CFG.SHEETS_ENDPOINT && !CFG.OFFLINE_MODE) p.push('SHEETS_ENDPOINT belum diisi di config.js');
    if (CFG.OFFLINE_MODE) p.push('OFFLINE_MODE masih true — data hanya tersimpan di HP ini');
    if (CFG.PLACEHOLDER_MODE) p.push('PLACEHOLDER_MODE masih true — gate materi dilepas otomatis');

    // Sisa set yang kuncinya masih turunan, bukan resmi dari puskesmas.
    // Paket 9 Agustus menandai kunci dengan huruf tebal, jadi set aktif
    // sudah resmi — yang tersisa hanya set yang ditahan.
    const turunan = Object.keys(CONTENT.setSoal)
      .filter((k) => CONTENT.setSoal[k].kunciTurunan)
      .map((k) => CONTENT.setSoal[k].nama);
    if (turunan.length) {
      p.push('KUNCI JAWABAN MASIH TURUNAN, BUKAN RESMI pada ' + turunan.length +
             ' set (' + turunan.join(', ') + ') — harus diverifikasi bidan');
    }

    // Jumlah soal per sesi TIDAK seragam — kunjungan 3 punya 15 soal
    // (tiga topik), sisanya 10. Yang diperiksa: setiap sesi punya soal, dan
    // jumlahnya kelipatan SOAL_PER_TOPIK. Kalau ada topik yang soalnya
    // kurang dari 5, itu tanda berkas sumbernya terpotong.
    //
    // Hanya sesi yang bisa dijalankan yang diperiksa. Sesi 5–10 memang
    // sengaja nol soal — yang menahannya SESI_TERSEDIA, bukan kelalaian.
    CONTENT.sesi
      .filter((s) => s.ke <= CFG.SESI_TERSEDIA)
      .forEach((s) => {
        const n = soalSesi(s.ke).length;
        const topik = kunciSetSoal(s.ke).length;
        if (!n) {
          p.push('Sesi ' + s.ke + ' tidak punya soal sama sekali — pre-test akan kosong');
        } else if (n !== topik * CFG.SOAL_PER_TOPIK) {
          p.push('Sesi ' + s.ke + ' punya ' + n + ' soal dari ' + topik + ' topik, ' +
                 'seharusnya ' + (topik * CFG.SOAL_PER_TOPIK) +
                 ' — ada topik yang soalnya tidak lengkap');
        }
      });

    if (CFG.SESI_TERSEDIA < CFG.TOTAL_SESI) {
      p.push('Sesi ' + (CFG.SESI_TERSEDIA + 1) + '–' + CFG.TOTAL_SESI +
             ' belum ada materi dan soalnya — ibu yang sampai di situ melihat ' +
             'layar "belum tersedia"');
    }

    const suspek = [];
    Object.keys(CONTENT.setSoal).forEach((k) => {
      CONTENT.setSoal[k].soal.forEach((s, i) => {
        const pk = s.perluKonfirmasi || (s.varian && ((s.varian.TTD || {}).perluKonfirmasi || (s.varian.MMS || {}).perluKonfirmasi));
        if (pk) suspek.push(CONTENT.setSoal[k].nama + ' soal ' + (i + 1));
      });
    });
    if (suspek.length) p.push('Kunci jawaban bergantung pedoman/kebijakan: ' + suspek.join(', '));

    console.warn('%cKIARA — perlu dibereskan sebelum dipakai pasien:', 'font-weight:bold');
    p.forEach((x) => console.warn('  • ' + x));
  }

  /* ------------------------------------------------------
     NOTE GRUP WHATSAPP  ·  S8 + S12
     ------------------------------------------------------
     Note ini muncul di layar hasil, SESUDAH penyimpanan selesai.
     Sengaja tidak dipasang di tengah alur: membuka WhatsApp
     memindahkan ibu keluar dari browser, dan halaman di latar bisa
     dimatikan sistem sebelum hasilnya tersimpan.

     Dikendalikan CFG.WA_GRUP_LINK. Kosong = note disembunyikan,
     tanpa perlu mengubah HTML. */
  function isiNoteGrup() {
    const tautan = String(CFG.WA_GRUP_LINK || '').trim();

    // Hanya terima tautan undangan grup WhatsApp yang sah. Salah tulis di
    // config tidak boleh berubah jadi tautan ke tempat lain, karena yang
    // mengkliknya ibu hamil yang percaya ini dari puskesmas.
    const sah = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(tautan);

    if (tautan && !sah) {
      console.warn('KIARA — WA_GRUP_LINK diabaikan, bukan tautan undangan ' +
        'grup WhatsApp yang sah: ' + tautan);
    }

    [['ha-grup', 'ha-grup-link'], ['kk-grup', 'kk-grup-link']].forEach(([kotak, anchor]) => {
      const box = $(kotak);
      const a = $(anchor);
      if (!box || !a) return;
      if (!sah) { box.hidden = true; return; }
      a.href = tautan;
      box.hidden = false;
    });
  }

  function init() {
    icons();
    initSplash();
    initLanjut();
    initIdentifikasi();
    initKonfirmasi();
    initKuis();
    initHasilPre();
    initMateri();
    initAksiLain();
    isiNoteGrup();
    peringatanKonfigurasi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.KIARA_DEBUG = {
    state: state,
    showScreen: showScreen,
    resetOffline: VT.resetOffline,
    soalSesi: soalSesi,
    materiSesi: materiSesi,
    // Progres tertunda — untuk menguji pemulihan tanpa harus menutup browser.
    bacaProgres: bacaProgres,
    simpanProgres: simpanProgres,
    hapusProgres: hapusProgres
  };
})();
