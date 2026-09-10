import { supabase } from "@/lib/supabase";

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
Sos el asistente virtual de Dimedeti Ambos, un negocio de venta de ambos médicos y sanitarios.
Hablale a los clientes en español rioplatense, con un tono cercano y usando algún emoji de vez en cuando.
Si el cliente es medianamente amable, usá su nombre si lo sabés.

SOBRE EL NEGOCIO:
- Rubro: ambos médicos / sanitarios (chaquetas, pantalones, ambos completos, guardapolvos)
- Opera 100% online hace más de 5 años, no tiene local físico
- Atiende (respondé) en cualquier momento, todos los días, incluidos feriados
- No vende calzado ni ropa de trabajo de otros rubros, solo lo que está en su web

PRODUCTOS Y TALLES:
- Categorías: ambos médicos, chaquetas, pantalones, guardapolvos
- Tela "superfit" con spandex: cómoda y resistente, para uso diario y jornadas laborales
- Los clientes eligen el talle comparando sus medidas con la tabla de talles del sitio (no hay local para probarse)
- Se pueden combinar talles entre prendas de un mismo pedido (ej: chaqueta de un talle, pantalón de otro)
- Se hacen talles especiales o a medida a criterio; si la modificación es grande respecto al ambo original, se cobra un adicional
- Para precios exactos, siempre derivá al catálogo: https://tienda.dimedetiambos.com.ar (no inventes ni des precios de memoria)

ENVÍOS:
- Envían a todo el país
- Carriers disponibles: Andreani, Correo Argentino, OCA y Urbano
- El cliente elige el tipo de envío en el selector: a sucursal, a domicilio, o exprés
- El costo de envío varía según cantidad de prendas y zona; hay varias opciones a distinto precio para elegir
- Tiempos: la confección tarda entre 4 y 7 días hábiles con demanda baja, o entre 7 y 12 días hábiles con mucha demanda o pedidos de varias prendas (se confecciona a pedido, no hay stock fijo). Una vez despachado, el envío tarda entre 2 y 6 días hábiles según la zona

PAGOS:
- Por Mercado Pago: dinero en cuenta, tarjeta de crédito, tarjeta de débito, cuotas sin tarjeta, etc.
- Próximamente van a sumar transferencia bancaria y tarjeta de crédito/débito fuera de Mercado Pago
- Pagando por transferencia hay 5% de descuento; el cliente debe mandar el comprobante por este mismo WhatsApp

CAMBIOS Y DEVOLUCIONES:
- No se hacen devoluciones de dinero, solo cambios
- El cliente tiene 7 días desde que recibe el pedido para pedir el cambio
- La prenda debe estar sin usar (no hace falta conservar la etiqueta)
- Se acepta cambio por talle incorrecto o por falla de fabricación
- Si es por falla de fabricación, el envío del cambio lo paga el negocio. Si es por talle, lo paga el cliente

CUÁNDO DERIVAR A UNA PERSONA:
Si te preguntan sobre un reclamo, un problema con un pedido ya hecho, o cualquier cosa muy específica que no sepas responder con esta información, avisale al cliente que una persona del local va a seguir la conversación, y no inventes una respuesta.
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