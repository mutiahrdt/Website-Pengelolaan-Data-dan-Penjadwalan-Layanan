// file: backend/src/features/penjadwalan/algorithms/cspSolver.js

const hardConstraints = require('../constraints/hardconstraints');
const { Logger } = require('../utils/logger');
const logger = Logger('CSPSolver');

/**
 * Helper function untuk memformat nilai domain untuk logging
 * @param {string} variable - Nama variabel (sesi, terapis, ruangan)
 * @param {Array} domainValues - Array nilai domain
 * @returns {string} - String yang diformat untuk logging
 */
function formatDomainForLogging(variable, domainValues) {
    if (!Array.isArray(domainValues)) {
        return `${variable}: [INVALID_DOMAIN]`;
    }

    let formattedValues;
    switch (variable) {
        case 'sesi':
            formattedValues = domainValues.map(value => 
                typeof value === 'string' ? value : value.id_sesi || 'UNKNOWN_SESI'
            ).join(', ');
            break;
        case 'terapis':
            formattedValues = domainValues.map(value => 
                `${value.nama_terapis || 'UNKNOWN'}(${value.id_terapis || 'NO_ID'})`
            ).join(', ');
            break;
        case 'ruangan':
            formattedValues = domainValues.map(value => 
                `${value.nama_ruangan || 'UNKNOWN'}(${value.id_ruangan || 'NO_ID'})`
            ).join(', ');
            break;
        default:
            formattedValues = domainValues.map(value => 
                typeof value === 'object' ? JSON.stringify(value) : value
            ).join(', ');
    }

    return `${variable}: [${formattedValues}] (${domainValues.length} opsi)`;
}

/**
 * Helper function untuk memformat assignment saat ini untuk logging
 * @param {object} assignment - Assignment saat ini
 * @returns {string} - String yang diformat untuk logging
 */
function formatCurrentAssignment(assignment) {
    const parts = [];
    
    if (assignment.sesi) {
        parts.push(`sesi=${assignment.sesi}`);
    }
    if (assignment.terapis) {
        parts.push(`terapis=${assignment.terapis.nama_terapis}(${assignment.terapis.id_terapis})`);
    }
    if (assignment.ruangan) {
        parts.push(`ruangan=${assignment.ruangan.nama_ruangan}(${assignment.ruangan.id_ruangan})`);
    }
    
    return parts.length > 0 ? `{${parts.join(', ')}}` : '{kosong}';
}

/**
 * Helper function untuk menghitung depth level dari tree
 * @param {Array<string>} totalVars - Total variabel
 * @param {Array<string>} unassignedVars - Variabel yang belum di-assign
 * @returns {number} - Level depth saat ini
 */
function getCurrentDepth(totalVars, unassignedVars) {
    return totalVars.length - unassignedVars.length;
}

/**
 * Fungsi rekursif utama untuk algoritma backtracking.
 * Mencari semua kemungkinan solusi yang memenuhi hard constraints.
 * @param {object} assignment - Tugas yang sudah dibuat (misal: { sesi: 'S01' }).
 * @param {Array<string>} unassignedVars - Daftar variabel yang belum ditugaskan.
 * @param {object} domain - Daftar nilai yang mungkin untuk setiap variabel.
 * @param {object} context - Konteks data penjadwalan.
 * @param {Array<object>} solutions - Array untuk menampung semua solusi yang ditemukan.
 * @param {Array<string>} totalVars - Total variabel untuk menghitung depth.
 */
function backtrackingSearch(assignment, unassignedVars, domain, context, solutions, totalVars = ['sesi', 'terapis', 'ruangan']) {
    const currentDepth = getCurrentDepth(totalVars, unassignedVars);
    const indent = '  '.repeat(currentDepth); // Indentasi berdasarkan depth
    
    // Base case: Jika semua variabel sudah ditugaskan, kita menemukan solusi.
    if (unassignedVars.length === 0) {
        logger.info(`${indent} SOLUSI DITEMUKAN #${solutions.length + 1}: ${formatCurrentAssignment(assignment)}`);
        solutions.push({ ...assignment }); // Salin assignment sebagai solusi baru
        return; // Lanjutkan pencarian untuk menemukan solusi lain
    }

    // Pilih variabel berikutnya dari daftar
    const variable = unassignedVars[0];
    const remainingVars = unassignedVars.slice(1);
    
    // Log informasi node saat ini
    logger.info(`${indent} NODE LEVEL ${currentDepth + 1}: Mengeksplorasi variabel '${variable}'`);
    logger.info(`${indent} Assignment saat ini: ${formatCurrentAssignment(assignment)}`);
    
    // Dapatkan domain untuk variabel saat ini. Bisa berupa array statis atau fungsi dinamis.
    const domainForVar = (typeof domain[variable] === 'function') ? domain[variable](assignment) : domain[variable];
    
    // Log domain yang tersedia untuk variabel ini
    logger.info(`${indent} Domain tersedia untuk '${variable}': ${formatDomainForLogging(variable, domainForVar)}`);
    
    if (!domainForVar || domainForVar.length === 0) {
        logger.warn(`${indent}  Domain kosong untuk '${variable}' - Dead end!`);
        return;
    }

    // Iterasi melalui setiap nilai yang mungkin untuk variabel ini
    let branchNumber = 1;
    for (const value of domainForVar) { //Mengeksplorasi setiap cabang dari node
        const valueIdentifier = value.nama_terapis || value.nama_ruangan || value.id_sesi || value;
        logger.info(`${indent} Cabang ${branchNumber}/${domainForVar.length}: Mencoba ${variable} = ${valueIdentifier}`);
        
        // Periksa apakah nilai ini konsisten dengan tugas yang sudah ada
        if (hardConstraints.isConsistent(variable, value, assignment, context)) {
            // 1. Lakukan Assignment (Langkah Maju)
            assignment[variable] = value; //Node Child terbentuk
            logger.info(`${indent} KONSISTEN! Assignment: ${variable} = ${valueIdentifier}`);
            logger.info(`${indent}  Melanjutkan ke level ${currentDepth + 2}...`);
            
            // 2. Panggil rekursi untuk variabel berikutnya
            backtrackingSearch(assignment, remainingVars, domain, context, solutions, totalVars); //Ini merupakan DFS pada Tree, Rekursi = pindah ke node child
            
            // 3. Batalkan assignment (Backtrack) untuk mencoba nilai lain
            delete assignment[variable]; //Backtrack = naik kembali ke parent node
            logger.info(`${indent} BACKTRACK: Melepas ${variable} = ${valueIdentifier}, kembali ke level ${currentDepth + 1}`);
        } else {
            logger.info(`${indent} TIDAK KONSISTEN: ${variable} = ${valueIdentifier} - Skip cabang ini`);
        }
        
        branchNumber++;
    }
    
    logger.info(`${indent} Selesai mengeksplorasi semua cabang untuk '${variable}' di level ${currentDepth + 1}`);
}

/**
 * Fungsi utama untuk memulai proses penyelesaian CSP.
 * @param {Array<string>} variables - Variabel masalah (misal: ['sesi', 'terapis', 'ruangan']).
 * @param {object} domain - Daftar nilai untuk setiap variabel.
 * @param {object} context - Konteks data penjadwalan.
 * @returns {Array<object>} - Array berisi semua solusi valid yang ditemukan.
 */
const solve = (variables, domain, context) => {
    logger.info('========== MEMULAI PENCARIAN SOLUSI CSP DENGAN BACKTRACKING ==========');
    logger.info(`Total variabel: ${variables.length} (${variables.join(', ')})`);
    
    // Log initial domain sizes untuk gambaran umum
    logger.info(' UKURAN DOMAIN AWAL:');
    for (const variable of variables) {
        const domainForVar = (typeof domain[variable] === 'function') ? 
            domain[variable]({}) : domain[variable]; // Empty assignment untuk initial check
        if (domainForVar && Array.isArray(domainForVar)) {
            logger.info(`   - ${variable}: ${domainForVar.length} opsi`);
        } else {
            logger.info(`   - ${variable}: Domain dinamis (function)`);
        }
    }
    
    const startTime = Date.now();
    const solutions = [];
    const initialAssignment = {};
    
    logger.info(' ========== MEMULAI TREE EXPLORATION ==========');
    backtrackingSearch(initialAssignment, variables, domain, context, solutions, variables);
    logger.info(' ========== TREE EXPLORATION SELESAI ==========');

    const duration = Date.now() - startTime;
    logger.info(` Pencarian selesai dalam ${duration} ms`);
    logger.info(` HASIL AKHIR: Ditemukan ${solutions.length} solusi valid`);
    
    // Log summary solusi yang ditemukan
    if (solutions.length > 0) {
        logger.info(' RINGKASAN SOLUSI:');
        solutions.forEach((solution, index) => {
            logger.info(`   Solusi ${index + 1}: ${formatCurrentAssignment(solution)}`);
        });
    } else {
        logger.warn('  Tidak ada solusi yang ditemukan!');
    }
    
    logger.info(' ========== PENCARIAN CSP SELESAI ==========');
    return solutions;
};

module.exports = { solve };