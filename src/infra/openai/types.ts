import { OpenAI } from 'openai'
import { z, ZodSchema } from 'zod'

/** Item de saída quando o modelo pede uma execução de função */
export const FunctionCallSchema = z.object({
	type: z.literal('function_call'),
	name: z.string().min(1),
	arguments: z.string().default('{}'),
	call_id: z.string().min(1),
	// `id` pode existir em alguns eventos/streams; tornamos opcional
	id: z.string().optional(),
})
export type FunctionCallItem = z.infer<typeof FunctionCallSchema>

/** Item de entrada para devolver o resultado da função */
export const FunctionCallOutputSchema = z.object({
	type: z.literal('function_call_output'),
	call_id: z.string().min(1),
	output: z.string(),
})
export type FunctionCallOutputItem = z.infer<typeof FunctionCallOutputSchema>

/** Tipos do SDK */
export type Tool = OpenAI.Responses.Tool
export type FunctionTool = OpenAI.Responses.FunctionTool
export type Response = OpenAI.Responses.Response
export type ResponseInput = OpenAI.Responses.ResponseInput | string
export type OutputItem = OpenAI.Responses.ResponseOutputItem

/** Registry de funções com schema -> inferência de tipos correta */
export type FunctionRegistryEntry<S extends ZodSchema<any> = ZodSchema<any>> = {
	schema: S
	fn: (args: z.infer<S>) => Promise<string | unknown>
}
export type FunctionRegistry = Record<string, FunctionRegistryEntry>
