/**
 * KIARA — Visit Tracker
 *
 * Inti fitur auto-detect: cari riwayat berdasarkan NIK, tentukan ini
 * sesi ke berapa, dan jaga supaya tidak ada submit dobel.
 *
 * Struktur sheet yang dipakai: SATU sheet datar, 13 kolom
 *   No | Date | Time | Nama | NIK | No WA | Alamat | Kelurahan |
 *   Puskesmas | Kunjungan ke- | Pre-Test | Post-Test | Status
 *
 * Satu baris = satu kunjungan. Nomor sesi berikutnya dihitung dari baris
 * ber-NIK sama dengan nilai "Kunjungan ke-" paling besar.
 *
 * ⚠️ NIK dikirim dan disimpan apa adanya, sesuai struktur yang diminta
 *    puskesmas. Karena endpoint memakai GET, NIK ikut muncul di query
 *    string dan tercatat di log eksekusi Apps Script.
 */
window.VisitTracker = (function () {
  'use strict';

  const CFG = window.KIARA_CONFIG;
  const LS_KEY = 'kiara_offline_db_v1';

  /* ── UTIL ──────────────────────────────────────────────── */

  /** Tanggal hari ini di zona Asia/Jakarta, format YYYY-MM-DD. */
  function todayJakarta() {
    const now = new Date();
    const jkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const pad = (n) => String(n).padStart(2, '0');
    return jkt.getFullYear() + '-' + pad(jkt.getMonth() + 1) + '-' + pad(jkt.getDate());
  }

  function bersihNik(nik) {
    return String(nik == null ? '' : nik).replace(/\D/g, '');
  }

  /** 3175xxxxxxxx1234 → 3175••••••••1234. Untuk tampilan, bukan penyimpanan. */
  function maskNIK(nik) {
    const clean = bersihNik(nik);
    if (clean.length < 8) return clean;
    return clean.slice(0, 4) + '•'.repeat(Math.max(0, clean.length - 8)) + clean.slice(-4);
  }

  function isNIKValid(nik) {
    return /^\d{16}$/.test(bersihNik(nik));
  }

  function isHPValid(hp) {
    return /^0\d{8,14}$/.test(String(hp).replace(/[\s-]/g, ''));
  }

  /* ── OFFLINE STORE (uji alur tanpa backend) ─────────────── */

  function offlineRead() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || { pasien: {}, log: {} };
    } catch (e) {
      return { pasien: {}, log: {} };
    }
  }

  function offlineWrite(db) {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  }

  function offlineLookup(nik) {
    const db = offlineRead();
    const p = db.pasien[nik];
    if (!p) return { ok: true, baru: true, kunjungan: 1, riwayat: [] };
    const riwayat = Object.values(db.log[nik] || {})
      .sort((a, b) => a.kunjunganKe - b.kunjunganKe);
    return {
      ok: true,
      baru: false,
      nama: p.nama,
      noHp: p.noHp,
      alamat: p.alamat,
      kelurahan: p.kelurahan,
      puskesmas: p.puskesmas,
      kunjunganTerakhir: p.kunjunganTerakhir,
      tglKunjunganTerakhir: p.tglKunjunganTerakhir,
      status: p.kunjunganTerakhir >= CFG.TOTAL_SESI ? 'LULUS' : 'AKTIF',
      riwayat: riwayat,
      rataPost: rataPost(riwayat)
    };
  }

  function offlineSave(payload) {
    const db = offlineRead();
    const nik = bersihNik(payload.nik);
    const kunci = 'K' + payload.kunjunganKe;

    db.log[nik] = db.log[nik] || {};
    if (db.log[nik][kunci] && !payload.allowUpdate) {
      return { ok: false, error: 'DUPLIKAT' };
    }

    const status = payload.skorPost >= CFG.KKM ? 'LULUS' : 'BELUM';
    db.log[nik][kunci] = {
      kunjunganKe: payload.kunjunganKe,
      tanggal: payload.tanggal,
      skorPre: payload.skorPre,
      skorPost: payload.skorPost,
      statusKkm: status
    };

    db.pasien[nik] = {
      nama: payload.nama,
      noHp: payload.noHp,
      alamat: payload.alamat,
      kelurahan: payload.kelurahan,
      puskesmas: payload.puskesmas,
      kunjunganTerakhir: Math.max(
        payload.kunjunganKe,
        (db.pasien[nik] || {}).kunjunganTerakhir || 0
      ),
      tglKunjunganTerakhir: payload.tanggal
    };

    offlineWrite(db);
    const riwayat = Object.values(db.log[nik]).sort((a, b) => a.kunjunganKe - b.kunjunganKe);
    return { ok: true, statusKkm: status, rataPost: rataPost(riwayat) };
  }

  /* ── BACKEND ───────────────────────────────────────────────
     Apps Script dipanggil lewat GET berparameter, bukan POST.
     Alasan: POST ke Web App kena redirect 302 yang bikin CORS gagal
     di browser. Pola ini sama seperti yang dipakai EduCatin.
     ─────────────────────────────────────────────────────────── */

  async function callBackend(params) {
    if (!CFG.SHEETS_ENDPOINT) {
      throw new Error('SHEETS_ENDPOINT belum diisi di config.js');
    }
    const url = CFG.SHEETS_ENDPOINT + '?' + new URLSearchParams(params).toString();
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('Backend membalas status ' + res.status);
    return res.json();
  }

  /**
   * Panggilan sangat murah ke endpoint, hasilnya dibuang.
   *
   * Gunanya membangunkan container Apps Script. Panggilan pertama setelah
   * container menganggur kena cold start dan itu bisa memakan detik-detik
   * pertama — bukan karena datanya banyak, tapi karena skripnya baru dimuat.
   * Dengan memanggil ini lebih dulu, permintaan sungguhan mendarat di
   * container yang sudah hangat.
   *
   * Sengaja tidak mengembalikan apa-apa dan menelan semua kegagalan:
   * pemanasan itu bonus, bukan syarat. Kalau gagal, alurnya tetap jalan.
   */
  function pemanasan() {
    if (CFG.OFFLINE_MODE || !CFG.SHEETS_ENDPOINT) return;
    try {
      fetch(CFG.SHEETS_ENDPOINT + '?action=ping', { method: 'GET' }).catch(() => {});
    } catch (e) { /* diabaikan */ }
  }

  /* ── API PUBLIK ────────────────────────────────────────────── */

  /** Cari riwayat pasien berdasarkan NIK. Bentuk hasilnya selalu sama. */
  async function lookup(nik) {
    const bersih = bersihNik(nik);
    if (CFG.OFFLINE_MODE) return offlineLookup(bersih);
    const r = await callBackend({
      action: 'lookup',
      nik: bersih,
      totalSesi: CFG.TOTAL_SESI
    });
    if (!r.ok) throw new Error(r.error || 'Lookup gagal');
    return r;
  }

  /**
   * Tentukan kondisi sesi dari hasil lookup.
   * Hasil: 'BARU' | 'LANJUT' | 'DUPLIKAT' | 'LULUS'
   */
  function resolve(hasilLookup, pernahPeriksa) {
    const total = CFG.TOTAL_SESI;
    const hariIni = todayJakarta();

    if (hasilLookup.baru) {
      return {
        kondisi: 'BARU',
        kunjunganKe: 1,
        // Jawab "Ya" tapi NIK tidak ketemu → riwayat kemungkinan di luar
        // sistem. Tawarkan koreksi manual supaya bidan bisa memverifikasi.
        perluKoreksiManual: pernahPeriksa === 'Ya',
        sumberData: pernahPeriksa === 'Ya' ? 'MANUAL' : 'SISTEM',
        riwayat: []
      };
    }

    const terakhir = Number(hasilLookup.kunjunganTerakhir) || 0;

    if (terakhir >= total || hasilLookup.status === 'LULUS') {
      return {
        kondisi: 'LULUS',
        kunjunganKe: total,
        riwayat: hasilLookup.riwayat || [],
        rataPost: hasilLookup.rataPost
      };
    }

    if (normalizeDate(hasilLookup.tglKunjunganTerakhir) === hariIni) {
      const logHariIni = (hasilLookup.riwayat || [])
        .find((r) => normalizeDate(r.tanggal) === hariIni);
      return {
        kondisi: 'DUPLIKAT',
        kunjunganKe: terakhir,
        logHariIni: logHariIni || null,
        riwayat: hasilLookup.riwayat || []
      };
    }

    // Aturan default: urut. Sesi 3 → berikutnya selalu sesi 4.
    return {
      kondisi: 'LANJUT',
      kunjunganKe: terakhir + 1,
      sumberData: 'SISTEM',
      riwayat: hasilLookup.riwayat || []
    };
  }

  /** Simpan hasil satu sesi. `allowUpdate` dipakai saat post-test diulang. */
  async function save(payload) {
    if (CFG.OFFLINE_MODE) return offlineSave(payload);

    const r = await callBackend({
      action: 'save',
      nik: bersihNik(payload.nik),
      nama: payload.nama || '',
      noHp: payload.noHp || '',
      alamat: payload.alamat || '',
      kelurahan: payload.kelurahan || '',
      puskesmas: payload.puskesmas || '',
      kunjunganKe: payload.kunjunganKe,
      skorPre: payload.skorPre,
      skorPost: payload.skorPost,
      kkm: CFG.KKM,
      totalSesi: CFG.TOTAL_SESI,
      allowUpdate: payload.allowUpdate ? '1' : '0'
    });
    if (!r.ok) throw new Error(r.error || 'Simpan gagal');
    return r;
  }

  /* ── HELPER ────────────────────────────────────────────────── */

  /** Samakan bentuk tanggal (ISO atau dd-mm-yyyy) ke YYYY-MM-DD. */
  function normalizeDate(v) {
    if (!v) return '';
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmy) return dmy[3] + '-' + dmy[2] + '-' + dmy[1];
    const d = new Date(s);
    if (!isNaN(d)) {
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    return s;
  }

  function rataPost(riwayat) {
    const nilai = (riwayat || [])
      .map((r) => Number(r.skorPost))
      .filter((n) => !isNaN(n));
    if (!nilai.length) return 0;
    return Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length);
  }

  function resetOffline() {
    localStorage.removeItem(LS_KEY);
  }

  return {
    bersihNik: bersihNik,
    maskNIK: maskNIK,
    isNIKValid: isNIKValid,
    isHPValid: isHPValid,
    todayJakarta: todayJakarta,
    normalizeDate: normalizeDate,
    rataPost: rataPost,
    lookup: lookup,
    resolve: resolve,
    save: save,
    pemanasan: pemanasan,
    resetOffline: resetOffline
  };
})();
