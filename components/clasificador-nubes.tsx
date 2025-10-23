"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle, X } from "lucide-react"

interface Props {
  onResultado: (resultado: { prediccion: string; confianza: number; descripcion?: string }) => void
  onReinicio: () => void
}

export default function ClasificadorNubes({ onResultado, onReinicio }: Props) {
  const [imagen, setImagen] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<{ prediccion: string; confianza: number; descripcion?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const urlApiBackend = 'https://nubeai.onrender.com'

  const reiniciarEstado = () => {
    setImagen(null)
    setResultado(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
    onReinicio()
  }

  const procesarImagen = async (archivo: File) => {
    reiniciarEstado()
    if (!archivo.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida")
      return
    }
    const lector = new FileReader()
    lector.onload = (e) => setImagen(e.target?.result as string)
    lector.readAsDataURL(archivo)
    setCargando(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", archivo)
      const respuesta = await fetch(`${urlApiBackend}/predict_image`, { method: "POST", body: formData })
      if (!respuesta.ok) throw new Error("Error al clasificar la imagen")
      const datos = await respuesta.json()
      const nuevoResultado = {
        prediccion: datos.prediction || datos.predicted_class,
        confianza: datos.confidence || datos.confidence_score,
        descripcion: datos.description,
      }
      setResultado(nuevoResultado)
      onResultado(nuevoResultado)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setResultado(null)
    } finally {
      setCargando(false)
    }
  }

  const manejarArrastrar = (e: React.DragEvent) => {
    e.preventDefault()
    const archivo = e.dataTransfer.files[0]
    if (archivo) procesarImagen(archivo)
  }

  const manejarCambioArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) procesarImagen(archivo)
  }
  
  const tiposNubes: Record<string, string> = {
    "Cumuliforme alto": "Nubes altas y esponjosas que indican buen tiempo",
    Cúmulo: "Nubes blancas y esponjosas típicas de días soleados",
    Cirriforme: "Nubes delgadas y altas hechas de cristales de hielo",
    Estratocúmulo: "Capas de nubes bajas y grises",
    "Cielo claro": "Sin nubes visibles",
    Estratiforme: "Capas uniformes de nubes bajas",
    Cumulonimbus: "Nubes de tormenta potentes y peligrosas",
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">1. Carga tu Imagen</h2>
          <p className="text-muted-foreground">Arrastra o selecciona una foto</p>
        </div>
        {(imagen || error || resultado) && (
          <button onClick={reiniciarEstado} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Limpiar">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* --- ÁREA DE CARGA CON TAMAÑO FIJO --- */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={manejarArrastrar}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center min-h-[230px] transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 border-2 border-dashed border-secondary/50 rounded-2xl p-8 text-center cursor-pointer hover:border-secondary hover:bg-secondary/5"
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={manejarCambioArchivo} className="hidden" />
        {!imagen ? (
          <div className="space-y-3">
            <div className="flex justify-center"><Upload className="w-12 h-12 text-secondary" /></div>
            <div>
              <p className="font-semibold text-foreground">Arrastra tu imagen aquí</p>
              <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
            </div>
          </div>
        ) : (
          <img src={imagen} alt="Preview" className="max-h-[280px] w-auto rounded-lg" />
        )}
      </div>

      {cargando && (
        <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-lg">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm font-medium">Analizando imagen...</span>
        </div>
      )}

      {resultado && !cargando && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Tipo de Nube Detectado</p>
              <p className="text-2xl font-bold text-foreground">{resultado.prediccion}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confianza</span>
              <span className="text-sm font-bold text-secondary">{(resultado.confianza * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${resultado.confianza * 100}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground">
              {tiposNubes[resultado.prediccion] || "Nube clasificada exitosamente. Pregunta al asistente para más información."}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-accent/10 rounded-lg border border-accent/30">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent">{error}</p>
        </div>
      )}
    </div>
  )
}