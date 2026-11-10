import { commonTranslations } from './common';
import { storefrontTranslations } from './storefront';
import { authAndFarmerTranslations } from './authAndFarmer';
import { policiesAndAdminTranslations } from './policiesAndAdmin';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  getLocaleCode,
  translateCategory,
  translateUnit,
  translateStatus,
} from './helpers';

export const translations = {
  en: {
    ...commonTranslations.en,
    ...storefrontTranslations.en,
    ...authAndFarmerTranslations.en,
    ...policiesAndAdminTranslations.en,
  },
  ta: {
    ...commonTranslations.ta,
    ...storefrontTranslations.ta,
    ...authAndFarmerTranslations.ta,
    ...policiesAndAdminTranslations.ta,
  },
};

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[parts[i]];
  }
  return current;
}

export function translate(lang, key, vars) {
  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  let value = getNestedValue(translations[safeLang], key);

  if (value === undefined && safeLang !== 'en') {
    value = getNestedValue(translations.en, key);
  }

  if (value === undefined) return key;

  if (typeof value === 'string' && vars && typeof vars === 'object') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''
    );
  }

  return value;
}

export {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  getLocaleCode,
  translateCategory,
  translateUnit,
  translateStatus,
};
