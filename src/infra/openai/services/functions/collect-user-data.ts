import { OpenAI } from 'openai'
import { z } from 'zod'

type FunctionTool = OpenAI.Responses.FunctionTool

export const saveUserDataTool: FunctionTool = {
	name: 'saveUserData',
	parameters: {
		type: 'object',
		properties: {
			name: { type: 'string' },
			email: { type: 'string' },
		},
		required: ['name', 'email'],
		additionalProperties: false,
	},
	type: 'function',
	description:
		'Armazena os dados fornecidos pelo cliente para continuar o atendimento.',
	strict: true,
}

export const collectUserDataArgsSchema = z.object({
	name: z.string(),
	email: z.string().email(),
})

export async function saveUserDataFn(
	args: z.infer<typeof collectUserDataArgsSchema>
): Promise<string> {
	const { name, email } = args
	console.log('save this in our database:', {
		name,
		email,
	})

	return 'Dados salvos com sucesso'
}
