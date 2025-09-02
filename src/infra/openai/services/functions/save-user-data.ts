import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { FunctionTool } from '../../types'

export const saveUserDataArgsSchema = z
	.object({
		nome: z.string().min(1, 'nome obrigatório').trim(),
		email: z
			.string()
			.email('email inválido')
			.transform(v => v.trim().toLowerCase()),
		telefone: z.string().min(2, 'telefone obrigatório'),
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
			telefone: { type: 'string' },
		},
		required: ['nome', 'email', 'profissao', 'telefone'],
		additionalProperties: false,
	},
}

export async function saveUserDataFn(
	args: z.infer<typeof saveUserDataArgsSchema>
): Promise<string> {
	const { nome, email, profissao, telefone } =
		saveUserDataArgsSchema.parse(args)
	console.log('\n\nsave this in our database:', {
		telefone,
		nome,
		email,
		profissao,
	})

	await prisma.client.update({
		where: { phone: telefone },
		data: {
			email,
			profession: profissao,
			name: nome,
		},
	})

	return JSON.stringify({
		status: 'ok',
		saved: true,
		data: { nome, email, profissao },
	})
}
