import { createClient } from "@supabase/supabase-js";
import { esAdmin } from "../../../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { endpoint, keys } = await request.json();

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Faltan datos de la suscripción" }, { status: 400 });
  }

  await supabase.from("push_suscripciones").delete().eq("endpoint", endpoint);

  const { error } = await supabase.from("push_suscripciones").insert({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}