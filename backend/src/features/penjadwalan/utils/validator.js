// src/features/penjadwalan/utils/validator.js

/**
 * Fungsi validasi input generik berdasarkan aturan yang diberikan.
 * @param {object} data - Data yang akan divalidasi (misalnya, req.body).
 * @param {object} rules - Objek yang berisi aturan validasi untuk setiap field.
 * @returns {{isValid: boolean, errors: object}} - Objek yang berisi status validasi dan daftar error.
 */
function validateInput(data, rules) {
  const errors = {};

  for (const field in rules) {
    const rule = rules[field];
    const value = data[field];

    // 1. Cek 'required'
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `Field '${field}' tidak boleh kosong.`;
      continue; // Lanjut ke field berikutnya jika kosong
    }

    // Hanya validasi lebih lanjut jika field tidak kosong
    if (value !== undefined && value !== null && value !== '') {
      
      // 2. Cek 'type'
      if (rule.type === 'string' && typeof value !== 'string') {
        errors[field] = `Field '${field}' harus berupa string.`;
      } else if (rule.type === 'number' && typeof value !== 'number') {
        errors[field] = `Field '${field}' harus berupa angka.`;
      } else if (rule.type === 'date') {
        if (typeof value !== 'string' || isNaN(new Date(value).getTime())) {
          errors[field] = `Field '${field}' harus berupa tanggal yang valid (format YYYY-MM-DD).`;
        }
      } else if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors[field] = `Field '${field}' harus berupa objek.`;
      }

      // 3. Cek aturan spesifik jika tipe data sudah benar
      if (!errors[field]) {
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `Field '${field}' tidak boleh lebih dari ${rule.maxLength} karakter.`;
        }
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `Field '${field}' minimal harus bernilai ${rule.min}.`;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = `Field '${field}' tidak sesuai format yang diharapkan.`;
        }
        if (rule.enum && !rule.enum.includes(value)) {
          errors[field] = `Field '${field}' harus salah satu dari: ${rule.enum.join(', ')}.`;
        }

        // Validasi rekursif untuk objek
        if (rule.type === 'object' && rule.properties) {
          const nestedErrors = validateInput(value, rule.properties);
          if (!nestedErrors.isValid) {
            // Gabungkan error dari objek bersarang
            errors[field] = nestedErrors.errors;
          }
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}

/**
 * Fungsi sanitasi input untuk membersihkan data.
 * Saat ini hanya melakukan trim pada string.
 * @param {object} data - Data yang akan disanitasi.
 * @returns {object} - Objek data yang sudah bersih.
 */
function sanitizeInput(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitizedData = {};

  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string') {
      sanitizedData[key] = value.trim();
    } else if (typeof value === 'object' && value !== null) {
      // Sanitasi rekursif untuk objek bersarang (seperti 'preferensi')
      sanitizedData[key] = sanitizeInput(value);
    } else {
      sanitizedData[key] = value;
    }
  }

  return sanitizedData;
}

// Ekspor fungsi-fungsi agar bisa digunakan oleh file lain
module.exports = {
  validateInput,
  sanitizeInput
};