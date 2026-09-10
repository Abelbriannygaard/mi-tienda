import { supabase } from "@/lib/supabase";

const HORAS_PARA_CONVERSACION_NUEVA = 6;
const MAXIMO_HILOS_POR_CLIENTE = 5;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  const body = await request.json();

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    const from = message.from;
    const paraEnviar = from.startsWith("549") ? "54" + from.slice(3) : from;
    const texto = message.text?.body;

    if (texto) {
      const hiloId = await obtenerOCrearHilo(from);
      await guardarMensaje(from, hiloId, "user", texto);

      const historial = await obtenerHistorialDelHilo(hiloId);
      const respuesta = await preguntarleAGemini(historial);

      await guardarMensaje(from, hiloId, "model", respuesta);
      await mandarMensajeWhatsApp(paraEnviar, respuesta);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return new Response("Error", { status: 500 });
  }
}

async function obtenerOCrearHilo(numeroCliente) {
  const { data: ultimoMensaje } = await supabase
    .from("whatsapp_conversaciones")
    .select("hilo_id, created_at")
    .eq("numero_cliente", numeroCliente)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ultimoMensaje) {
    const fechaUltimoMensaje = new Date(ultimoMensaje.created_at).toLocaleDateString(
      "es-AR",
      { timeZone: "America/Argentina/Buenos_Aires" }
    );
    const fechaHoy = new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    if (fechaUltimoMensaje === fechaHoy) {
      return ultimoMensaje.hilo_id; // mismo día, seguimos la misma conversación
    }
  }

  // Cambió el día: arranca un hilo nuevo
  const nuevoHiloId = crypto.randomUUID();
  await limpiarHilosViejos(numeroCliente);
  return nuevoHiloId;
}

async function limpiarHilosViejos(numeroCliente) {
  const { data: mensajes } = await supabase
    .from("whatsapp_conversaciones")
    .select("hilo_id, created_at")
    .eq("numero_cliente", numeroCliente)
    .order("created_at", { ascending: false });

  if (!mensajes) return;

  const hilosOrdenados = [...new Set(mensajes.map((m) => m.hilo_id))];

  if (hilosOrdenados.length >= MAXIMO_HILOS_POR_CLIENTE) {
    const hilosAEliminar = hilosOrdenados.slice(MAXIMO_HILOS_POR_CLIENTE - 1);
    await supabase
      .from("whatsapp_conversaciones")
      .delete()
      .in("hilo_id", hilosAEliminar);
  }
}

async function guardarMensaje(numeroCliente, hiloId, rol, mensaje) {
  await supabase.from("whatsapp_conversaciones").insert({
    numero_cliente: numeroCliente,
    hilo_id: hiloId,
    rol,
    mensaje,
  });
}

async function obtenerHistorialDelHilo(hiloId) {
  const { data } = await supabase
    .from("whatsapp_conversaciones")
    .select("rol, mensaje")
    .eq("hilo_id", hiloId)
    .order("created_at", { ascending: true })
    .limit(20);

  return data || [];
}

async function preguntarleAGemini(historial) {
  const contextoDelNegocio = `
    Sos el asistente virtual de Dimedeti Ambos. Respondé consultas de clientes
    de forma amable y breve, en español rioplatense.
    (Acá vamos a ir agregando de a poco: productos, precios, horarios, política de cambios, etc.)
  `;

  const contents = historial.map((m) => ({
    role: m.rol,
    parts: [{ text: m.mensaje }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: contextoDelNegocio }] },
        contents,
      }),
    }
  );

  const data = await res.json();
  console.log("Respuesta de Gemini:", JSON.stringify(data));

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Disculpá, no pude procesar tu consulta en este momento."
  );
}

async function mandarMensajeWhatsApp(numeroDestino, texto) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroDestino,
        type: "text",
        text: { body: texto },
      }),
    }
  );

  const data = await res.json();
  console.log("Respuesta de WhatsApp API:", JSON.stringify(data));

  if (!res.ok) {
    console.error("ERROR al mandar mensaje de WhatsApp:", JSON.stringify(data));
  }

  return data;
}