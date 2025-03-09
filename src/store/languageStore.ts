import { create } from 'zustand';
import { translations } from '../locales/translations';

type Language = 'zh' | 'en';

interface LanguageState {
  currentLanguage: Language;
  t: (key: keyof typeof translations.zh) => string;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'zh',
  t: (key) => translations[get().currentLanguage][key] || key,
  setLanguage: (language) => set({ currentLanguage: language }),
})); 