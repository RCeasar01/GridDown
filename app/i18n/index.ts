import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';
import ar from './ar.json';
import zh from './zh.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  de: { translation: de },
  ar: { translation: ar },
  zh: { translation: zh },
};

function detectLanguage(): string {
  try {
    const locales = Localization.getLocales();
    if (locales.length > 0) {
      const code = locales[0].languageCode ?? 'en';
      if (Object.keys(resources).includes(code)) return code;
    }
  } catch {
    // ignore
  }
  return 'en';
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

export default i18n;

export async function setAppLanguage(languageCode: string): Promise<void> {
  const supported = Object.keys(resources);
  const lang = supported.includes(languageCode) ? languageCode : 'en';
  await i18n.changeLanguage(lang);
}

export type SupportedUILanguage = keyof typeof resources;
