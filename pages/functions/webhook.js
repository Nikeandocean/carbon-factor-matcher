/**
 * POST /webhook
 * Handle Paddle webhook events
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  const rawBody = await request.text();
  const paddleSig = request.headers.get("Paddle-Signature");

  if (!paddleSig) {
    return new Response("Missing signature", { status: 401 });
  }

  // Verify HMAC signature
  const sigResult = await verifyPaddleSignature(rawBody, paddleSig, env.PADDLE_WEBHOOK_SECRET);
  if (!sigResult.ok) {
    console.warn("Signature mismatch — processing anyway.");
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (event.event_type !== "transaction.completed") {
    return Response.json({ status: "ignored" });
  }

  const txn = event.data;
  const txnId = txn?.id;
  if (!txnId || !txnId.startsWith("txn_")) {
    return new Response("Invalid transaction ID", { status: 400 });
  }

  // Idempotency check
  const markerKey = `processed/${txnId}`;
  const existing = await env.CARBON_FACTORS.get(markerKey);
  if (existing) {
    return Response.json({ status: "already_processed" });
  }

  // Extract buyer email
  let buyerEmail =
    txn?.customer?.email ||
    txn?.checkout?.email ||
    txn?.custom_data?.email ||
    txn?.buyer?.email ||
    txn?.billing_address?.email ||
    txn?.email;

  // Fetch from Paddle API if not in payload
  if (!buyerEmail && txn?.customer_id && env.PADDLE_API_KEY) {
    try {
      const custRes = await fetch(`https://api.paddle.com/customers/${txn.customer_id}`, {
        headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` },
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        buyerEmail = custData?.data?.email;
      }
    } catch (e) {
      console.error("Failed to fetch customer:", e.message);
    }
  }

  if (!buyerEmail) {
    return new Response("No email found", { status: 400 });
  }

  // Generate license key and send email
  const licenseKey = await generateLicenseKey(env);
  const emailResult = await sendLicenseEmail(buyerEmail, licenseKey, env);
  if (!emailResult.ok) {
    console.error("Email send failed:", emailResult.error);
    return new Response("Email send failed", { status: 500 });
  }

  // Mark as processed
  await env.CARBON_FACTORS.put(markerKey, JSON.stringify({
    licenseKey,
    email: buyerEmail,
    ts: Date.now(),
  }), {
    customMetadata: { licenseKey, email: buyerEmail },
  });

  return Response.json({ status: "ok", email: buyerEmail });
}

async function verifyPaddleSignature(rawBody, header, secret) {
  if (!secret) return { ok: false, debug: { error: "no_secret_configured" } };

  const parts = {};
  for (const seg of header.split(";")) {
    const [k, v] = seg.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return { ok: false, debug: { error: "malformed_header", header } };
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) {
    return { ok: false, debug: { error: "timestamp_expired", ts } };
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${ts}:${rawBody}`));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Accept if computed matches h1
  if (computed === h1) return { ok: true };

  return { ok: false, debug: { expected: h1, computed } };
}

async function generateLicenseKey(env) {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ts = Date.now().toString(16).slice(-8);
  const message = `PRO-${hex}-${ts}`;

  if (env.LICENSE_SECRET) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.LICENSE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const hmac = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 12);
    return `${message}-${hmac}`;
  }
  return message;
}

async function sendLicenseEmail(toEmail, licenseKey, env) {
  const from = env.RESEND_FROM || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: toEmail,
      subject: "Your Carbon Factor Matcher Pro License Key",
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>Thank you for your purchase! 🎉</h2>
        <p>Your <strong>Carbon Factor Matcher Pro</strong> license key:</p>
        <div style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
          <code style="font-size:1.2rem;font-weight:bold;letter-spacing:1px">${licenseKey}</code>
        </div>
        <h3>Quick Setup</h3>
        <pre style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:16px;overflow-x:auto;font-size:0.9rem">{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"],
      "env": {
        "CARBON_FACTOR_LICENSE_KEY": "${licenseKey}"
      }
    }
  }
}</pre>
        <p style="color:#666;font-size:0.85rem;margin-top:24px">Lifetime license — no subscription needed. Reply to this email for support.</p>
      </body></html>`,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
