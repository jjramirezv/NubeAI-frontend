"use client";

import { useState } from "react";
// Importa los íconos que usaremos
import { Camera, UploadCloud, Sparkles } from "lucide-react";
// CORREGIDO: Se ajustaron las rutas de importación de ../ a ./
import ClasificadorNubes from "../components/clasificador-nubes";
import AsistenteNubes from "../components/asistente-nubes";
import Encabezado from "../components/encabezado";
import CamaraNubes from "../components/camara-nubes";

// --- TIPOS ---
type Resultado = {
  prediccion: string;
  confianza: number;
  descripcion?: string;
};

// --- COMPONENTE PRINCIPAL ---
export default function Inicio() {
  // Estado general para el Asistente
  const [resultadoClasificacion, setResultadoClasificacion] = useState<Resultado | null>(null);
  
  // --- MANEJADORES DE ESTADO ---
  const manejarReinicio = () => {
    setResultadoClasificacion(null);
    // Los componentes hijos (CamaraNubes, ClasificadorNubes)
    // manejarán su propio reseteo de UI al recibir esta prop
  };

  // Esta función centraliza la lógica de formatear el resultado
  const manejarResultado = (res: any) => {
    if (!res) {
      setResultadoClasificacion(null);
      return null;
    }
    const resultadoFormateado = {
      prediccion: String(res.prediccion ?? res.prediction ?? res.label ?? "Desconocido"),
      confianza: Number(res.confianza ?? res.confidence ?? res.score ?? 0),
      descripcion: res.descripcion ?? res.description ?? undefined,
    };
    setResultadoClasificacion(resultadoFormateado); // Actualiza el estado global para el Asistente
    return resultadoFormateado;
  };
  
  // --- RENDERIZADO ---
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* ... Tu código de fondo decorativo ... */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-blue-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900" />
        <div className="absolute top-10 left-0 w-96 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl nube-flotante" style={{ animationDuration: "25s" }} />
        <div className="absolute top-40 right-0 w-80 h-24 bg-white/20 dark:bg-white/5 rounded-full blur-3xl nube-flotante" style={{ animationDuration: "30s", animationDelay: "5s" }} />
        <div className="absolute bottom-20 left-1/4 w-72 h-28 bg-white/25 dark:bg-white/8 rounded-full blur-3xl nube-flotante" style={{ animationDuration: "35s", animationDelay: "10s" }} />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-200/20 dark:bg-yellow-600/10 rounded-full blur-3xl brillo-solar" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-200/10 dark:to-blue-900/20" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        <Encabezado />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* ... Título y descripción (sin cambios) ... */}
          <div className="text-center mb-12 animacion-entrada" style={{ animationDelay: "100ms" }}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 titulo-animado">
              Descubre el tipo de nube con NubeIA
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              Usa la cámara o sube una imagen y nuestro asistente te revelará los secretos del cielo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animacion-entrada" style={{ animationDelay: "300ms" }}>
            
            {/* --- Columna Izquierda: Paneles de Acción --- */}
            <div className="flex flex-col gap-6">
              
              {/* === PANEL DE CÁMARA === */}
              <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center"><Camera className="mr-2"/>Captura en vivo</h3>
                
                {/* Este componente (CamaraNubes) ahora maneja su propia UI de resultado */}
                <CamaraNubes
                  onImagenClasificada={(res: any) => {
                    manejarResultado(res); // Solo actualiza el estado global
                  }}
                  onReinicio={manejarReinicio} // Le pasamos el reinicio global
                />
              </section>

              {/* === PANEL DE CLASIFICADOR === */}
              <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                 <h3 className="text-lg font-semibold mb-3 flex items-center"><UploadCloud className="mr-2"/>Subir imagen</h3>
                 
                 <ClasificadorNubes
                    onResultado={(res: any) => {
                      manejarResultado(res);
                    }}
                    onReinicio={manejarReinicio}
                  />
              </section>
            </div>

            {/* --- Columna Derecha: Asistente y Botón Global --- */}
            <div className="flex flex-col gap-6">
              <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex-1">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Sparkles className="mr-2 text-primary"/>
                  Asistente de Nubes
                </h3>
                <AsistenteNubes resultadoClasificacion={resultadoClasificacion} />
              </section>
              
              {/* Botón de reinicio global que aparece si hay un resultado */}
              {resultadoClasificacion && (
                 <button
                    onClick={manejarReinicio}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Analizar de Nuevo
                  </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
