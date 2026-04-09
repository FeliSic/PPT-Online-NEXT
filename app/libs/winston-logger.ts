// logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug', // Cambia según el ambiente
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Muestra en consola
    // Podés agregar más transportes, como guardar en archivo
  ],
});

export default logger;


/**
 * Logger configurado con Winston.
 * 
 * Winston es una librería para manejo de logs en Node.js que permite:
 * - Definir niveles de logs (debug, info, warn, error).
 * - Formatear los mensajes con timestamps y en JSON.
 * - Enviar logs a diferentes destinos (consola, archivos, servicios externos).
 * 
 * En esta configuración, el nivel de log cambia según la variable de entorno NODE_ENV:
 * - En producción solo muestra warnings y errores (warn).
 * - En desarrollo muestra logs detallados (debug).
 */
