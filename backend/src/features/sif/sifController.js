// file: backend/sif/sifController.js

const layananSif = require("./sifService");

// Daftar semua SIF
async function daftarSif(req, res) {
  try {
    const daftar = await layananSif.daftarSif();
    res.json({ data: daftar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Controller untuk membuat Sif baru
async function buatSif(req, res) {
  try {
    const { nama_sif, jam_mulai, jam_selesai, status_sif } = req.body;
    
    // Panggil fungsi layanan yang sudah diperbaiki
    const idSifBaru = await layananSif.buatSif({ 
      nama_sif, 
      jam_mulai, 
      jam_selesai, 
      status_sif 
    });
    
    res.status(201).json({ message: "Sif berhasil ditambahkan.", id_sif: idSifBaru });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Controller untuk memperbarui Sif
async function perbaruiSif(req, res) {
  try {
    const { id } = req.params;
    const { nama_sif, jam_mulai, jam_selesai, status_sif } = req.body;

    await layananSif.perbaruiSif({ 
      id_sif: id,
      nama_sif, 
      jam_mulai, 
      jam_selesai, 
      status_sif 
    });

    res.json({ message: `Sif dengan ID ${id} berhasil diperbarui.` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  daftarSif,
  buatSif,
  perbaruiSif,
};