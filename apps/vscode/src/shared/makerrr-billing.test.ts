import { describe, expect, it } from "vitest"
import { areaGuide, makerrrPrice, quoteCheckout, stripeCheckoutBody } from "./makerrr-billing"

describe("makerrr billing", () => {
	it("prices the public list in rand, naira, and shillings", () => {
		expect(makerrrPrice({ id: "developer", name: "Developer", amounts: { za: 99, ng: 2500, ke: 250 }, perUser: false, cloud: false, parallel: 1, tab: true, review: false }, "za")).toBe("R99/month")
		expect(makerrrPrice({ id: "developer", name: "Developer", amounts: { za: 99, ng: 2500, ke: 250 }, perUser: false, cloud: false, parallel: 1, tab: true, review: false }, "ng")).toBe("₦2,500/month")
		expect(makerrrPrice({ id: "teams", name: "Teams", amounts: { za: 299, ng: 11900, ke: 1099 }, perUser: true, cloud: true, parallel: 4, tab: true, review: true }, "za")).toBe("R299/user")
	})

	it("describes Johannesburg when the region is South Africa", () => {
		expect(areaGuide("za").title).toBe("How this works in Johannesburg")
	})

	it("asks Stripe for Link only when the rail is Stripe Link", () => {
		const body = stripeCheckoutBody({
			planName: "Pro",
			currency: "zar",
			minor: 19900,
			email: "ada@example.com",
			successUrl: "https://makerrr.test/ok",
			cancelUrl: "https://makerrr.test/cancel",
			planId: "pro",
			linkOnly: true,
		})
		expect(body.get("payment_method_types[0]")).toBe("link")
		expect(body.get("automatic_payment_methods[enabled]")).toBeNull()
		expect(body.get("line_items[0][price_data][unit_amount]")).toBe("19900")
	})

	it("refuses PayPal for naira", () => {
		const quote = quoteCheckout({ planId: "pro", region: "ng", seats: 1, provider: "paypal", email: "ada@example.com" })
		expect(quote.ok).toBe(false)
	})
})
