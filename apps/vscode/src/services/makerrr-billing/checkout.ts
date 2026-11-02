import {
	makerrrPlan,
	quoteCheckout,
	stripeCheckoutBody,
	type MakerrrRail,
	type MakerrrRegion,
} from "../../shared/makerrr-billing"

export type CheckoutStart = { url: string } | { error: string }

export async function startMakerrrCheckout(input: {
	planId: string
	region: MakerrrRegion
	seats: number
	provider: MakerrrRail
	email: string
	origin: string
}): Promise<CheckoutStart> {
	const quote = quoteCheckout(input)
	if (!quote.ok) return { error: quote.error }
	const plan = makerrrPlan(quote.planId)
	if (input.provider !== "stripe" && input.provider !== "link") {
		return { error: "This extension build starts Stripe and Stripe Link. The other rails run on the Makerrr site." }
	}
	const key = process.env.STRIPE_SECRET_KEY?.trim() || process.env.MAKERRR_STRIPE_SECRET_KEY?.trim()
	if (!key) return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the extension host environment." }
	const form = stripeCheckoutBody({
		planName: plan.name,
		currency: quote.currency,
		minor: quote.minor,
		email: input.email.trim(),
		successUrl: `${input.origin}/checkout?provider=${input.provider}&plan=${quote.planId}&session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: `${input.origin}/pricing?cancelled=1`,
		planId: quote.planId,
		linkOnly: input.provider === "link",
	})
	const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
		method: "POST",
		headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
		body: form,
	})
	const body = (await response.json()) as { url?: string; error?: { message?: string } }
	if (!body.url) return { error: body.error?.message || "Stripe did not start the payment." }
	return { url: body.url }
}
