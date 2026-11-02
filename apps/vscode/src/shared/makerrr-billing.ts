export type MakerrrRegion = "za" | "ng" | "ke"
export type MakerrrPlanId = "free" | "developer" | "pro" | "pro-plus" | "teams"
export type MakerrrRail = "stripe" | "link" | "paystack" | "flutterwave" | "paypal" | "payfast" | "yoco" | "ozow"

export type MakerrrPlan = {
	id: MakerrrPlanId
	name: string
	amounts: Record<MakerrrRegion, number> | null
	perUser: boolean
	cloud: boolean
	parallel: number
	tab: boolean
	review: boolean
}

export const MAKERRR_PLANS: MakerrrPlan[] = [
	{ id: "free", name: "Free", amounts: { za: 0, ng: 0, ke: 0 }, perUser: false, cloud: false, parallel: 1, tab: false, review: false },
	{ id: "developer", name: "Developer", amounts: { za: 99, ng: 2500, ke: 250 }, perUser: false, cloud: false, parallel: 1, tab: true, review: false },
	{ id: "pro", name: "Pro", amounts: { za: 199, ng: 7500, ke: 699 }, perUser: false, cloud: true, parallel: 2, tab: true, review: true },
	{ id: "pro-plus", name: "Pro Plus", amounts: { za: 399, ng: 14900, ke: 1399 }, perUser: false, cloud: true, parallel: 4, tab: true, review: true },
	{ id: "teams", name: "Teams", amounts: { za: 299, ng: 11900, ke: 1099 }, perUser: true, cloud: true, parallel: 4, tab: true, review: true },
]

export const MAKERRR_RAILS: { id: MakerrrRail; label: string; regions: MakerrrRegion[]; note: string }[] = [
	{ id: "link", label: "Stripe Link", regions: ["za", "ng", "ke"], note: "Opens Stripe Checkout with Link as the payment method." },
	{ id: "stripe", label: "Stripe", regions: ["za", "ng", "ke"], note: "Cards. Link stays available inside Stripe Checkout." },
	{ id: "paystack", label: "Paystack", regions: ["za", "ng", "ke"], note: "Cards and bank." },
	{ id: "flutterwave", label: "Flutterwave", regions: ["za", "ng", "ke"], note: "Cards and bank." },
	{ id: "paypal", label: "PayPal", regions: ["za"], note: "Rand only." },
	{ id: "payfast", label: "PayFast", regions: ["za"], note: "South African cards and instant EFT." },
	{ id: "yoco", label: "Yoco", regions: ["za"], note: "South African cards." },
	{ id: "ozow", label: "Ozow", regions: ["za"], note: "South African instant EFT." },
]

const CURRENCY: Record<MakerrrRegion, string> = { za: "zar", ng: "ngn", ke: "kes" }

export function makerrrPlan(id: string): MakerrrPlan {
	return MAKERRR_PLANS.find((item) => item.id === id) ?? MAKERRR_PLANS[0]
}

export function makerrrMoney(region: MakerrrRegion, amount: number): string {
	const digits = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	if (region === "za") return `R${digits}`
	if (region === "ng") return `₦${digits}`
	return `KES ${digits}`
}

export function makerrrPrice(plan: MakerrrPlan, region: MakerrrRegion): string {
	if (!plan.amounts) return "Custom"
	const amount = plan.amounts[region]
	if (amount === 0) return makerrrMoney(region, 0)
	return `${makerrrMoney(region, amount)}${plan.perUser ? "/user" : "/month"}`
}

export function areaGuide(region: MakerrrRegion): { title: string; body: string } {
	if (region === "za") {
		return {
			title: "How this works in Johannesburg",
			body: "Prices are in rand and exclude VAT. From Gauteng you can pay with Stripe Link, Paystack, Flutterwave, PayPal, PayFast, Yoco, or Ozow. The agent edits files on your machine. Cloud agents run only after Pro or above is confirmed.",
		}
	}
	if (region === "ng") {
		return {
			title: "How this works in Nigeria",
			body: "Prices are in naira. Stripe Link, Paystack, and Flutterwave settle naira. PayPal, PayFast, Yoco, and Ozow do not. The agent still edits files on your machine.",
		}
	}
	return {
		title: "How this works in Kenya",
		body: "Prices are in shillings. Stripe Link, Paystack, and Flutterwave settle shillings. Rand-only rails stay closed. The agent still edits files on your machine.",
	}
}

export type CheckoutQuote =
	| { ok: true; planId: MakerrrPlanId; minor: number; major: number; currency: string; seats: number }
	| { ok: false; error: string }

export function quoteCheckout(input: {
	planId: string
	region: MakerrrRegion
	seats: number
	provider: MakerrrRail
	email: string
}): CheckoutQuote {
	const plan = makerrrPlan(input.planId)
	if (plan.id === "free" || !plan.amounts || plan.amounts[input.region] <= 0) {
		return { ok: false, error: "This plan does not take a card payment." }
	}
	const rail = MAKERRR_RAILS.find((item) => item.id === input.provider)
	if (!rail?.regions.includes(input.region)) return { ok: false, error: `${rail?.label ?? "That rail"} does not settle this currency.` }
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { ok: false, error: "Enter a real email address." }
	const seats = plan.perUser ? Math.min(250, Math.max(1, Math.round(input.seats))) : 1
	const major = plan.amounts[input.region] * seats
	return { ok: true, planId: plan.id, minor: Math.round(major * 100), major, currency: CURRENCY[input.region], seats }
}

export function stripeCheckoutBody(input: {
	planName: string
	currency: string
	minor: number
	email: string
	successUrl: string
	cancelUrl: string
	planId: string
	linkOnly: boolean
}): URLSearchParams {
	const form = new URLSearchParams()
	form.set("mode", "payment")
	form.set("customer_email", input.email)
	form.set("success_url", input.successUrl)
	form.set("cancel_url", input.cancelUrl)
	form.set("line_items[0][quantity]", "1")
	form.set("line_items[0][price_data][currency]", input.currency)
	form.set("line_items[0][price_data][unit_amount]", String(input.minor))
	form.set("line_items[0][price_data][product_data][name]", `Makerrr ${input.planName}`)
	form.set("metadata[planId]", input.planId)
	if (input.linkOnly) form.set("payment_method_types[0]", "link")
	else form.set("automatic_payment_methods[enabled]", "true")
	return form
}
