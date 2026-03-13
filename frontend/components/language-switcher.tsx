"use client"

import { useState } from "react"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const [lang, setLang] = useState("en")

  const changeLanguage = (language: string) => {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null

    if (!select) return

    select.value = language
    select.dispatchEvent(new Event("change"))

    setLang(language)
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium">
        <Globe className="w-5 h-5" />
        Language
      </button>

      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 shadow-lg rounded-lg border opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => changeLanguage("en")}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🇺🇸 English
        </button>

        <button
          onClick={() => changeLanguage("hi")}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🇮🇳 हिंदी
        </button>
      </div>
    </div>
  )
}