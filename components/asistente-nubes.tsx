"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
    
interface Mensaje {
  id: string;
  rol: "usuario" | "asistente";
  contenido: string;
}

interface Props {
  resultadoClasificacion: {
    prediccion: string;
    confianza: number;
    descripcion?: string;
  } | null;
}

export default function AsistenteNubes({ resultadoClasificacion }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estaAbierto, setEstaAbierto] = useState(true);
  const contenedorMensajesRef = useRef<HTMLDivElement>(null);

  // URL del backend (puedes sobreescribir con NEXT_PUBLIC_API_URL en .env.local)
  const urlApiBackend = 'https://nubeai.onrender.com/';

  // Auto-scroll
  useEffect(() => {
    if (contenedorMensajesRef.current) {
      contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Mensaje inicial cuando se clasifica una imagen
  useEffect(() => {
    if (resultadoClasificacion) {
      const mensajeInicial: Mensaje = {
        id: Date.now().toString(),
        rol: "asistente",
        contenido: `¡Excelente! He detectado una nube de tipo **${resultadoClasificacion.prediccion}** con una confianza del ${(resultadoClasificacion.confianza * 100).toFixed(1)}%. ¿Qué te gustaría saber sobre este tipo de nube?`,
      };
      setMensajes([mensajeInicial]);
      setEstaAbierto(true);
    } else {
      setMensajes([]);
    }
  }, [resultadoClasificacion]);

  const enviarMensaje = async () => {
    if (!entrada.trim() || cargando) return;

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: "usuario",
      contenido: entrada,
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setEntrada("");
    setCargando(true);

    try {
      const contexto = resultadoClasificacion
        ? `El usuario clasificó una nube: ${resultadoClasificacion.prediccion} (confianza ${(resultadoClasificacion.confianza * 100).toFixed(1)}%).`
        : "Sin clasificación previa.";

      const respuesta = await fetch(`${urlApiBackend}/assistant_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nuevoMensajeUsuario.contenido,
          temperature: 0.3,
          context: contexto,
        }),
      });

      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      const datos = await respuesta.json();
      const texto =
        datos.response ||
        datos.assistant_response ||
        datos.message ||
        "No se recibió respuesta.";

      const nuevoMensajeAsistente: Mensaje = {
        id: (Date.now() + 1).toString(),
        rol: "asistente",
        contenido: texto,
      };

      setMensajes((prev) => [...prev, nuevoMensajeAsistente]);
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          rol: "asistente",
          contenido:
            "Lo siento, hubo un error al procesar tu pregunta. Intenta de nuevo.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-500">
      <div
        className="p-8 cursor-pointer"
        onClick={() => setEstaAbierto(!estaAbierto)}
        aria-expanded={estaAbierto}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-7 h-7 text-secondary" />
            <div>
              <h2 className="text-2xl font-bold">2. Pregúntale al Asistente</h2>
              <p className="text-muted-foreground">Obtén más información</p>
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-white/10"
            aria-label="Desplegar asistente"
          >
            {estaAbierto ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          estaAbierto ? "max-h-[600px]" : "max-h-0"
        }`}
      >
        <div className="px-8 pb-8 flex flex-col h-[500px]">
          <div
            ref={contenedorMensajesRef}
            className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2"
          >
            {mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-3">☁️</div>
                <p className="text-muted-foreground">
                  Sube una imagen para comenzar o haz una pregunta sobre nubes
                </p>
              </div>
            ) : (
              mensajes.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.rol === "usuario" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={
                      msg.rol === "usuario"
                        ? "ml-auto max-w-xs bg-gradient-to-r from-primary to-secondary text-white rounded-2xl rounded-tr-none px-4 py-3 animate-in fade-in slide-in-from-right-4 duration-300"
                        : "mr-auto max-w-xs rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-tl-none px-4 py-3 animate-in fade-in slide-in-from-left-4 duration-300"
                    }
                  >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p className="text-sm whitespace-pre-wrap" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 text-sm" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 text-sm" {...props} />,
                            li: ({ node, ...props }) => <li {...props} />,
                            // puedes mapear más tags si quieres
                        }}
                        >
                        {msg.contenido}
                    </ReactMarkdown>

                  </div>
                </div>
              ))
            )}
            {cargando && (
              <div className="flex justify-start">
                <div className="mr-auto max-w-xs rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-tl-none px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !cargando && enviarMensaje()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-input border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              disabled={cargando}
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando || !entrada.trim()}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 p-3"
            >
              {cargando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
