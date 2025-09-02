type Usage = { input_tokens?: number; output_tokens?: number }

const clamp = (n: number, min: number, max: number) =>
	Math.max(min, Math.min(max, n))

export class TokenBudgetManager {
	// por conversa (ou por tenant, se preferir)
	private stats = new Map<
		string,
		{ inputEMA: number; outputEMA: number; last: number }
	>()

	constructor(
		private readonly alpha = 0.3, // quão rápido reage ao novo uso
		private readonly defaults = { input: 2800, output: 500 }, // fallback
		private readonly caps = {
			input: { min: 1200, max: 6000 },
			output: { min: 300, max: 1200 },
		}
	) {}

	update(key: string, usage: Usage) {
		const prev = this.stats.get(key) ?? {
			inputEMA: this.defaults.input,
			outputEMA: this.defaults.output,
			last: Date.now(),
		}
		const inUse = usage.input_tokens ?? prev.inputEMA
		const outUse = usage.output_tokens ?? prev.outputEMA
		const a = this.alpha

		const inputEMA = a * inUse + (1 - a) * prev.inputEMA
		const outputEMA = a * outUse + (1 - a) * prev.outputEMA

		this.stats.set(key, { inputEMA, outputEMA, last: Date.now() })
	}

	getLimits(key: string) {
		const s = this.stats.get(key)
		const baseIn = s?.inputEMA ?? this.defaults.input
		const baseOut = s?.outputEMA ?? this.defaults.output

		// reserva “folga” acima da média observada
		const inputLimit = clamp(
			Math.round(baseIn * 2.2),
			this.caps.input.min,
			this.caps.input.max
		)
		const outputLimit = clamp(
			Math.round(baseOut * 1.6),
			this.caps.output.min,
			this.caps.output.max
		)

		return { inputLimit, outputLimit }
	}
}

// singleton simples (pode persistir em DB depois)
export const tokenBudgetManager = new TokenBudgetManager()
