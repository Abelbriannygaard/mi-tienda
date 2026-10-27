import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Descargar archivos de WhatsApp puede tardar unos segundos
export const maxDuration = 30;

webpush.setVapidDetails(
  "mailto:dimedetiambos@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_MEDIA = "whatsapp-media";
// true = el bot responde solo. false = el bot no responde y solo contesta una persona del local.
const BOT_ACTIVO = true;

// Tipos de archivo que recibimos y cómo se rotulan en el panel
const ETIQUETAS_MEDIA = {
  image: "📷 Foto",
  video: "🎥 Video",
  audio: "🎤 Audio",
  document: "📎 Documento",
  sticker: "🏷️ Sticker",
};

const AVISO_ARCHIVO_RECIBIDO =
  "¡Gracias! 🙌 Recibí tu archivo. Una persona del local lo va a revisar y te responde a la brevedad.";

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

  // Estados de entrega de WhatsApp (sent, delivered, read, failed)
  const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (statuses) console.log("STATUS WhatsApp:", JSON.stringify(statuses));

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    // Meta reenvía el aviso si tardamos en responder: si este mensaje ya lo guardamos, no lo repetimos
    if (message.id) {
      const { data: yaGuardado } = await supabase
        .from("whatsapp_conversaciones")
        .select("id")
        .eq("wa_id", message.id)
        .limit(1)
        .maybeSingle();

      if (yaGuardado) {
        return new Response("OK", { status: 200 });
      }
    }

    const from = message.from;
    const paraEnviar = from.startsWith("549") ? "54" + from.slice(3) : from;
    const texto = message.text?.body;

    if (texto) {
      const hiloId = await obtenerOCrearHilo(from);
      await asegurarCliente(from);
      await guardarMensaje(from, hiloId, "user", texto, { wa_id: message.id });
      await avisarNuevoMensaje(from, texto);

      const pausado = await estaBotPausado(from);

      if (!pausado && BOT_ACTIVO) {
        const historial = await obtenerHistorialDelHilo(hiloId);
        const respuesta = await preguntarleAClaude(historial);

        await guardarMensaje(from, hiloId, "model", respuesta);
        await mandarMensajeWhatsApp(paraEnviar, respuesta);
      }
    } else if (ETIQUETAS_MEDIA[message.type]) {
      await procesarArchivoRecibido(message, from, paraEnviar);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return new Response("Error", { status: 500 });
  }
}

// Foto, video, audio, documento o sticker que manda el cliente
async function procesarArchivoRecibido(message, from, paraEnviar) {
  const tipo = message.type;
  const datos = message[tipo] || {};
  const caption = datos.caption || "";
  const etiqueta = ETIQUETAS_MEDIA[tipo];
  const mensaje = caption ? `${etiqueta}\n${caption}` : etiqueta;

  const hiloId = await obtenerOCrearHilo(from);
  await asegurarCliente(from);

  let archivo = null;
  try {
    archivo = await descargarYGuardarArchivo(datos.id, from, datos.mime_type, datos.filename);
  } catch (error) {
    console.error("No se pudo descargar el archivo de WhatsApp:", error.message);
  }

  await guardarMensaje(from, hiloId, "user", mensaje, {
    tipo,
    media_url: archivo?.url || null,
    media_mime: archivo?.mime || datos.mime_type || null,
    media_nombre: datos.filename || null,
    wa_id: message.id,
  });

  await avisarNuevoMensaje(from, mensaje);

  // El bot no sabe interpretar archivos: avisa que una persona lo va a ver y se pausa
  const pausado = await estaBotPausado(from);
  if (!pausado && BOT_ACTIVO) {
    await guardarMensaje(from, hiloId, "model", AVISO_ARCHIVO_RECIBIDO);
    await mandarMensajeWhatsApp(paraEnviar, AVISO_ARCHIVO_RECIBIDO);
    await supabase
      .from("whatsapp_clientes")
      .update({ bot_pausado: true })
      .eq("numero_cliente", from);
  }
}

function extensionDeMime(mime, nombre) {
  const base = (mime || "").split(";")[0].trim().toLowerCase();
  const mapa = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/3gpp": "3gp",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/amr": "amr",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
  };
  if (mapa[base]) return mapa[base];

  if (nombre && nombre.includes(".")) {
    const deNombre = nombre.split(".").pop();
    if (/^[a-zA-Z0-9]{1,6}$/.test(deNombre)) return deNombre.toLowerCase();
  }
  return "bin";
}

// Baja el archivo de los servidores de Meta y lo guarda en Supabase Storage
async function descargarYGuardarArchivo(mediaId, numeroCliente, mimeDeclarado, nombreOriginal) {
  if (!mediaId) throw new Error("El mensaje no trae el id del archivo");

  const cabeceras = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };

  const resInfo = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: cabeceras,
  });
  const info = await resInfo.json();
  if (!resInfo.ok || !info.url) {
    throw new Error("Meta no devolvió el link del archivo: " + JSON.stringify(info));
  }

  const resArchivo = await fetch(info.url, { headers: cabeceras });
  if (!resArchivo.ok) {
    throw new Error("No se pudo bajar el archivo (código " + resArchivo.status + ")");
  }
  const contenido = Buffer.from(await resArchivo.arrayBuffer());

  const mimeCompleto = info.mime_type || mimeDeclarado || resArchivo.headers.get("content-type") || "";
  const mime = mimeCompleto.split(";")[0].trim().toLowerCase() || "application/octet-stream";
  const extension = extensionDeMime(mime, nombreOriginal);
  const ruta = `entrantes/${numeroCliente}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_MEDIA)
    .upload(ruta, contenido, { contentType: mime, upsert: false });
  if (error) throw new Error("No se pudo guardar en Storage: " + error.message);

  const { data } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(ruta);
  return { url: data.publicUrl, mime };
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
  return nuevoHiloId;
}

async function guardarMensaje(numeroCliente, hiloId, rol, mensaje, extra = {}) {
  await supabase.from("whatsapp_conversaciones").insert({
    numero_cliente: numeroCliente,
    hilo_id: hiloId,
    rol,
    mensaje,
    ...extra,
  });
}

async function estaBotPausado(numeroCliente) {
  const { data } = await supabase
    .from("whatsapp_clientes")
    .select("bot_pausado")
    .eq("numero_cliente", numeroCliente)
    .maybeSingle();

  return data?.bot_pausado || false;
}

async function asegurarCliente(numeroCliente) {
  const { data } = await supabase
    .from("whatsapp_clientes")
    .select("id")
    .eq("numero_cliente", numeroCliente)
    .maybeSingle();

  if (!data) {
    await supabase
      .from("whatsapp_clientes")
      .insert({ numero_cliente: numeroCliente });
  }
}

async function avisarNuevoMensaje(numeroCliente, texto) {
  const { data: suscripciones } = await supabase
    .from("push_suscripciones")
    .select("id, endpoint, p256dh, auth");

  if (!suscripciones || suscripciones.length === 0) return;

  const payload = JSON.stringify({
    titulo: "Nuevo mensaje de WhatsApp",
    cuerpo: texto.length > 100 ? texto.slice(0, 100) + "..." : texto,
    url: `/admin/conversaciones`,
  });

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // La suscripción ya no existe (se desinstaló la app, etc.)
          await supabase.from("push_suscripciones").delete().eq("id", s.id);
        } else {
          console.error("Error al mandar notificación push:", error.message);
        }
      }
    })
  );
}

async function obtenerHistorialDelHilo(hiloId) {
  const { data } = await supabase
    .from("whatsapp_conversaciones")
    .select("rol, mensaje")
    .eq("hilo_id", hiloId)
    .order("created_at", { ascending: false })
    .limit(20);

  const historial = (data || []).reverse();

  // La API exige que la conversación arranque con un mensaje del cliente
  while (historial.length > 0 && historial[0].rol !== "user") {
    historial.shift();
  }

  return historial;
}

// Solo los productos marcados como visibles (el bot no ofrece productos ocultos)
async function obtenerProductos() {
  const { data } = await supabase
    .from("productos")
    .select("nombre, descripcion, precio")
    .eq("visible", true)
    .order("nombre", { ascending: true });

  return data || [];
}

async function preguntarleAClaude(historial) {
  const productos = await obtenerProductos();
  const listaDeProductos = productos
    .map((p) => `- ${p.nombre}: $${p.precio}${p.descripcion ? " — " + p.descripcion : ""}`)
    .join("\n");
  const contextoDelNegocio = `
Sos el asistente virtual de Dimedeti Ambos, un negocio de venta de ambos médicos y sanitarios.
Hablale a los clientes en español rioplatense, con un tono cercano y usando algún emoji de vez en cuando.
Si el cliente es medianamente amable, usá su nombre si lo sabés.
- El email al cual deben comunicarse si preguntan es negocios@dimedetiambos.com 

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
- Estos son los productos y precios actuales (siempre correctos, tomados directo de la base de datos):
${listaDeProductos}
- Si preguntan por un producto que no está en esta lista, avisá que todavía no está cargado en el sistema y que pueden ver el catálogo completo en https://www.dimedetiambos.com.ar
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

  const mensajes = historial.map((m) => ({
    role: m.rol === "model" || m.rol === "admin" ? "assistant" : "user",
    content: m.mensaje,
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: contextoDelNegocio,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: mensajes,
    }),
  });

  const data = await res.json();
  console.log("Respuesta de Claude:", JSON.stringify(data));

  return (
    data.content?.[0]?.text ||
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