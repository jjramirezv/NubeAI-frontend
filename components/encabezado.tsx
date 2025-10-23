"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"

export default function Encabezado() {
  const [temaOscuro, setTemaOscuro] = useState(true)

  const alternarTema = () => {
    setTemaOscuro(!temaOscuro)
    if (temaOscuro) {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/10">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">☁️</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NubeIA
              </h1>
              <p className="text-xs text-muted-foreground">Clasificación Inteligente de Nubes</p>
            </div>
          </div>

          {/* Botón Tema */}
          <button
            onClick={alternarTema}
            className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Alternar tema"
          >
            {temaOscuro ? <Sun className="w-5 h-5 text-secondary" /> : <Moon className="w-5 h-5 text-primary" />}
          </button>
        </div>
      </div>
    </header>
  )
}
