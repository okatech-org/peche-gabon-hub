/**
 * Utilitaire de logging conditionnel
 * Les logs ne s'affichent qu'en mode développement
 */

const isDev = import.meta.env.MODE === 'development';

export const logger = {
  info: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Les erreurs sont toujours loggées
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  }
};
