import { Prisma } from '@prisma/client'

export async function seedEmployees(prisma: Prisma.TransactionClient) {
	const company = await prisma.company.findFirstOrThrow()

	const tiDepartment = await prisma.department.findFirstOrThrow({
		where: {
			name: 'Tecnologia da Informação',
			companyId: company.id,
		},
	})

	await prisma.employee.upsert({
		where: { phone: '556292476996' },
		create: {
			name: 'Caio M. Silva',
			phone: '556292476996',
			departmentId: tiDepartment.id,
			companyId: company.id,
		},
		update: {},
	})
}
