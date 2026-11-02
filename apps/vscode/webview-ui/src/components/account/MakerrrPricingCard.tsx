import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"
import { PLATFORM_CONFIG } from "@/config/platform.config"
import { MAKERRR_PLANS, MAKERRR_RAILS, areaGuide, makerrrPrice, type MakerrrRegion } from "@shared/makerrr-billing"

const REGIONS: { id: MakerrrRegion; label: string }[] = [
	{ id: "za", label: "South Africa" },
	{ id: "ng", label: "Nigeria" },
	{ id: "ke", label: "Kenya" },
]

export const MakerrrPricingCard = () => {
	const [region, setRegion] = useState<MakerrrRegion>("za")
	const [planId, setPlanId] = useState("pro")
	const [email, setEmail] = useState("")
	const guide = areaGuide(region)
	const rails = MAKERRR_RAILS.filter((item) => (item.id === "stripe" || item.id === "link") && item.regions.includes(region))

	function pay(provider: "stripe" | "link") {
		PLATFORM_CONFIG.postMessage({
			type: "makerrr_checkout",
			makerrr_checkout: { planId, region, provider, email, seats: 1 },
		})
	}

	return (
		<div className="mb-4 flex flex-col gap-2" data-testid="makerrr-pricing-card">
			<p className="m-0 text-base font-semibold">Makerrr plans</p>
			<div className="flex gap-1">
				{REGIONS.map((item) => (
					<VSCodeButton
						appearance={region === item.id ? "primary" : "secondary"}
						key={item.id}
						onClick={() => setRegion(item.id)}>
						{item.label}
					</VSCodeButton>
				))}
			</div>
			<p className="m-0 text-sm font-semibold">{guide.title}</p>
			<p className="m-0 text-xs text-description">{guide.body}</p>
			{MAKERRR_PLANS.filter((item) => item.id !== "free").map((item) => (
				<button
					className="text-left text-sm"
					key={item.id}
					onClick={() => setPlanId(item.id)}
					type="button">
					{planId === item.id ? "● " : "○ "}
					{item.name} · {makerrrPrice(item, region)}
				</button>
			))}
			<VSCodeTextField
				onInput={(event) => setEmail((event.target as HTMLInputElement).value)}
				placeholder="Email for the receipt"
				value={email}
			/>
			<div className="flex gap-2">
				{rails.map((rail) => (
					<VSCodeButton appearance={rail.id === "link" ? "primary" : "secondary"} key={rail.id} onClick={() => pay(rail.id as "stripe" | "link")}>
						{rail.label}
					</VSCodeButton>
				))}
			</div>
		</div>
	)
}
