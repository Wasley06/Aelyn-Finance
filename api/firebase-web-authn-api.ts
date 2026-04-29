function getTargetBaseUrl() {
  const explicit = process.env.FIREBASE_WEB_AUTHN_API_URL;
  if (explicit) return explicit.replace(/\/+$/g, '');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const region = process.env.FIREBASE_FUNCTIONS_REGION || 'us-central1';
  if (!projectId) return null;

  // Default function URL for the FirebaseWebAuthn extension.
  return `https://${region}-${projectId}.cloudfunctions.net/ext-firebase-web-authn-api`;
}

export default async function handler(req: any, res: any) {
  const base = getTargetBaseUrl();
  if (!base) {
    res.status(500).json({
      error:
        'Missing FIREBASE_WEB_AUTHN_API_URL (or FIREBASE_PROJECT_ID) environment variables. Set these in Vercel project settings.',
    });
    return;
  }

  const targetUrl = `${base}${req.url || ''}`.replace(/\/\?/g, '?');

  // Forward request to the Firebase function (streaming response where possible).
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'undefined') continue;
    if (Array.isArray(v)) headers.set(k, v.join(','));
    else headers.set(k, String(v));
  }
  // Host must be re-written by fetch.
  headers.delete('host');

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : (req as any),
    redirect: 'manual',
  };

  try {
    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || 'Upstream request failed.' });
  }
}
