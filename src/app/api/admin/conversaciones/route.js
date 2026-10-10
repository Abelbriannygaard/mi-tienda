import { createClient } from "@supabase/supabase-js";
import { esAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MENSAJES_POR_PAGINA = 50;
const BUCKET_MEDIA = "whatsapp-media";

const ETIQUETAS_MEDIA = {
  image: "📷 Foto",
  video: "🎥 Video",
  audio: "🎤 Audio",
  document: "📎 Documento",
};

// Formatos que WhatsApp acepta para enviar, y a qué categoría pertenece cada uno
const CATEGORIAS = {
  "image/jpeg": "image",
  "image/png": "image",
  "video/mp4": "video",
  "video/3gpp": "video",
  "audio/aac": "audio",
  "audio/mp4": "audio",
  "audio/mpeg": "audio",
  "audio/amr": "audio",
  "audio/ogg": "audio",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "text/plain": "document",
};

const ERROR_FORMATO =
  "WhatsApp no acepta ese tipo de archivo. Se pueden enviar fotos JPG o PNG, videos MP4, audios (MP3, M4A, AAC, OGG), PDF y documentos de Office o de texto.";

function normalizarMime(mime) {
  const base = (mime || "").split(";")[0].trim().toLowerCase();
  const alias = {
    "audio/mp3": "audio/mpeg",
    "audio/x-m4a": "audio/mp4",
    "audio/m4a": "audio/mp4",
    "image/jpg": "image/jpeg",
  };
  return alias[base] || base;
}

function numeroParaWhatsApp(numero) {
  return numero.startsWith("549") ? "54" + numero.slice(3) : numero;
}

async function mandarAWhatsApp(cuerpo) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...cuerpo }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

async function hiloDelCliente(numero) {
  const { data: ultimo } = await supabase
    .from("whatsapp_conversaciones")
    .select("hilo_id")
    .eq("numero_cliente", numero)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ultimo?.hilo_id || crypto.randomUUID();
}

// GET sin parámetros: lista de conversaciones
// GET ?numero=549...: últimos mensajes de un cliente
// GET ?numero=549...&antes=2026-09-25T12:00:00Z: mensajes anteriores a esa fecha
export async function GET(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const numero = searchParams.get("numero");
  const antes = searchParams.get("antes");

  if (numero) {
    let consulta = supabase
      .from("whatsapp_conversaciones")
      .select("id, rol, mensaje, created_at, tipo, media_url, media_mime, media_nombre")
      .eq("numero_cliente", numero)
      .order("created_at", { ascending: false })
      .limit(MENSAJES_POR_PAGINA);

    if (antes) {
      consulta = consulta.lt("created_at", antes);
    }

    const { data: mensajes } = await consulta;

    const { data: cliente } = await supabase
      .from("whatsapp_clientes")
      .select("bot_pausado, nombre_cliente")
      .eq("numero_cliente", numero)
      .maybeSingle();

    return Response.json({
      mensajes: (mensajes || []).reverse(),
      hay_mas: (mensajes || []).length === MENSAJES_POR_PAGINA,
      bot_pausado: cliente?.bot_pausado || false,
      nombre_cliente: cliente?.nombre_cliente || null,
    });
  }

  const { data: clientes } = await supabase
    .from("whatsapp_clientes")
    .select("numero_cliente, nombre_cliente, bot_pausado");

  const { data: mensajes } = await supabase
    .from("whatsapp_conversaciones")
    .select("numero_cliente, rol, mensaje, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const ultimoPorNumero = {};
  for (const m of mensajes || []) {
    if (!ultimoPorNumero[m.numero_cliente]) {
      ultimoPorNumero[m.numero_cliente] = m;
    }
  }

  const conversaciones = (clientes || [])
    .map((c) => {
      const ultimo = ultimoPorNumero[c.numero_cliente];
      return {
        numero_cliente: c.numero_cliente,
        nombre_cliente: c.nombre_cliente,
        bot_pausado: c.bot_pausado,
        ultimo_mensaje: ultimo?.mensaje || null,
        ultimo_rol: ultimo?.rol || null,
        ultima_fecha: ultimo?.created_at || null,
      };
    })
    .sort((a, b) => new Date(b.ultima_fecha || 0) - new Date(a.ultima_fecha || 0));

  return Response.json({ conversaciones });
}

// POST { accion: "enviar", numero, texto }
// POST { accion: "pausar", numero, pausado: true/false }
// POST { accion: "firmar_subida", numero, nombre, mime }  -> permiso para subir un archivo
// POST { accion: "enviar_media", numero, url, mime, nombre, caption }
export async function POST(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { accion, numero } = body;

  if (!numero) {
    return Response.json({ error: "Falta el número" }, { status: 400 });
  }

  if (accion === "pausar") {
    const { error } = await supabase
      .from("whatsapp_clientes")
      .update({ bot_pausado: Boolean(body.pausado) })
      .eq("numero_cliente", numero);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  if (accion === "enviar") {
    const texto = (body.texto || "").trim();
    if (!texto) {
      return Response.json({ error: "El mensaje está vacío" }, { status: 400 });
    }

    const { ok, data } = await mandarAWhatsApp({
      to: numeroParaWhatsApp(numero),
      type: "text",
      text: { body: texto },
    });

    if (!ok) {
      return Response.json(
        { error: data?.error?.message || "WhatsApp rechazó el mensaje" },
        { status: 502 }
      );
    }

    await supabase.from("whatsapp_conversaciones").insert({
      numero_cliente: numero,
      hilo_id: await hiloDelCliente(numero),
      rol: "admin",
      mensaje: texto,
    });

    return Response.json({ ok: true });
  }

  // Paso 1 para enviar un archivo: pedir permiso para subirlo directo a Supabase Storage
  // (así el archivo no pasa por el servidor de Vercel, que tiene límite de tamaño)
  if (accion === "firmar_subida") {
    const mime = normalizarMime(body.mime);
    const categoria = CATEGORIAS[mime];
    if (!categoria) {
      return Response.json({ error: ERROR_FORMATO }, { status: 400 });
    }

    const nombreLimpio = (body.nombre || "archivo")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-80);
    const ruta = `salientes/${numero}/${crypto.randomUUID()}-${nombreLimpio}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_MEDIA)
      .createSignedUploadUrl(ruta);

    if (error) {
      return Response.json(
        { error: "No se pudo preparar la subida: " + error.message },
        { status: 500 }
      );
    }

    const { data: publico } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(ruta);

    return Response.json({
      path: ruta,
      token: data.token,
      url: publico.publicUrl,
      mime,
      categoria,
    });
  }

  // Paso 2: ya subido el archivo, pedirle a WhatsApp que lo mande al cliente
  if (accion === "enviar_media") {
    const mime = normalizarMime(body.mime);
    const categoria = CATEGORIAS[mime];
    if (!categoria) {
      return Response.json({ error: ERROR_FORMATO }, { status: 400 });
    }

    const url = body.url || "";
    const prefijo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_MEDIA}/`;
    if (!url.startsWith(prefijo)) {
      return Response.json({ error: "Link de archivo inválido" }, { status: 400 });
    }

    const nombre = (body.nombre || "").trim();
    const caption = (body.caption || "").trim();
    // Los audios no admiten texto acompañando
    const conTexto = categoria !== "audio" && caption !== "";

    const cargaUtil = { link: url };
    if (categoria === "document") cargaUtil.filename = nombre || "archivo";
    if (conTexto) cargaUtil.caption = caption;

    const { ok, data } = await mandarAWhatsApp({
      to: numeroParaWhatsApp(numero),
      type: categoria,
      [categoria]: cargaUtil,
    });

    if (!ok) {
      return Response.json(
        { error: data?.error?.message || "WhatsApp rechazó el archivo" },
        { status: 502 }
      );
    }

    const etiqueta = ETIQUETAS_MEDIA[categoria];

    await supabase.from("whatsapp_conversaciones").insert({
      numero_cliente: numero,
      hilo_id: await hiloDelCliente(numero),
      rol: "admin",
      mensaje: conTexto ? `${etiqueta}\n${caption}` : etiqueta,
      tipo: categoria,
      media_url: url,
      media_mime: mime,
      media_nombre: nombre || null,
    });

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Acción desconocida" }, { status: 400 });
}