import { createServerFn } from "@tanstack/react-start";
import { planById, type PlanId, type Region } from "@/lib/plans";

export type PayProvider = "stripe" | "paystack";

type CheckoutInput = {
  planId: string;
  region: Region;
  seats: number;
  provider: PayProvider;
  email: string;
  origin: string;
};

type CheckoutResult = { url: string } | { error: string };

const CURRENCY: Record<Region, string> = { za: "zar", ng: "ngn", ke: "kes" };

function charge(input: CheckoutInput):
  | { ok: true; planId: PlanId; name: string; perUser: boolean; seats: number; minor: number; email: string; origin: string; currency: string }
  | { ok: false; error: string } {
  const plan = planById(input.planId);
  if (!plan.amounts || plan.id === "free" || plan.id !== input.planId) return { ok: false, error: "This plan does not take a card payment." };
  const seats = plan.perUser ? Math.min(250, Math.max(1, Math.round(input.seats))) : 1;
  const major = plan.amounts[input.region] * seats;
  if (!Number.isFinite(major) || major <= 0) return { ok: false, error: "This price is quoted, not charged here." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a real email address." };
  let origin = "";
  try {
    const url = new URL(input.origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad");
    origin = url.origin;
  } catch {
    return { ok: false, error: "The return address is not valid." };
  }
  return {
    ok: true,
    planId: plan.id,
    name: plan.name,
    perUser: Boolean(plan.perUser),
    seats,
    minor: Math.round(major * 100),
    email,
    origin,
    currency: CURRENCY[input.region],
  };
}

export const startCheckout = createServerFn({ method: "POST" })
  .validator((input: CheckoutInput) => input)
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const priced = charge(data);
    if (!priced.ok) return { error: priced.error };
    const label = `${priced.name}${priced.perUser ? ` · ${priced.seats} seats` : ""}`;
    if (data.provider === "paystack") {
      const key = process.env.PAYSTACK_SECRET_KEY?.trim();
      if (!key) return { error: "Paystack is not configured. Set PAYSTACK_SECRET_KEY on the server." };
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: priced.email,
          amount: priced.minor,
          currency: priced.currency.toUpperCase(),
          callback_url: `${priced.origin}/checkout?provider=paystack&plan=${priced.planId}`,
          metadata: { planId: priced.planId, seats: priced.seats, region: data.region },
        }),
      });
      const body = (await response.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string } };
      if (!response.ok || !body.data?.authorization_url) {
        return { error: body.message || "Paystack did not start the payment." };
      }
      return { url: body.data.authorization_url };
    }
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY on the server." };
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("customer_email", priced.email);
    form.set("success_url", `${priced.origin}/checkout?provider=stripe&plan=${priced.planId}&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${priced.origin}/pricing?cancelled=1`);
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", priced.currency);
    form.set("line_items[0][price_data][unit_amount]", String(priced.minor));
    form.set("line_items[0][price_data][product_data][name]", `Makerrr ${label}`);
    form.set("metadata[planId]", priced.planId);
    form.set("metadata[seats]", String(priced.seats));
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const body = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !body.url) return { error: body.error?.message || "Stripe did not start the payment." };
    return { url: body.url };
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .validator((input: { provider: PayProvider; planId: string; sessionId?: string; reference?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; planId: PlanId } | { ok: false; error: string }> => {
    const plan = planById(data.planId);
    if (!plan.amounts) return { ok: false, error: "That plan is not a paid plan." };
    if (data.provider === "paystack") {
      const key = process.env.PAYSTACK_SECRET_KEY?.trim();
      const reference = data.reference?.trim();
      if (!key || !reference) return { ok: false, error: "Paystack did not return a reference." };
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const body = (await response.json()) as { data?: { status?: string; metadata?: { planId?: string } } };
      if (body.data?.status !== "success") return { ok: false, error: "Paystack has not marked this payment successful." };
      const paidPlan = body.data.metadata?.planId || plan.id;
      return { ok: true, planId: planById(paidPlan).id };
    }
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    const sessionId = data.sessionId?.trim();
    if (!key || !sessionId) return { ok: false, error: "Stripe did not return a session." };
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body = (await response.json()) as { payment_status?: string; metadata?: { planId?: string } };
    if (body.payment_status !== "paid") return { ok: false, error: "Stripe has not marked this payment paid." };
    return { ok: true, planId: planById(body.metadata?.planId || plan.id).id };
  });
