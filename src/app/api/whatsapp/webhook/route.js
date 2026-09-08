// Verificación del webhook (Meta llama esto una sola vez al configurarlo)
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

// Recepción de mensajes entrantes
export async function POST(request) {
  const body = await request.json();

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      // Puede ser una notificación de "leído" u otro evento, no un mensaje
      return new Response("OK", { status: 200 });
    }

    const from = message.from; // número del cliente
    const paraEnviar = from.startsWith("549") ? "54" + from.slice(3) : from;
    console.log("Número del remitente (from):", from);
    const texto = message.text?.body;

    if (texto) {
      const respuesta = await preguntarleAGemini(texto);
      await mandarMensajeWhatsApp(paraEnviar, respuesta);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return new Response("Error", { status: 500 });
  }
}

async function preguntarleAGemini(mensajeCliente) {
  const contextoDelNegocio = `
    Sos el asistente virtual de Dimedeti Ambos. Respondé consultas de clientes
    de forma amable y breve, en español rioplatense.
    (Acá vamos a ir agregando de a poco: productos, precios, horarios, política de cambios, etc.)
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${contextoDelNegocio}\n\nCliente: ${mensajeCliente}` }] },
        ],
      }),
    }
  );

  const data = await res.json();
  console.log("Respuesta de Gemini:", JSON.stringify(data));

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Disculpá, no pude procesar tu consulta en este momento.";
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