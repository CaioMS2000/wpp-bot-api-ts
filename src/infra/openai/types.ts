import { OpenAI } from 'openai'
import { z } from 'zod'
import { ZodSchema } from 'zod'

export const FunctionCallSchema = z.object({
	type: z.literal('function_call'),
	name: z.string(),
	arguments: z.string(),
	call_id: z.string(),
	id: z.string(),
})

export type Tool = OpenAI.Responses.Tool
export type FunctionTool = OpenAI.Responses.FunctionTool
export type Response = OpenAI.Responses.Response
export type ResponseInput = OpenAI.Responses.ResponseInput | string
export type FunctionRegistry = {
	schema: ZodSchema<any>
	fn: (args: any) => Promise<string>
}
