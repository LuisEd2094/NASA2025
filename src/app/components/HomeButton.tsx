// src/components/HomeButton.tsx
"use client"

import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "../../i18n"

export default function HomeButton() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()

  // Don't show on the main page
  if (pathname === "/") return null

  return (
    <button
      onClick={() => router.push("/")}
      className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50"
    >
      {t("layout.home")}
    </button>
  )
}
