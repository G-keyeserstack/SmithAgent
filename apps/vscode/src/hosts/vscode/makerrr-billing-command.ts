import * as vscode from "vscode"
import type { MakerrrRail, MakerrrRegion } from "../../shared/makerrr-billing"
import { MAKERRR_PLANS, MAKERRR_RAILS, areaGuide } from "../../shared/makerrr-billing"
import { startMakerrrCheckout } from "../../services/makerrr-billing/checkout"

export function registerMakerrrBilling(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand("makerrr.openCheckout", async () => {
			const region = (await vscode.window.showQuickPick(
				[
					{ label: "South Africa", description: "Johannesburg · rand", id: "za" as const },
					{ label: "Nigeria", description: "naira", id: "ng" as const },
					{ label: "Kenya", description: "shillings", id: "ke" as const },
				],
				{ placeHolder: "Where should the price be settled?" },
			)) as { id: MakerrrRegion } | undefined
			if (!region) return
			void vscode.window.showInformationMessage(areaGuide(region.id).body)
			const plan = await vscode.window.showQuickPick(
				MAKERRR_PLANS.filter((item) => item.id !== "free").map((item) => ({ label: item.name, id: item.id })),
				{ placeHolder: "Plan" },
			)
			if (!plan) return
			const rail = await vscode.window.showQuickPick(
				MAKERRR_RAILS.filter((item) => item.regions.includes(region.id) && (item.id === "stripe" || item.id === "link")).map(
					(item) => ({ label: item.label, description: item.note, id: item.id }),
				),
				{ placeHolder: "Payment rail" },
			)
			if (!rail) return
			const email = await vscode.window.showInputBox({ prompt: "Email for the receipt", ignoreFocusOut: true })
			if (!email) return
			const result = await startMakerrrCheckout({
				planId: plan.id,
				region: region.id,
				seats: 1,
				provider: rail.id as MakerrrRail,
				email,
				origin: "https://github.com/G-keyeserstack/SmithAgent",
			})
			if ("url" in result) await vscode.env.openExternal(vscode.Uri.parse(result.url))
			else void vscode.window.showErrorMessage(result.error)
		}),
	)
}
