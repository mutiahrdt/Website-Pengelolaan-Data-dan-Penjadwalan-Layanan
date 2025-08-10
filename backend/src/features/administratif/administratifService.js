const bcrypt = require("bcryptjs");
const administratifModel = require("./administratifModel");
const generateInitial = require("../../utils/generateInitial");
const { simpanFoto } = require("../../utils/uploadFoto");
const { generateIdAdministratif } = require("../../utils/generateId");

const administratifService = {
  async daftarAdministratif() {
    return await administratifModel.daftarAdministratifWithAlokasi();
  },

  async buatAdministratif({
    username,
    password,
    nama_admin,
    id_cabang,
    status_admin,
    wkt_berlaku,
    foto_file,
  }) {
    const usernameStr = typeof username === "string" ? username.trim() : "";
    if (!usernameStr) throw new Error("Username wajib diisi.");
    if (/\s/.test(usernameStr)) throw new Error("Username tidak boleh ada spasi.");
    if (usernameStr.length > 15) throw new Error("Username maksimal 15 karakter.");

    if (!password || !nama_admin || !id_cabang || !foto_file)
      throw new Error("Semua field wajib diisi.");
    if (await administratifModel.cekUsernameExists(usernameStr))
      throw new Error("Username sudah digunakan.");
    if (!(await administratifModel.cekCabangAktif(id_cabang)))
      throw new Error("Cabang tidak ditemukan atau tidak aktif.");
    if (password.length < 6)
      throw new Error("Password minimal 6 karakter.");

    const id_administratif = await generateIdAdministratif("Admin");
    const hashed = await bcrypt.hash(password, 10);
    const inisial_admin = await generateInitial(nama_admin, "Administratif");
    const foto_admin = simpanFoto(foto_file, "administratif");

    await administratifModel.insertAdministratif({
      id_administratif,
      username: usernameStr,
      hashedPassword: hashed,
      nama_admin,
      inisial_admin,
      foto_admin,
      nama_role: "Admin",
      status_admin,
    });

    await administratifModel.insertAlokasiAdmin({
      id_administratif,
      id_cabang,
      waktu_berlaku: wkt_berlaku,
      status_alokasi: true,
    });

    return { success: true };
  },

  async perbaruiAdministratif(
  id_administratif,
  {
    username,
    password,
    nama_admin,
    id_cabang,
    status_admin,
    wkt_berlaku,
    foto_file,
  }
) {
  const usernameStr = typeof username === "string" ? username.trim() : "";
  if (!usernameStr) throw new Error("Username wajib diisi.");
  if (/\s/.test(usernameStr)) throw new Error("Username tidak boleh ada spasi.");
  if (usernameStr.length > 15) throw new Error("Username maksimal 15 karakter.");

  if (!nama_admin || !id_cabang)
    throw new Error("Semua field wajib diisi.");

  let hashedPassword;
  if (password) {
    if (password.length < 6)
      throw new Error("Password minimal 6 karakter.");
    hashedPassword = await bcrypt.hash(password, 10);
  } else {
    const old = await administratifModel.getAdministratifById(id_administratif);
    hashedPassword = old.password;
  }

  if (
      await administratifModel.cekUsernameDuplikat(usernameStr, id_administratif)
    )
      throw new Error("Username sudah digunakan.");
    if (!(await administratifModel.cekCabangAktif(id_cabang)))
      throw new Error("Cabang tidak ditemukan atau tidak aktif.");

  const inisial_admin = await generateInitial(nama_admin, "Administratif");
  const foto_admin = foto_file
    ? simpanFoto(foto_file, "administratif")
    : (await administratifModel.getAdministratifById(id_administratif)).foto_admin;

  await administratifModel.updateAdministratif({
    id_administratif,
    username: usernameStr,
    hashedPassword,
    nama_admin,
    inisial_admin,
    foto_admin,
    nama_role: "Admin",
    status_admin,
  });

  // --- CEK CABANG LAMA, Insert Alokasi hanya jika CABANG BERUBAH ---
  const res = await administratifModel.getAllAlokasiAktif(id_administratif);
  const lastAlokasi = res?.[0]; // terbaru urut DESC
  const cabangLama = lastAlokasi ? lastAlokasi.id_cabang : null;

  if (id_cabang !== cabangLama) {
    // Nonaktifkan alokasi lama di cabang lama
    if (cabangLama) {
      await administratifModel.nonaktifkanAlokasiLama(id_administratif, cabangLama);
    }
    // Insert ke alokasi_admin baru
    await administratifModel.insertAlokasiAdmin({
      id_administratif,
      id_cabang,
      waktu_berlaku: wkt_berlaku,
      status_alokasi: true,
    });
  }
  // Jika cabang tidak berubah, tidak insert ke alokasi_admin!

  return { success: true };
},
};

module.exports = administratifService;