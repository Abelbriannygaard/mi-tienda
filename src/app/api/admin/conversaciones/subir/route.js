import { createClient } from "@supabase/supabase-js";
import { esAdmin } from "../../../../../lib/adminAuth";

// Archivo: src/app/api/admin/conversaciones/subir/route.js
// Subida de respaldo: si el navegador no logra subir el archivo directo a Supabase,
// lo sube por acá (el servidor de la tienda). Vercel admite hasta unos 4,5 MB por pedido.

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_MEDIA = "whatsapp-media";
const LIMITE_BYTES = 4 * 1024 * 1024;

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

export async function POST(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  let formulario;
  try {
    formulario = await request.formData();
  } catch (e) {
    return Response.json({ error: "No se pudo leer el archivo enviado" }, { status: 400 });
  }

  const archivo = formulario.get("archivo");
  const numero = String(formulario.get("numero") || "").replace(/[^0-9]/g, "");

  if (!archivo || typeof archivo === "string" || !numero) {
    return Response.json({ error: "Falta el archivo o el número" }, { status: 400 });
  }

  const mime = normalizarMime(archivo.type);
  const categoria = CATEGORIAS[mime];
  if (!categoria) {
    return Response.json({ error: "WhatsApp no acepta ese tipo de archivo" }, { status: 400 });
  }

  if (archivo.size > LIMITE_BYTES) {
    return Response.json(
      { error: "El archivo pesa demasiado para este método de subida (máximo 4 MB)" },
      { status: 413 }
    );
  }

  const nombreLimpio = (archivo.name || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const ruta = `salientes/${numero}/${crypto.randomUUID()}-${nombreLimpio}`;

  const contenido = Buffer.from(await archivo.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET_MEDIA)
    .upload(ruta, contenido, { contentType: mime, upsert: false });

  if (error) {
    return Response.json({ error: "No se pudo guardar el archivo: " + error.message }, { status: 500 });
  }

  const { data: publico } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(ruta);
  return Response.json({ url: publico.publicUrl, mime, categoria });
}