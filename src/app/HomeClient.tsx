// src/app/HomeClient.tsx

"use client"

import { useRouter } from "next/navigation"
import { useI18n } from "../i18n"

export const metadata = {
  title: "Exia",
  description: "Choose between exploring planets or running AI classifications.",
}


export default function Home() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-10">🌌 {t("home.title")}</h1>
      <div className="flex gap-6">
        <button
          onClick={() => router.push("/showcase")}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg"
        >
          🚀 {t("home.showcase")}
        </button>
        <button
          onClick={() => router.push("/classification")}
          className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 shadow-lg"
        >
          📊 {t("home.classification")}
        </button>
      </div>
    </div>
  )
}
