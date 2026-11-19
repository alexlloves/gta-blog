/**
 * Sesión local: solo guarda el id del usuario que ha iniciado sesión.
 * Con autenticación real (NextAuth, Clerk, Supabase Auth...) esta capa se
 * sustituye por la sesión del proveedor (cookie httpOnly / token).
 */
export const SESSION_KEY = "gtavi:session:v2";

export function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSession(userId: string | null) {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Almacenamiento bloqueado: la sesión dura lo que la pestaña.
  }
}
