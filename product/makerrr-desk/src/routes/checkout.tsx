import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { confirmCheckout, type PayProvider } from "@/lib/billing";
import { useAgent } from "@/lib/agent-store";
import { planById } from "@/lib/plans";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    provider: (["stripe", "link", "paystack", "paypal", "flutterwave", "payfast", "yoco", "ozow"].includes(String(search.provider))
      ? search.provider
      : "stripe") as PayProvider,
    plan: typeof search.plan === "string" ? search.plan : "",
    session_id: typeof search.session_id === "string" ? search.session_id : "",
    reference: typeof search.reference === "string" ? search.reference : typeof search.token === "string" ? search.token : "",
    tx_ref: typeof search.tx_ref === "string" ? search.tx_ref : "",
    token: typeof search.token === "string" ? search.token : "",
    checkoutId: typeof search.checkoutId === "string" ? search.checkoutId : typeof search.id === "string" ? search.id : "",
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = Route.useSearch();
  const setPlan = useAgent((state) => state.setPlan);
  const [message, setMessage] = useState("Checking the payment…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let live = true;
    confirmCheckout({
      data: {
        provider: search.provider,
        planId: search.plan,
        sessionId: search.session_id,
        reference: search.reference,
        txRef: search.tx_ref,
        token: search.token,
        checkoutId: search.checkoutId,
      },
    }).then((result) => {
      if (!live) return;
      if (result.ok) {
        setPlan(result.planId);
        setOk(true);
        setMessage(`${planById(result.planId).name} is now the plan on this desk.`);
      } else {
        setMessage(result.error);
      }
    });
    return () => {
      live = false;
    };
  }, [search.checkoutId, search.plan, search.provider, search.reference, search.session_id, search.token, search.tx_ref, setPlan]);

  return (
    <SiteFrame>
      <main className="mx-auto max-w-xl px-4 py-20">
        <h1 className="text-4xl font-medium tracking-tight">{ok ? "Payment received" : "Payment"}</h1>
        <p className="mt-4 text-sm leading-6 text-mute">{message}</p>
        <Link to="/pricing" className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm text-bone">
          Back to pricing
        </Link>
      </main>
    </SiteFrame>
  );
}
