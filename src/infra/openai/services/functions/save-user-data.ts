import { z } from 'zod'
import { FunctionTool } from '../../types'

export const saveUserDataArgsSchema = z
	.object({
		nome: z.string().min(1, 'nome obrigatório').trim(),
		email: z
			.string()
			.email('email inválido')
			.transform(v => v.trim().toLowerCase()),
		profissao: z.string().min(2, 'profissão obrigatória').trim(),
	})
	.strict()

export const saveUserDataTool: FunctionTool = {
	name: 'saveUserData',
	description:
		'Armazena os dados fornecidos pelo cliente para continuar o atendimento.',
	type: 'function',
	strict: true,
	parameters: {
		type: 'object',
		properties: {
			nome: { type: 'string' },
			email: { type: 'string' },
			profissao: { type: 'string' },
		},
		required: ['nome', 'email', 'profissao'],
		additionalProperties: false,
	},
}

export async function saveUserDataFn(
	args: z.infer<typeof saveUserDataArgsSchema>
): Promise<string> {
	const { nome, email, profissao } = saveUserDataArgsSchema.parse(args)
	console.log('save this in our database:', {
		nome,
		email,
		profissao,
	})

	return JSON.stringify({
		status: 'ok',
		saved: true,
		data: { nome, email, profissao },
	})
}
