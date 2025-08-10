// src/middlewares/auth.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Tidak terautentikasi." });

  const token = authHeader.split(" ")[1] || authHeader;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token tidak valid." });

    req.user = {
      id_admin: decoded.id,
      id_cabang: decoded.id_cabang,
      role: decoded.role
    };
    next();
  });
};

const onlyAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Hanya Admin yang bisa mengakses." });
  }
  next();
};

const onlySuperadmin = (req, res, next) => {
  if (req.user.role !== "Superadmin") {
    return res.status(403).json({ message: "Hanya Superadmin yang bisa mengakses." });
  }
  next();
};

module.exports = { verifyToken, onlyAdmin, onlySuperadmin };