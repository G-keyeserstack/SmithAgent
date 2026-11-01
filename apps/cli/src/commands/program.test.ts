import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLI_DEFAULT_MAX_CONSECUTIVE_MISTAKES } from "../runtime/defaults";
import { createProgram } from "./program";

describe("root option help text", () => {
	const savedEnv: Record<string, string | undefined> = {};

	beforeAll(() => {
		// Pin the resolver inputs so the Makerrr defaults are deterministic.
		for (const key of ["CLINE_DIR", "CLINE_DATA_DIR", "MAKERRR_DIR", "MAKERRR_DATA_DIR"]) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterAll(() => {
		for (const [key, value] of Object.entries(savedEnv)) {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	});

	it("reports the actual resolver defaults for --config and --data-dir", () => {
		// A wide help width keeps each option description on one line so the
		// full default text can be matched.
		const help = createProgram()
			.configureHelp({ helpWidth: 500 })
			.helpInformation();

		expect(help).toContain("Configuration directory (default: ~/.makerrr)");
		expect(help).toContain(
			"Use isolated local state at this directory path (default: ~/.makerrr/data)",
		);
		expect(createProgram().name()).toBe("makerrr");
	});

	it("reports the --retries default that runs use", () => {
		const help = createProgram()
			.configureHelp({ helpWidth: 500 })
			.helpInformation();

		expect(help).toContain(
			`before exiting (default: ${CLI_DEFAULT_MAX_CONSECUTIVE_MISTAKES})`,
		);
	});

	it("rejects --retries without a count", () => {
		const program = createProgram().configureOutput({ writeErr: () => {} });

		expect(() => program.parse(["--retries"], { from: "user" })).toThrow(
			/argument missing/,
		);
	});
});
