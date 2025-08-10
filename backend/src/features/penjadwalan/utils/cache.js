// src/features/penjadwalan/utils/cache.js

const cacheStore = new Map();
const stats = { hits: 0, misses: 0, evictions: 0 };
let defaultTTL = 5 * 60 * 1000; // Default 5 menit

// Fungsi cleanup tetap sama
const cleanup = () => {
  const now = Date.now();
  let evicted = 0;
  for (const [key, item] of cacheStore.entries()) {
    if (now >= item.expiry) {
      cacheStore.delete(key);
      evicted++;
    }
  }
  stats.evictions += evicted;
};
setInterval(cleanup, 60000);

// --- PERUBAHAN UTAMA DI SINI ---

/**
 * Fungsi GET yang sederhana: Hanya mengambil data dari cache jika ada dan valid.
 * @param {string} key - Kunci cache.
 * @returns {any|undefined} - Data dari cache atau undefined jika tidak ditemukan.
 */
const get = (key) => {
  const cached = cacheStore.get(key);
  if (cached && Date.now() < cached.expiry) {
    stats.hits++;
    return cached.data;
  }
  // Tidak ada fetchFunction, cukup kembalikan undefined jika cache miss
  stats.misses++;
  return undefined; 
};

/**
 * Fungsi SET yang sederhana: Menyimpan data ke dalam cache.
 * @param {string} key - Kunci cache.
 * @param {any} value - Nilai yang akan disimpan.
 * @param {number|null} ttl - Waktu hidup cache dalam milidetik.
 */
const set = (key, value, ttl = null) => {
  const itemTTL = ttl || defaultTTL;
  cacheStore.set(key, {
    data: value,
    expiry: Date.now() + itemTTL,
  });
};

// Fungsi lainnya tetap sama
const invalidate = (key) => {
  return cacheStore.delete(key);
};

const clear = () => {
  stats.evictions += cacheStore.size;
  cacheStore.clear();
};

const getStats = () => {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    size: cacheStore.size,
    hitRate: total > 0 ? `${((stats.hits / total) * 100).toFixed(2)}%` : '0%',
  };
};

// Pastikan 'set' diekspor juga
module.exports = {
  get,
  set, // <-- TAMBAHKAN INI
  invalidate,
  clear,
  getStats,
};