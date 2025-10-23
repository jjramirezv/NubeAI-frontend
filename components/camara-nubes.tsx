"use client";

import React, { useEffect, useRef, useState } from "react";
// Importamos los íconos del diseño que te gusta
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Tipos locales ---
type ResultadoLocal = {
  prediction: string;
  confidence: number;
};
type EstadoProceso = "inactivo" | "cargando" | "exitoso";

// Props que vienen del padre
type CamaraNubesProps = {
  onImagenClasificada: (data: ResultadoLocal | null) => void;
  onReinicio: () => void;
};

// Mapa de descripciones de nubes (copiado de tu clasificador)
const tiposNubes: Record<string, string> = {
  "Cumuliforme alto": "Nubes altas y esponjosas que indican buen tiempo",
  Cúmulo: "Nubes blancas y esponjosas típicas de días soleados",
  Cirriforme: "Nubes delgadas y altas hechas de cristales de hielo",
  Estratocúmulo: "Capas de nubes bajas y grises",
  "Cielo claro": "Sin nubes visibles",
  Estratiforme: "Capas uniformes de nubes bajas",
  Cumulonimbus: "Nubes de tormenta potentes y peligrosas",
};

export default function CamaraNubes({ onImagenClasificada, onReinicio }: CamaraNubesProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturaUrl, setCapturaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Estados locales para manejar la UI de resultado ---
  const [estadoLocal, setEstadoLocal] = useState<EstadoProceso>("inactivo");
  const [resultadoLocal, setResultadoLocal] = useState<ResultadoLocal | null>(null);

  // Inicia la cámara
  const startCamera = async () => {
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo acceder a la cámara");
      setStreamActive(false);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    const s = videoRef.current?.srcObject as MediaStream | null;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreamActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Captura el frame actual
  const captureImage = async (): Promise<Blob | null> => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, vw, vh);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
    );
  };

  // Limpia solo los resultados locales y notifica al padre
  const handleLimpiar = () => {
    setCapturaUrl(null);
    setError(null);
    setEstadoLocal("inactivo");
    setResultadoLocal(null);
    onReinicio(); // Llama al reinicio global del padre (para el Asistente)
  };

  // Captura + envia al backend
  const handleCapturarYEnviar = async () => {
    setLoading(true);
    setError(null);
    setResultadoLocal(null);
    setEstadoLocal("cargando"); // 1. Pone la UI local en modo "cargando"
    onImagenClasificada(null); // Limpia el asistente

    try {
      const blob = await captureImage();
      if (!blob) throw new Error("No se generó la imagen.");
      
      const url = URL.createObjectURL(blob);
      setCapturaUrl(url); // Muestra la vista previa

      const form = new FormData();
      form.append("file", blob, "captura.jpg");

      const resp = await fetch(`${API_URL}/predict_image`, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status} - ${txt}`);
      }

      const data: ResultadoLocal = await resp.json();
      
      setResultadoLocal(data); // 2. Actualiza el estado local
      setEstadoLocal("exitoso"); // 3. Pone la UI en modo "exitoso"
      if (onImagenClasificada) onImagenClasificada(data); // 4. Notifica al padre
      
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error al capturar o enviar la imagen");
      setEstadoLocal("inactivo"); // Resetea la UI local en caso de error
      if (onImagenClasificada) onImagenClasificada(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6"> 
      
      {/* --- 1. BOTONES DE CONTROL (NO DESAPARECEN) --- */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => (streamActive ? stopCamera() : startCamera())}
          className="px-3 py-2 rounded bg-primary text-white"
        >
          {streamActive ? "Detener cámara" : "Activar cámara"}
        </button>

        <button
          onClick={handleCapturarYEnviar}
          disabled={!streamActive || loading}
          className="px-3 py-2 rounded bg-gradient-to-r from-primary to-secondary text-white disabled:opacity-60"
        >
          {loading ? "Capturando..." : "Capturar y Clasificar"}
        </button>

        {/* Botón Limpiar (ahora usa la nueva función) */}
        <button
          onClick={handleLimpiar}
          className="px-3 py-2 rounded border"
        >
          Limpiar
        </button>
      </div>

      {/* --- 2. VIDEO FEED Y VISTA PREVIA (NO DESAPARECEN) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/10 rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-auto object-cover" playsInline />
        </div>

        <div className="bg-black/5 rounded p-2 flex flex-col items-center justify-center min-h-[200px]">
          <canvas ref={canvasRef} className="hidden" />
          {capturaUrl ? (
            <img src={capturaUrl} alt="Preview captura" className="max-h-64 object-contain rounded" />
          ) : (
            <div className="text-center text-sm text-muted-foreground">Preview de la captura aquí</div>
          )}
        </div>
      </div>

      {/* --- 3. PANEL DE RESULTADO DINÁMICO (APARECE DEBAJO) --- */}
      
      {/* Estado de Carga */}
      {estadoLocal === 'cargando' && (
        <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-lg">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm font-medium">Analizando captura...</span>
        </div>
      )}

      {/* Estado Exitoso (USA LA ESTÉTICA QUE PEDISTE) */}
      {estadoLocal === 'exitoso' && resultadoLocal && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Tipo de Nube Detectado</p>
              <p className="text-2xl font-bold text-foreground">{resultadoLocal.prediction}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confianza</span>
              <span className="text-sm font-bold text-secondary">{(resultadoLocal.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${resultadoLocal.confidence * 100}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground">
              {tiposNubes[resultadoLocal.prediction] || "Nube clasificada exitosamente. Pregunta al asistente para más información."}
            </p>
          </div>
        </div>
      )}

      {/* Estado de Error (USA LA ESTÉTICA QUE PEDISTE) */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 bg-accent/10 rounded-lg border border-accent/30">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent">{error}</p>
        </div>
      )}
      
    </div>
  );
}
