import { useCallback } from 'react';
import translations from '../translations';
import { useLanguage } from '../context/LanguageContext';

export default function useTranslation() {
  const ctx = useLanguage();
  const language = ctx?.language || 'ar';
  return useCallback(
    (key) => translations[language]?.[key] || translations.ar[key] || key,
    [language]
  );
}
