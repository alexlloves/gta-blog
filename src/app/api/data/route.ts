import { NextResponse, type NextRequest } from "next/server";
import { ensureSchema, getSql } from "@/lib/server/db";
import { HttpError, PUBLIC_ACTIONS, createGuest, findUserId, loadSnapshot, newSecret, runAction } from "@/lib/server/community";

/**
 * API de la comunidad.
 * GET  → todas las preguntas/respuestas + `me` (id anónimo de quien pregunta).
 * POST → { action, ...args }. La identidad es una cookie httpOnly con un
 *        secreto aleatorio; en la base de datos solo se guarda su hash.
 */

const COOKIE = "gtavi_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 meses (máximo que admiten los navegadores)

function noDatabase() {
  return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
}

function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[api/data]", err);
  return NextResponse.json({ error: "Error del servidor. Inténtalo de nuevo." }, { status: 500 });
}

/* Límite sencillo de escrituras por IP (por instancia) contra spam. */
const WINDOW_MS = 60_000;
const MAX_WRITES = 30;
const hits = new Map<string, number[]>();
function rateLimited(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_WRITES;
}

export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return noDatabase();
  try {
    await ensureSchema(sql);
    const [data, me] = await Promise.all([loadSnapshot(sql), findUserId(sql, req.cookies.get(COOKIE)?.value)]);
    return NextResponse.json({ ...data, me }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return noDatabase();
  if (rateLimited(req)) {
    return NextResponse.json({ error: "Demasiadas acciones seguidas. Espera un minuto." }, { status: 429 });
  }
  try {
    const payload = (await req.json().catch(() => null)) as ({ action?: unknown } & Record<string, unknown>) | null;
    if (!payload || typeof payload.action !== "string") throw new HttpError(400, "Petición no válida");
    await ensureSchema(sql);

    let secret = req.cookies.get(COOKIE)?.value;
    let userId = await findUserId(sql, secret);
    let isNew = false;
    if (!userId && !PUBLIC_ACTIONS.has(payload.action)) {
      secret = newSecret();
      userId = await createGuest(sql, secret);
      isNew = true;
    }

    let res: NextResponse;
    try {
      const result = await runAction(sql, payload.action, payload, userId ?? "");
      res = NextResponse.json({ result: result ?? null, me: userId });
    } catch (err) {
      res = errorResponse(err);
    }
    // Aunque la acción falle, se guarda la identidad recién creada.
    if (isNew && secret) {
      res.cookies.set(COOKIE, secret, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    }
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
