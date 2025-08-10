const model = require('./transaksiHarianModel');
const { simpanFoto } = require('../../utils/uploadFoto');

const BIAYA_DENDA_PEMBATALAN = 50000;

const daftar = async () => {
  // Panggil fungsi model yang sudah diubah
  return await model.daftarSemuaJadwalPasien();
};

const detail = async (id_pesanan) => {
  if (!id_pesanan) throw new Error("ID Pesanan wajib diisi.");
  const data = await model.getDetailByIdPesanan(id_pesanan);
  if (!data) throw new Error("Detail transaksi tidak ditemukan.");
  return data;
};

const tambah = async (data) => {
  const { id_pesanan, id_form, tipe_data, informasi, foto, nama_file_lama } = data;
  if (!id_pesanan || !id_form) {
    throw new Error("ID Pesanan dan ID Form wajib diisi.");
  }
  let nilai_final;
  if (foto) {
    nilai_final = simpanFoto(foto, 'transaksi-harian');
  } else if (tipe_data === 'upload' && nama_file_lama) {
    nilai_final = nama_file_lama;
  } else {
    nilai_final = informasi;
  }
  if (tipe_data === 'upload' && !nilai_final) {
      throw new Error("File untuk form upload wajib ada.");
  }
  const payload = {
    id_pesanan, id_form,
    nilai_char: tipe_data !== 'number' ? nilai_final : null,
    nilai_numerik: tipe_data === 'number' ? Number(nilai_final) : null,
  };
  if (tipe_data === 'number' && isNaN(payload.nilai_numerik)) {
      throw new Error(`Informasi untuk tipe data number harus berupa angka.`);
  }
  return await model.tambahAtauPerbarui(payload);
};

const getOptions = async() => {
    const [jadwal, form] = await Promise.all([
        model.getJadwalOptions(),
        model.getFormOptions()
    ]);
    return { jadwal, form };
}

/**
 * Fungsi inti yang membuat pesanan baru sekaligus memeriksa dan menerapkan denda pembatalan.
 * Fungsi ini dipanggil dari penjadwalanController.
 * 
 * @param {object} dataPesanan - Data input dari form pembuatan jadwal.
 * @param {object} solusiJadwal - Solusi jadwal yang ditemukan oleh CSP.
 * @returns {object} - Hasil dari pembuatan pesanan.
 */
const buatPesananDenganDenda = async (dataPesanan, solusiJadwal) => {
  const { id_pasien } = dataPesanan;
  if (!id_pasien) {
    throw new Error("ID Pasien wajib ada untuk membuat pesanan.");
  }
  
  logger.info(`Memulai pembuatan pesanan baru untuk pasien: ${id_pasien}. Mengecek riwayat untuk denda...`);

  // 1. Cek jadwal terakhir pasien dari database
  const jadwalTerakhir = await transaksiHarianModel.getJadwalTerakhirPasien(id_pasien);
  
  let denda = 0;
  if (jadwalTerakhir) {
    logger.info(`Jadwal terakhir ditemukan: ID Pesanan ${jadwalTerakhir.id_pesanan}, Status: '${jadwalTerakhir.status_jadwal}'`);
    // Gunakan toLowerCase() untuk perbandingan yang andal
    if (jadwalTerakhir.status_jadwal.toLowerCase() === 'dibatalkan pasien') {
      denda = BIAYA_DENDA_PEMBATALAN;
      logger.info(`KONDISI DENDA TERPENUHI. Denda sebesar ${denda} akan diterapkan.`);
    } else {
      logger.info('Kondisi denda tidak terpenuhi (status terakhir bukan "Dibatalkan Pasien").');
    }
  } else {
    logger.info(`Tidak ada riwayat jadwal ditemukan untuk pasien ${id_pasien}. Tidak ada denda.`);
  }

  // 2. Buat pesanan dan jadwalnya terlebih dahulu, ini adalah proses utama.
  logger.info('Membuat entri pesanan dan jadwal di database...');
  const hasilPesanan = await penjadwalanModel.createPesananAndJadwal(dataPesanan, solusiJadwal);
  const id_pesanan_baru = hasilPesanan.id_pesanan;
  logger.info(`Pesanan baru berhasil dibuat dengan ID: ${id_pesanan_baru}.`);

  // 3. Jika ada denda yang harus diterapkan, simpan sebagai entri 'Biaya Tambahan'
  if (denda > 0) {
    logger.info(`Menyimpan denda Rp ${denda} ke tabel TRANSAKSI_HARIAN untuk pesanan ${id_pesanan_baru}...`);
    
    const payloadDenda = {
      id_pesanan: id_pesanan_baru,
      id_form: ID_FORM_BIAYA_TAMBAHAN,
      nilai_numerik: denda,
      nilai_char: `Denda pembatalan pesanan sebelumnya (ID: ${jadwalTerakhir.id_pesanan})`,
    };
    
    // Gunakan try-catch untuk mengisolasi proses penyimpanan denda.
    // Jika ini gagal, pesanan utama tidak akan ikut gagal.
    try {
      const hasilSimpanDenda = await transaksiHarianModel.tambahAtauPerbarui(payloadDenda);
      logger.info('Berhasil menyimpan data denda ke database.', hasilSimpanDenda);
    } catch (dendaError) {
      logger.error('KRITIS: GAGAL MENYIMPAN DENDA! Pesanan utama tetap dibuat, tetapi denda gagal ditambahkan.', dendaError);
    }
  }

  return hasilPesanan; // Kembalikan data pesanan yang berhasil dibuat
};


// Ekspor semua fungsi yang akan digunakan oleh controller
module.exports = {
  daftar,
  detail,
  tambah,
  getOptions,
  buatPesananDenganDenda,
};