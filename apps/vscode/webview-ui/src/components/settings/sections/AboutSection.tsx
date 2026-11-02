import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import Section from "../Section"

interface AboutSectionProps {
	version: string
	extensionVariant?: "legacy" | "next"
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const VARIANT_LABELS: Record<"legacy" | "next", string> = {
	legacy: "Legacy",
	next: "Next",
}

const AboutSection = ({ version, extensionVariant, renderSectionHeader }: AboutSectionProps) => {
	return (
		<div>
			{renderSectionHeader("about")}
			<Section>
				<div className="flex px-4 flex-col gap-2">
					<h2 className="text-lg font-semibold">
						Makerrr v{version}
						{extensionVariant && (
							<span className="ml-2 text-sm font-normal text-description">
								({VARIANT_LABELS[extensionVariant]})
							</span>
						)}
					</h2>
					<p>
						Makerrr is a developer-first AI coding agent for your editor, terminal and desktop. It helps plan and
						complete software development tasks while keeping you in control of file changes and terminal commands.
					</p>

					<h3 className="text-md font-semibold">Support</h3>
					<p>
						<VSCodeLink href="https://github.com/G-keyeserstack/SmithAgent/issues">Issues & support</VSCodeLink>
					</p>

					<h3 className="text-md font-semibold">Development</h3>
					<p>
						<VSCodeLink href="https://github.com/G-keyeserstack/SmithAgent">GitHub</VSCodeLink>
						{" • "}
						<VSCodeLink href="https://github.com/G-keyeserstack/SmithAgent/tree/main/docs">
							Documentation source
						</VSCodeLink>
					</p>

					<h3 className="text-md font-semibold">Website</h3>
					<p>
						<VSCodeLink href="https://makerrr.ai/">Makerrr.ai</VSCodeLink>
					</p>

					<p className="text-xs text-description">
						Based on Cline (Apache-2.0).{" "}
						<VSCodeLink href="https://github.com/G-keyeserstack/SmithAgent/blob/main/NOTICE.md">
							Attribution and licence
						</VSCodeLink>
					</p>
				</div>
			</Section>
		</div>
	)
}

export default AboutSection
