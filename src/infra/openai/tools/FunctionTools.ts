import OpenAI from 'openai'
import { z, ZodTypeAny } from 'zod'

export type ToolContext = {
	tenantId: string
	userPhone: string
	conversationId: string
	role: 'CLIENT' | 'EMPLOYEE'
}

export type FunctionToolSpec<
	TName extends string,
	TSchema extends ZodTypeAny,
	TResult,
> = {
	name: TName
	description?: string
	schema: TSchema
	handler: (
		args: z.infer<TSchema>,
		ctx: ToolContext
	) => Promise<TResult> | TResult
}

export type FunctionToolFactory<
	TName extends string = string,
	TSchema extends ZodTypeAny = ZodTypeAny,
	TResult = unknown,
> = (
	ctx: ToolContext
) =>
	| Promise<FunctionToolSpec<TName, TSchema, TResult>>
	| FunctionToolSpec<TName, TSchema, TResult>

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null

// Minimal Zod -> JSON Schema (subset) converter. Covers object, string, number, boolean, array, enum.
function zodToJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
	const def: any = schema._def
	const typeName: string = def?.typeName
	switch (typeName) {
		case z.ZodFirstPartyTypeKind.ZodObject: {
			const shape = def.shape()
			const properties: Record<string, unknown> = {}
			const required: string[] = []
			for (const [key, child] of Object.entries(shape)) {
				properties[key] = zodToJsonSchema(child as ZodTypeAny)
				const childDef = (child as any)?._def
				const isOptional =
					childDef?.typeName === z.ZodFirstPartyTypeKind.ZodOptional
				if (!isOptional) required.push(key)
			}
			// OpenAI function tool parameters must be a strict object schema
			// i.e., additionalProperties: false needs to be present
			return {
				type: 'object',
				properties,
				required,
				additionalProperties: false,
			}
		}
		case z.ZodFirstPartyTypeKind.ZodString:
			return { type: 'string' }
		case z.ZodFirstPartyTypeKind.ZodNumber:
			return { type: 'number' }
		case z.ZodFirstPartyTypeKind.ZodBoolean:
			return { type: 'boolean' }
		case z.ZodFirstPartyTypeKind.ZodArray: {
			const inner = def.type as ZodTypeAny
			return { type: 'array', items: zodToJsonSchema(inner) }
		}
		case z.ZodFirstPartyTypeKind.ZodEnum:
			return { type: 'string', enum: def.values }
		case z.ZodFirstPartyTypeKind.ZodLiteral: {
			return { const: def.value }
		}
		case z.ZodFirstPartyTypeKind.ZodUnion: {
			const opts: ZodTypeAny[] = def.options
			return { anyOf: opts.map(o => zodToJsonSchema(o)) }
		}
		case z.ZodFirstPartyTypeKind.ZodOptional: {
			const inner = def.innerType as ZodTypeAny
			// Represent optional as union with null implicitly handled by absence in required
			return zodToJsonSchema(inner)
		}
		default:
			// Fallback
			return { type: 'string' }
	}
}

export class FunctionToolRegistry {
	private tools: Array<FunctionToolSpec<any, any, any>> = []
	private factories: Array<FunctionToolFactory<any, any, any>> = []

	add<TName extends string, TSchema extends ZodTypeAny, TResult>(
		spec: FunctionToolSpec<TName, TSchema, TResult>
	): this
	add(factory: FunctionToolFactory): this
	add(arg: any): this {
		if (typeof arg === 'function') {
			this.factories.push(arg as FunctionToolFactory)
		} else if (arg && typeof arg === 'object') {
			this.tools.push(arg as FunctionToolSpec<any, any, any>)
		}
		return this
	}

	list(): Array<FunctionToolSpec<any, any, any>> {
		return [...this.tools]
	}

	toOpenAITools(): OpenAI.Responses.Tool[] {
		const out: OpenAI.Responses.Tool[] = []
		for (const t of this.tools) {
			const params = zodToJsonSchema(t.schema)
			const fn: OpenAI.Responses.FunctionTool = {
				type: 'function',
				name: t.name,
				description: t.description,
				parameters: params,
				strict: true,
			}
			out.push(fn)
		}
		return out
	}

	async buildForContext(ctx: ToolContext): Promise<{
		tools: OpenAI.Responses.Tool[]
		resolved: Map<string, FunctionToolSpec<any, any, any>>
	}> {
		try {
			console.log('[Tools][buildForContext] start', {
				role: ctx.role,
				staticCount: this.tools.length,
				factoryCount: this.factories.length,
			})
		} catch {}
		const resolvedMap = new Map<string, FunctionToolSpec<any, any, any>>()
		const allSpecs: Array<FunctionToolSpec<any, any, any>> = []
		// static first
		for (const t of this.tools) {
			resolvedMap.set(t.name, t)
			allSpecs.push(t)
		}
		// resolve factories
		for (const f of this.factories) {
			try {
				const spec = await f(ctx)
				if (spec && typeof spec === 'object') {
					resolvedMap.set(spec.name, spec)
					allSpecs.push(spec)
				}
			} catch (err) {
				try {
					console.warn('[FunctionToolRegistry] factory resolution failed', err)
				} catch {}
			}
		}
		const tools: OpenAI.Responses.Tool[] = allSpecs.map(s => ({
			type: 'function',
			name: s.name,
			description: s.description,
			parameters: zodToJsonSchema(s.schema),
			strict: true,
		}))
		try {
			console.log('[Tools][buildForContext] done', {
				resolvedCount: allSpecs.length,
			})
		} catch {}
		return { tools, resolved: resolvedMap }
	}

	// Parses tool calls out of a Response object (best-effort), returns callId, name, args
	parseToolCalls(
		root: unknown
	): Array<{ id?: string; name: string; args: unknown }> {
		const calls: Array<{ id?: string; name: string; args: unknown }> = []
		const stack: unknown[] = [root]
		const visited = new Set<unknown>()
		while (stack.length) {
			const cur = stack.pop()
			if (!cur || visited.has(cur)) continue
			visited.add(cur)
			if (Array.isArray(cur)) {
				for (const x of cur) stack.push(x)
				continue
			}
			if (!isRecord(cur)) continue
			// Heuristics for various shapes
			const type = cur['type']
			const name = cur['name']
			const argumentsMaybe = cur['arguments'] ?? cur['input']
			const id = cur['id']
			if (
				(type === 'tool_use' ||
					type === 'tool_call' ||
					(typeof type === 'string' && type.includes('tool')) ||
					typeof name === 'string') &&
				typeof name === 'string' &&
				typeof argumentsMaybe !== 'undefined'
			) {
				calls.push({
					id: typeof id === 'string' ? id : undefined,
					name,
					args: argumentsMaybe,
				})
			}
			for (const v of Object.values(cur))
				if (isRecord(v) || Array.isArray(v)) stack.push(v)
		}
		return calls
	}

	// Validates args with Zod and dispatches to the matching handler
	async dispatchAll(
		calls: Array<{ id?: string; name: string; args: unknown }>,
		ctx: ToolContext,
		resolved?: Map<string, FunctionToolSpec<any, any, any>>
	): Promise<Array<{ id?: string; output: unknown }>> {
		try {
			console.log('[Tools][dispatchAll] start', { count: calls.length })
		} catch {}
		const outputs: Array<{ id?: string; output: unknown }> = []
		for (const call of calls) {
			let tool = resolved?.get(call.name)
			if (!tool) tool = this.tools.find(t => t.name === call.name)
			if (!tool && this.factories.length) {
				// last resort: resolve factories now (avoid if possible)
				for (const f of this.factories) {
					try {
						const spec = await f(ctx)
						if (spec?.name === call.name) {
							tool = spec
							break
						}
					} catch {}
				}
			}
			if (!tool) {
				try {
					console.warn('[Tools][dispatchAll] tool not found', {
						name: call.name,
					})
				} catch {}
				continue
			}
			const parsed = (tool.schema as ZodTypeAny).safeParse(call.args)
			if (!parsed.success) {
				outputs.push({
					id: call.id,
					output: { error: 'invalid_args', details: parsed.error.flatten() },
				})
				try {
					console.warn('[Tools][dispatchAll] invalid_args', { name: tool.name })
				} catch {}
				continue
			}
			try {
				const res = await (
					tool.handler as (
						a: unknown,
						c: ToolContext
					) => Promise<unknown> | unknown
				)(parsed.data, ctx)
				outputs.push({ id: call.id, output: res })
				try {
					console.log('[Tools][dispatchAll] ok', { name: tool.name })
				} catch {}
			} catch (err) {
				outputs.push({
					id: call.id,
					output: {
						error: 'tool_failed',
						message: (err as Error)?.message ?? 'unknown',
					},
				})
				try {
					console.error('[Tools][dispatchAll] tool_failed', {
						name: tool.name,
						err,
					})
				} catch {}
			}
		}
		try {
			console.log('[Tools][dispatchAll] done', { outputsCount: outputs.length })
		} catch {}
		return outputs
	}
}

export function defineFunctionTool<
	TName extends string,
	TSchema extends ZodTypeAny,
	TResult,
>(
	spec: FunctionToolSpec<TName, TSchema, TResult>
): FunctionToolSpec<TName, TSchema, TResult>
export function defineFunctionTool(
	factory: FunctionToolFactory
): FunctionToolFactory
export function defineFunctionTool(arg: any): any {
	return arg
}
