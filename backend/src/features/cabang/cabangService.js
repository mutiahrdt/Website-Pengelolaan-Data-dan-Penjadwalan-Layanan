const cabangModel = require("./cabangModel");
const { simpanFoto } = require("../../utils/uploadFoto");
const { generateIdCabang, generateIdRuangan } = require("../../utils/generateId");

// daftarCabang (pseudocode: daftarCabang)
async function daftarCabang() {
  return await cabangModel.daftarCabang();
}

// buatCabang (pseudocode: buatCabang)
async function buatCabang({ nama_cabang, alamat_cabang, foto, status_cabang }) {
  // Validasi wajib
  if (!nama_cabang || !alamat_cabang || !foto || typeof status_cabang === "undefined")
    throw new Error("Semua field wajib diisi.");

  const id_cabang = await generateIdCabang();
  const foto_cabang = simpanFoto(foto, "cabang");

  return await cabangModel.buatCabang({
    id_cabang,
    nama_cabang,
    alamat_cabang,
    foto_cabang,
    status_cabang: status_cabang === true || status_cabang === "true"
  });
}

// perbaruiCabang (pseudocode: perbaruiCabang)
async function perbaruiCabang({ id_cabang, nama_cabang, alamat_cabang, foto, status_cabang }) {
  // ... (validasi dan logika untuk mendapatkan foto tetap sama)
  if (!id_cabang || !nama_cabang || !alamat_cabang || typeof status_cabang === "undefined")
    throw new Error("Semua field wajib diisi.");

  let foto_cabang = null;
  // ... (logika simpanFoto atau ambil nama foto lama)
  const dataLama = await cabangModel.cariCabang(id_cabang);
  if (foto && foto.fieldname) {
    foto_cabang = simpanFoto(foto, "cabang");
  } else if (typeof foto === 'string' && foto) {
    foto_cabang = foto;
  } else {
    foto_cabang = dataLama?.foto_cabang;
  }
  if (!foto_cabang) throw new Error("Gambar cabang wajib ada.");
  
  const isStatusBoolean = status_cabang === true || status_cabang === 'true';

  // Update data cabang itu sendiri
  await cabangModel.perbaruiCabang({
    id_cabang,
    nama_cabang,
    alamat_cabang,
    foto_cabang,
    status_cabang: isStatusBoolean
  });

  // --- LOGIKA BARU: Cascading Deactivation ---
  // Jika cabang dinonaktifkan, nonaktifkan juga semua ruangan di bawahnya.
  if (!isStatusBoolean) { // Ini sama dengan `if (isStatusBoolean === false)`
    await cabangModel.nonaktifkanRuanganByCabang(id_cabang);
  }
  
  return { id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang: isStatusBoolean };
}

// buatRuangan (pseudocode: buatRuangan)
async function buatRuangan({ id_cabang, nama_ruangan, status_ruangan }) {
  if (!id_cabang || !nama_ruangan || typeof status_ruangan === "undefined")
    throw new Error("Semua field wajib diisi.");

  const id_ruangan = await generateIdRuangan(id_cabang);
  return await cabangModel.buatRuangan({
    id_ruangan,
    id_cabang,
    nama_ruangan,
    status_ruangan: status_ruangan === true || status_ruangan === "true"
  });
}

// perbaruiRuangan (pseudocode: perbaruiRuangan)
async function perbaruiRuangan({ id_ruangan, id_cabang, nama_ruangan, status_ruangan }) {
  if (!id_ruangan || !id_cabang || !nama_ruangan || typeof status_ruangan === "undefined")
    throw new Error("Semua field wajib diisi.");

  return await cabangModel.perbaruiRuangan({
    id_ruangan,
    id_cabang,
    nama_ruangan,
    status_ruangan: status_ruangan === true || status_ruangan === "true"
  });
}

// daftarRuangan (pseudocode: daftarRuangan)
async function daftarRuangan(id_cabang) {
  if (!id_cabang) throw new Error("ID cabang wajib diisi.");
  return await cabangModel.daftarRuangan(id_cabang);
}

async function daftarCabangAktif() {
  return await cabangModel.daftarCabangAktif();
}

module.exports = {
  daftarCabang,
  buatCabang,
  perbaruiCabang,
  buatRuangan,
  perbaruiRuangan,
  daftarRuangan,
  daftarCabangAktif,
};