const model = require("./sesiModel");
const { generateIdSesi } = require("../../utils/generateId");

async function daftarSesi() {
  return await model.daftarSesi();
}

async function buatSesi({ id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi }) {
  if (!id_cabang || !nama_sesi || !jam_mulai || !jam_selesai) throw new Error("Field wajib diisi");
  const id_sesi = await generateIdSesi();
  await model.buatSesi({ id_sesi, id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi: !!status_sesi });
  return id_sesi;
}

async function perbaruiSesi({ id_sesi, nama_sesi, jam_mulai, jam_selesai, status_sesi }) {
  await model.perbaruiSesi({ id_sesi, nama_sesi, jam_mulai, jam_selesai, status_sesi: !!status_sesi });
}

module.exports = {
  daftarSesi,
  buatSesi,
  perbaruiSesi,
};