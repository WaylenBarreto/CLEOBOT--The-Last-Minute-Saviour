function sendJson(res: any, status: number, payload: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.url?.startsWith("/api/health")) {
    return sendJson(res, 200, {
      ok: true,
      entrypoint: "api/index.ts",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      nodeEnv: process.env.NODE_ENV || null,
      runtime: process.env.VERCEL ? "vercel" : "node",
    });
  }

  try {
    const { default: app } = await import("../server");
    return app(req, res);
  } catch (error: any) {
    console.error("Failed to load API server:", error);
    return sendJson(res, 500, {
      error: "Failed to load API server.",
      message: error?.message || String(error),
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    });
  }
}
