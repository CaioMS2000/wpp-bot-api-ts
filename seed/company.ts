import { Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

export async function seedCompanyAndManager(prisma: Prisma.TransactionClient) {
	const email = 'manager@evolight.com'
	const CNPJ = '99999999999999'
	const manager = await prisma.manager.upsert({
		where: { email },
		update: {},
		create: {
			name: 'Eugenio Garcia',
			email,
			phone: '5562987654321',
			password: await hash('123456', 6),
		},
	})

	const company = await prisma.company.upsert({
		where: { cnpj: CNPJ },
		update: {},
		create: {
			name: 'Evolight',
			phone: '556236266103',
			cnpj: CNPJ,
			email: 'contato@evolight.com.br',
			website: 'https://evolight.com.br',
			description: 'Líder em soluções de energia renovável.',
			manager: { connect: { id: manager.id } },
		},
	})

	await prisma.manager.update({
		where: { id: manager.id },
		data: { companyId: company.id },
	})
}
