// src/features/penjadwalan/utils/logger.js

/**
 * Modul untuk membuat instance logger terstruktur dengan konteks.
 * Ini adalah pendekatan modular untuk fungsionalitas yang sebelumnya mungkin ada di dalam class.
 */
const Logger = (context) => {
  const prefix = `[${context}]`;

  const log = (level, message, details) => {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      context,
      message,
      ...(details && { details }),
    };

    switch (level) {
      case 'ERROR':
        console.error(`${timestamp} ${level} ${prefix}: ${message}`, details || '');
        break;
      case 'WARN':
        console.warn(`${timestamp} ${level} ${prefix}: ${message}`, details || '');
        break;
      case 'DEBUG':
        // Hanya log debug jika dalam mode development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${timestamp} ${level} ${prefix}: ${message}`, details || '');
        }
        break;
      default:
        console.log(`${timestamp} INFO ${prefix}: ${message}`, details || '');
    }
  };

  return {
    info: (message, details) => log('INFO', message, details),
    error: (message, details) => log('ERROR', message, details),
    warn: (message, details) => log('WARN', message, details),
    debug: (message, details) => log('DEBUG', message, details),
  };
};

module.exports = { Logger };