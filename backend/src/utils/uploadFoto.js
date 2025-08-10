const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Konfigurasi Multer untuk upload ke memory
const storage = multer.memoryStorage();

// PERBAIKAN: Menambahkan `limits` dan `fileFilter` pada konfigurasi Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Batas ukuran file 10MB
  fileFilter: (req, file, cb) => {
    // Filter untuk hanya mengizinkan file dengan tipe 'image'
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diizinkan!"), false);
    }
  },
});

// Fungsi simpan foto dengan path folder asli Anda
function simpanFoto(foto, entity) {
  if (!foto) throw new Error("File foto wajib diupload.");

  const ext = path.extname(foto.originalname) || ".jpg";
  const baseName = path.basename(foto.originalname, ext);
  let safeName = baseName.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_.-]/g, "");
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  let fileName = `${safeName}_${timestamp}${ext}`;
  
  if (fileName.length > 50) {
      fileName = fileName.substring(fileName.length - 50);
  }
  
  // Menggunakan path folder yang Anda inginkan: backend/src/assets/{entity}/
  const folderPath = path.join(__dirname, "../assets", entity.toLowerCase());

  if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
  }

  const fullPath = path.join(folderPath, fileName);
  fs.writeFileSync(fullPath, foto.buffer);
  
  return fileName;
}

// Export keduanya dalam objek
module.exports = {
  upload,
  simpanFoto,
};