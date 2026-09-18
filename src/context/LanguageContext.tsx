import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppLanguage,
  TranslationDictionary,
  languageService,
  translations,
} from '../services/languageService';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
  isCebuano: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => languageService.getLanguage());

  useEffect(() => {
    const unsubscribe = languageService.onLanguageChange((newLang) => {
      setLanguageState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    languageService.setLanguage(lang);
    setLanguageState(lang);
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isCebuano: language === 'ceb',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackLang = languageService.getLanguage();
    return {
      language: fallbackLang,
      setLanguage: (l) => languageService.setLanguage(l),
      t: (k, fb) => languageService.t(k, fb),
      isCebuano: fallbackLang === 'ceb',
    };
  }
  return context;
};
