import { cookies } from "next/headers";

export async function esAdmin() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("admin_sesion");
  return Boolean(cookie && cookie.value === process.env.ADMIN_PASSWORD);
}