const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const signInModel = require("./signInModel");

const signInService = {
  async autentikasiPengguna(username, password) {
    const user = await signInModel.cariUsername(username);

    if (!user || user.status_admin === false) {
      const error = new Error("User tidak ditemukan atau tidak aktif");
      error.status = 404;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const error = new Error("Password salah");
      error.status = 401;
      throw error;
    }

    const namaRole = user.nama_role;
    const idCabang = namaRole === "Superadmin"
      ? null
      : user.id_cabang;

    const token = jwt.sign(
      { id: user.id_administratif, role: namaRole, id_cabang: idCabang },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _pwd, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, role: namaRole },
      token,
    };
  }
};

module.exports = signInService;
