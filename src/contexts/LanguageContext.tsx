'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, createTranslator } from '@/lib/i18n';

interface LanguageContextValue {
    lang: Language;
    setLang: (l: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
    lang: 'th',
    setLang: () => { },
    t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>('th');

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('leadspark_lang') as Language | null;
            if (saved === 'th' || saved === 'en') setLangState(saved);
        } catch { /* ignore SSR/private mode */ }
    }, []);

    const setLang = useCallback((l: Language) => {
        setLangState(l);
        try { localStorage.setItem('leadspark_lang', l); } catch { /* ignore */ }
    }, []);

    const t = useCallback(createTranslator(lang), [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
