// file: backend/hargaPaket/hargaPaketService.js (LENGKAP & DIPERBAIKI)

const modelHargaPaket = require("./hargaPaketModel");

async function dapatkanDaftar(id_cabang) { // Menerima id_cabang opsional
  return await modelHargaPaket.dapatkanDaftarHargaPaket(id_cabang);
}

async function tambah(data) {
  const { id_cabang, id_paket, harga_paket, waktu_berlaku, status_harga_paket } = data;
  if (!id_cabang || !id_paket || !harga_paket || !waktu_berlaku) {
    throw new Error("Data untuk menambah harga tidak lengkap.");
  }
  return await modelHargaPaket.tambahHargaPaket({ id_cabang, id_paket, harga_paket, waktu_berlaku, status_harga_paket });
}

async function dapatkanHistori(id_cabang, id_paket) {
  return await modelHargaPaket.dapatkanHistoriHargaPaket(id_cabang, id_paket);
}

module.exports = {
  dapatkanDaftar,
  tambah,
  dapatkanHistori,
};