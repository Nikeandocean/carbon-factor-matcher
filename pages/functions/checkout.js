/**
 * GET /checkout
 * Create Paddle checkout session and redirect
 */

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.PADDLE_PRICE_ID) {
    return new Response("Checkout unavailable.", { status: 500 });
  }

  const res = await fetch("https://api.paddle.com/transactions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ price_id: env.PADDLE_PRICE_ID, quantity: 1 }],
      checkout: {
        success_url: "https://nikeandocean.github.io/carbon-factor-matcher/success.html"
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Paddle API error:", res.status, err);
    return new Response("Failed to create checkout. Please try again.", { status: 502 });
  }

  const data = await res.json();
  const txnId = data?.data?.id;

  if (!txnId) {
    console.error("No transaction ID:", JSON.stringify(data));
    return new Response("Checkout unavailable.", { status: 502 });
  }

  return Response.redirect(
    `https://checkout.paddle.com/checkout/custom/${txnId}`,
    302
  );
}
