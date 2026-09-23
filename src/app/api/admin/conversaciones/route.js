import { createClient } from "@supabase/supabase-js";
import { esAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET sin parámetros: lista de conversaciones
// GET ?numero=549...: historial de un cliente
export async function GET(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const numero = searchParams.get("numero");

  if (numero) {
    const { data: mensajes } = await supabase
      .from("whatsapp_conversaciones")
      .select("rol, mensaje, created_at")
      .eq("numero_cliente", numero)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: cliente } = await supabase
      .from("whatsapp_clientes")
      .select("bot_pausado, nombre_cliente")
      .eq("numero_cliente", numero)
      .maybeSingle();

    return Response.json({
      mensajes: (mensajes || []).reverse(),
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

    const paraEnviar = numero.startsWith("549") ? "54" + numero.slice(3) : numero;

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
          to: paraEnviar,
          type: "text",
          text: { body: texto },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "WhatsApp rechazó el mensaje" },
        { status: 502 }
      );
    }

    const { data: ultimo } = await supabase
      .from("whatsapp_conversaciones")
      .select("hilo_id")
      .eq("numero_cliente", numero)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("whatsapp_conversaciones").insert({
      numero_cliente: numero,
      hilo_id: ultimo?.hilo_id || crypto.randomUUID(),
      rol: "admin",
      mensaje: texto,
    });

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Acción desconocida" }, { status: 400 });
}