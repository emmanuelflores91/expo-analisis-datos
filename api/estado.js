// Estado compartido de la presentación: quién tiene el control y qué se está mostrando.
// Se guarda en Redis (Upstash, integrado desde el Marketplace de Vercel).
const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(comando) {
  const r = await fetch(URL_REDIS, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(comando),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const sala = String((req.query && req.query.sala) || "");
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(sala)) return res.status(400).json({ error: "sala inválida" });
  if (!URL_REDIS || !TOKEN) return res.status(500).json({ error: "falta configurar Redis" });

  const clave = "expo:" + sala;
  try {
    if (req.method === "POST") {
      const c = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (c.accion === "cursor" && ["M", "J", "E"].includes(c.quien)) {
        // el cursor se guarda aparte y no toca el estado de la presentación
        await redis(["SET", clave + ":c", JSON.stringify({ q: c.quien, x: Number(c.x), y: Number(c.y), h: Number.isInteger(c.h) ? c.h : -1, t: Date.now() }), "EX", "60"]);
        return res.status(200).json({ ok: true });
      }
    }
    const [guardado, cur] = await redis(["MGET", clave, clave + ":c"]);
    const actual = guardado ? JSON.parse(guardado) : { controlador: "M", estado: null, v: 0 };

    if (req.method === "GET") return res.status(200).json({ ...actual, cursor: cur ? JSON.parse(cur) : null, ahora: Date.now() });
    if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

    const cuerpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (cuerpo.accion === "control" && ["M", "J", "E"].includes(cuerpo.quien) && ["M", "J", "E"].includes(cuerpo.de)) {
      actual.controlador = cuerpo.quien;
      actual.v++;
    } else if (cuerpo.accion === "estado") {
      if (cuerpo.quien !== actual.controlador) return res.status(409).json(actual);
      actual.estado = cuerpo.estado;
      actual.v++;
    } else {
      return res.status(400).json({ error: "acción inválida" });
    }
    await redis(["SET", clave, JSON.stringify(actual), "EX", "86400"]);
    return res.status(200).json(actual);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
