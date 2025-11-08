/**
 * Constantes globales de l'application PÊCHE GABON
 */

/**
 * Les 9 provinces du Gabon
 */
export const GABON_PROVINCES = [
  "Estuaire",
  "Haut-Ogooué",
  "Moyen-Ogooué",
  "Ngounié",
  "Nyanga",
  "Ogooué-Ivindo",
  "Ogooué-Lolo",
  "Ogooué-Maritime",
  "Woleu-Ntem",
] as const;

export type GabonProvince = typeof GABON_PROVINCES[number];

/**
 * Mapping des codes de province (si nécessaire pour l'API)
 */
export const PROVINCE_CODES: Record<GabonProvince, string> = {
  "Estuaire": "EST",
  "Haut-Ogooué": "HO",
  "Moyen-Ogooué": "MO",
  "Ngounié": "NGO",
  "Nyanga": "NYA",
  "Ogooué-Ivindo": "OI",
  "Ogooué-Lolo": "OL",
  "Ogooué-Maritime": "OM",
  "Woleu-Ntem": "WN",
};
