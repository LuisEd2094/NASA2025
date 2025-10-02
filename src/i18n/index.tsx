"use client"

import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react"
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
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-lg border border-white/10">
      <label className="text-sm opacity-80" htmlFor="lang">{t("switcher.label")}</label>
      <select
        id="lang"
        className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="cat">Català</option>
        <option value="gal">Galego</option>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  )
}