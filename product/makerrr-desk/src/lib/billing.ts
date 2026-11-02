import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { planById, type PlanId, type Region } from "@/lib/plans";

export type PayProvider = "stripe" | "paystack" | "paypal" | "flutterwave" | "payfast" | "yoco" | "ozow";

export const RAILS: { id: PayProvider; label: string; regions: Region[]; note: string }[] = [
  { id: "stripe", label: "Stripe", regions: ["za", "ng", "ke"], note: "Cards and Link." },
  { id: "paystack", label: "Paystack", regions: ["za", "ng", "ke"], note: "Cards and bank in Nigeria, South Africa, and Kenya." },
  { id: "flutterwave", label: "Flutterwave", regions: ["za", "ng", "ke"], note: "Cards and bank across Nigeria, South Africa, and Kenya." },
  { id: "paypal", label: "PayPal", regions: ["za"], note: "South African rand only." },
  { id: "payfast", label: "PayFast", regions: ["za"], note: "South African cards and instant EFT." },
  { id: "yoco", label: "Yoco", regions: ["za"], note: "South African cards." },
  { id: "ozow", label: "Ozow", regions: ["za"], note: "South African instant EFT." },
];

type CheckoutInput = {
  planId: string;
  region: Region;
  seats: number;
  provider: PayProvider;
  email: string;
  origin: string;
};

export type CheckoutResult = { url: string } | { error: string } | { action: string; fields: Record<string, string> };

const CURRENCY: Record<Region, string> = { za: "zar", ng: "ngn", ke: "kes" };

function charge(input: CheckoutInput) {
  const plan = planById(input.planId);
  if (!plan.amounts || plan.id === "free" || plan.id !== input.planId) {
    return { ok: false as const, error: "This plan does not take a card payment." };
  }
  const rail = RAILS.find((item) => item.id === input.provider);
  if (!rail?.regions.includes(input.region)) {
    return { ok: false as const, error: `${rail?.label ?? "That rail"} does not settle this currency. Pick another.` };
  }
  const seats = plan.perUser ? Math.min(250, Math.max(1, Math.round(input.seats))) : 1;
  const major = plan.amounts[input.region] * seats;
  if (!Number.isFinite(major) || major <= 0) return { ok: false as const, error: "This price is quoted, not charged here." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a real email address." };
  let origin = "";
  try {
    const url = new URL(input.origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad");
    origin = url.origin;
  } catch {
    return { ok: false as const, error: "The return address is not valid." };
  }
  return {
    ok: true as const,
    planId: plan.id,
    name: plan.name,
    perUser: Boolean(plan.perUser),
    seats,
    major,
    minor: Math.round(major * 100),
    email,
    origin,
    currency: CURRENCY[input.region],
  };
}

function missing(name: string) {
  return { error: `${name} is not configured on this server.` };
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_SECRET?.trim();
  if (!id || !secret) return null;
  const base = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await response.json()) as { access_token?: string };
  return body.access_token ? { token: body.access_token, base } : null;
}

export const startCheckout = createServerFn({ method: "POST" })
  .validator((input: CheckoutInput) => input)
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const priced = charge(data);
    if (!priced.ok) return { error: priced.error };
    const label = `Makerrr ${priced.name}${priced.perUser ? ` · ${priced.seats} seats` : ""}`;
    const back = `${priced.origin}/checkout?provider=${data.provider}&plan=${priced.planId}`;

    if (data.provider === "stripe") {
      const key = process.env.STRIPE_SECRET_KEY?.trim();
      if (!key) return missing("Stripe");
      const form = new URLSearchParams();
      form.set("mode", "payment");
      form.set("customer_email", priced.email);
      form.set("success_url", `${back}&session_id={CHECKOUT_SESSION_ID}`);
      form.set("cancel_url", `${priced.origin}/pricing?cancelled=1`);
      form.set("automatic_payment_methods[enabled]", "true");
      form.set("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", priced.currency);
      form.set("line_items[0][price_data][unit_amount]", String(priced.minor));
      form.set("line_items[0][price_data][product_data][name]", label);
      form.set("metadata[planId]", priced.planId);
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const body = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!body.url) return { error: body.error?.message || "Stripe did not start the payment." };
      return { url: body.url };
    }

    if (data.provider === "paystack") {
      const key = process.env.PAYSTACK_SECRET_KEY?.trim();
      if (!key) return missing("Paystack");
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: priced.email,
          amount: priced.minor,
          currency: priced.currency.toUpperCase(),
          callback_url: back,
          metadata: { planId: priced.planId, seats: priced.seats },
        }),
      });
      const body = (await response.json()) as { message?: string; data?: { authorization_url?: string } };
      if (!body.data?.authorization_url) return { error: body.message || "Paystack did not start the payment." };
      return { url: body.data.authorization_url };
    }

    if (data.provider === "paypal") {
      const auth = await paypalToken();
      if (!auth) return missing("PayPal");
      const response = await fetch(`${auth.base}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            custom_id: priced.planId,
            amount: { currency_code: "ZAR", value: priced.major.toFixed(2) },
            description: label,
          }],
          application_context: { return_url: back, cancel_url: `${priced.origin}/pricing?cancelled=1`, user_action: "PAY_NOW" },
        }),
      });
      const body = (await response.json()) as { message?: string; links?: { rel: string; href: string }[] };
      const url = body.links?.find((link) => link.rel === "approve")?.href;
      if (!url) return { error: body.message || "PayPal did not start the payment." };
      return { url };
    }

    if (data.provider === "flutterwave") {
      const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
      if (!key) return missing("Flutterwave");
      const txRef = `makerrr-${priced.planId}-${Date.now()}`;
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: priced.major,
          currency: priced.currency.toUpperCase(),
          redirect_url: `${back}&tx_ref=${txRef}`,
          customer: { email: priced.email },
          customizations: { title: label, description: "Makerrr plan" },
          meta: { planId: priced.planId },
        }),
      });
      const body = (await response.json()) as { message?: string; data?: { link?: string } };
      if (!body.data?.link) return { error: body.message || "Flutterwave did not start the payment." };
      return { url: body.data.link };
    }

    if (data.provider === "yoco") {
      const key = process.env.YOCO_SECRET_KEY?.trim();
      if (!key) return missing("Yoco");
      const response = await fetch("https://payments.yoco.com/api/checkouts", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: priced.minor,
          currency: "ZAR",
          successUrl: back,
          cancelUrl: `${priced.origin}/pricing?cancelled=1`,
          metadata: { planId: priced.planId },
        }),
      });
      const body = (await response.json()) as { redirectUrl?: string; id?: string; message?: string };
      if (!body.redirectUrl || !body.id) return { error: body.message || "Yoco did not start the payment." };
      return { url: body.redirectUrl };
    }

    if (data.provider === "ozow") {
      const site = process.env.OZOW_SITE_CODE?.trim();
      const api = process.env.OZOW_API_KEY?.trim();
      const privateKey = process.env.OZOW_PRIVATE_KEY?.trim();
      if (!site || !api || !privateKey) return missing("Ozow");
      const reference = `m${Date.now().toString(36)}`.slice(0, 20);
      const amount = priced.major.toFixed(2);
      const success = `${back}&reference=${reference}`;
      const values = [site, "ZA", "ZAR", amount, reference, reference, `${priced.origin}/pricing?cancelled=1`, `${priced.origin}/pricing?cancelled=1`, success, success, "false"];
      const hash = createHash("sha512").update(`${values.join("")}${privateKey}`.toLowerCase()).digest("hex");
      const response = await fetch("https://api.ozow.com/PostPaymentRequest", {
        method: "POST",
        headers: { ApiKey: api, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          siteCode: site,
          countryCode: "ZA",
          currencyCode: "ZAR",
          amount,
          transactionReference: reference,
          bankReference: reference,
          cancelUrl: values[6],
          errorUrl: values[7],
          successUrl: success,
          notifyUrl: success,
          isTest: false,
          hashCheck: hash,
        }),
      });
      const body = (await response.json()) as { url?: string; errorMessage?: string };
      if (!body.url) return { error: body.errorMessage || "Ozow did not start the payment." };
      return { url: body.url };
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();
    if (!merchantId || !merchantKey) return missing("PayFast");
    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: back,
      cancel_url: `${priced.origin}/pricing?cancelled=1`,
      email_address: priced.email,
      amount: priced.major.toFixed(2),
      item_name: label,
      custom_str1: priced.planId,
    };
    const passphrase = process.env.PAYFAST_PASSPHRASE?.trim();
    const encoded = Object.entries(fields)
      .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
      .join("&");
    const signature = createHash("md5")
      .update(passphrase ? `${encoded}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}` : encoded)
      .digest("hex");
    return {
      action: process.env.PAYFAST_ENV === "sandbox" ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
      fields: { ...fields, signature },
    };
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .validator((input: { provider: PayProvider; planId: string; sessionId?: string; reference?: string; txRef?: string; token?: string; checkoutId?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; planId: PlanId } | { ok: false; error: string }> => {
    const plan = planById(data.planId);
    if (!plan.amounts) return { ok: false, error: "That plan is not a paid plan." };
    if (data.provider === "payfast") {
      return { ok: false, error: "PayFast sent you back. The plan stays unchanged until PayFast confirms the payment. Use Stripe, Paystack, or Flutterwave if you need the plan to switch now." };
    }
    if (data.provider === "paystack") {
      const key = process.env.PAYSTACK_SECRET_KEY?.trim();
      if (!key || !data.reference) return { ok: false, error: "Paystack did not return a reference." };
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, { headers: { Authorization: `Bearer ${key}` } });
      const body = (await response.json()) as { data?: { status?: string; metadata?: { planId?: string } } };
      if (body.data?.status !== "success") return { ok: false, error: "Paystack has not marked this payment successful." };
      return { ok: true, planId: planById(body.data.metadata?.planId || plan.id).id };
    }
    if (data.provider === "paypal") {
      const auth = await paypalToken();
      if (!auth || !data.token) return { ok: false, error: "PayPal did not return an order." };
      const response = await fetch(`${auth.base}/v2/checkout/orders/${encodeURIComponent(data.token)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      });
      const body = (await response.json()) as { status?: string };
      if (body.status !== "COMPLETED") return { ok: false, error: "PayPal has not captured this payment." };
      return { ok: true, planId: plan.id };
    }
    if (data.provider === "flutterwave") {
      const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
      if (!key || !data.txRef) return { ok: false, error: "Flutterwave did not return a reference." };
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(data.txRef)}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const body = (await response.json()) as { data?: { status?: string } };
      if (body.data?.status !== "successful") return { ok: false, error: "Flutterwave has not marked this payment successful." };
      return { ok: true, planId: plan.id };
    }
    if (data.provider === "yoco") {
      const key = process.env.YOCO_SECRET_KEY?.trim();
      if (!key || !data.checkoutId) return { ok: false, error: "Yoco did not return a checkout id." };
      const response = await fetch(`https://payments.yoco.com/api/checkouts/${encodeURIComponent(data.checkoutId)}`, { headers: { Authorization: `Bearer ${key}` } });
      const body = (await response.json()) as { status?: string };
      if (body.status !== "completed") return { ok: false, error: "Yoco has not completed this checkout." };
      return { ok: true, planId: plan.id };
    }
    if (data.provider === "ozow") {
      return { ok: false, error: "Ozow sent you back. The plan stays unchanged until the bank confirms. Use Stripe or Paystack if you need the plan to switch now." };
    }
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key || !data.sessionId) return { ok: false, error: "Stripe did not return a session." };
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`, { headers: { Authorization: `Bearer ${key}` } });
    const body = (await response.json()) as { payment_status?: string; metadata?: { planId?: string } };
    if (body.payment_status !== "paid") return { ok: false, error: "Stripe has not marked this payment paid." };
    return { ok: true, planId: planById(body.metadata?.planId || plan.id).id };
  });
