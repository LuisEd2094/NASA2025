"use client"

import { createContext, useContext, useMemo, useState, ReactNode, useEffect, useRef } from "react"
import cat from "./cat.json"
import gal from "./gal.json"
import en from "./en.json"
import es from "./es.json"

type Locale = "cat" | "gal" | "en" | "es"

type Messages = Record<string, string>

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const LOCALES: Record<Locale, Messages> = { cat, gal, en, es }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en")

  // Use fallback to English if the key is not found in the current locale
  const t = useMemo(() => {
    const messages = LOCALES[locale]
    const fallback = LOCALES["en"]
    return (key: string) => {
      const v = messages[key]
      // If the key is found in the current locale, return the value
      if (v !== undefined && v !== "") return v
      // If the key is not found in the current locale, return the value from the fallback locale
      const fb = fallback[key]
      return fb !== undefined && fb !== "" ? fb : key
    }
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  // Initialize locale from localStorage or browser settings once
  useEffect(() => {
    const saved = (window.localStorage.getItem("locale") as Locale | null)
    if (saved && (saved === "cat" || saved === "gal" || saved === "en" || saved === "es")) {
      setLocale(saved)
      return
    }
    setLocale("en")
  }, [])

  // Persist locale and reflect in <html lang> whenever it changes
  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem("locale", locale)
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const languages = [
    { code: "cat" as Locale, name: "Català", flag: "fi-es-ct" },
    { code: "gal" as Locale, name: "Galego", flag: "fi-es-ga" },
    { code: "es" as Locale, name: "Español", flag: "fi-es" },
    { code: "en" as Locale, name: "English", flag: "fi-us" },
  ]
  
  const currentLanguage = languages.find(l => l.code === locale)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Selector de idiomas */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-black/60 text-white rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-black/80 transition-colors"
        >
          <span className={`fi ${currentLanguage?.flag}`}></span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg border border-white/10 shadow-lg min-w-full">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  locale === lang.code ? 'bg-white/20' : ''
                }`}
              >
                <span className={`fi ${lang.flag}`}></span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}