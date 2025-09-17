import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function resolveTenantId(): Promise<string> {
	// No env-based resolution: rely on default known identifiers

	// Backward-compat: try a sensible default, interpreting the legacy default as CNPJ/phone
	const legacy = '556236266103'
	const byCnpj = await prisma.tenant.findUnique({
		where: { cnpj: legacy },
		select: { id: true },
	})
	if (byCnpj?.id) return byCnpj.id
	const byPhone = await prisma.tenant.findUnique({
		where: { phone: legacy },
		select: { id: true },
	})
	if (byPhone?.id) return byPhone.id

	// Create default tenant if none resolved
	const businessHoursJson: Prisma.InputJsonValue = {
		fri: { open: 480, close: 1080 },
		mon: { open: 480, close: 1080 },
		sat: { open: 420, close: 720 },
		sun: { open: 0, close: 0 },
		thu: { open: 480, close: 1080 },
		tue: { open: 480, close: 1080 },
		wed: { open: 480, close: 1080 },
	}

	const defaultData = {
		// ignore auto-generated: id, createdAt, updatedAt
		cnpj: '99999999999999',
		phone: '556236266103',
		name: 'Evolight',
		site: 'https://evolight.com.br',
		email: 'contato@evolight.com.br',
		description: 'Líder em soluções de energia renovável.',
		businessHours: businessHoursJson,
		aiTokenApi: null,
		metaTokenApi: null,
	}
	// If already exists with default cnpj/phone, return it
	const existing = await prisma.tenant.findFirst({
		where: { OR: [{ cnpj: defaultData.cnpj }, { phone: defaultData.phone }] },
		select: { id: true },
	})
	if (existing?.id) return existing.id
	const created = await prisma.tenant.create({
		data: defaultData,
		select: { id: true },
	})
	console.log('[seed] Created default tenant', { id: created.id })
	return created.id
}

async function run() {
	const tenantId = await resolveTenantId()

	// Upsert categories
	const categories = [
		{
			name: 'Geral',
			entries: [
				{
					question: 'Quais horários de atendimento?',
					answer: 'Seg a Sex, 9h às 18h.',
				},
				{ question: 'Onde fica a empresa?', answer: 'São Paulo, SP.' },
			],
		},
		{
			name: 'Pagamentos',
			entries: [
				{
					question: 'Quais formas de pagamento?',
					answer: 'Cartão, boleto e Pix.',
				},
				{ question: 'Posso parcelar?', answer: 'Sim, em até 12x.' },
			],
		},
	]

	for (const cat of categories) {
		const created = await prisma.faqCategory.upsert({
			where: { tenantId_name: { tenantId, name: cat.name } },
			update: {},
			create: { tenantId, name: cat.name },
		})

		for (const e of cat.entries) {
			// Evita violar unique em question: verifica antes de criar
			const existing = await prisma.faqEntry.findUnique({
				where: { question: e.question },
				select: { id: true },
			})
			if (!existing?.id) {
				await prisma.faqEntry.create({
					data: {
						question: e.question,
						answer: e.answer,
						categoryId: created.id,
					},
				})
			}
		}
	}

	// Seed departments
	const departments = ['Comercial', 'Suporte', 'Financeiro']
	for (const name of departments) {
		await prisma.department.upsert({
			where: { tenantId_name: { tenantId, name } },
			update: {},
			create: { tenantId, name },
		})
	}

	// Seed employees
	const employees = [
		{ name: 'Alice', phone: '556292476996', departmentName: 'Suporte' },
		{ name: 'Bruno', phone: '5511999990002', departmentName: 'Comercial' },
		{ name: 'Carla', phone: '5511999990003', departmentName: null }, // sem depto
	]

	for (const emp of employees) {
		let departmentId: string | undefined
		if (emp.departmentName) {
			const dept = await prisma.department.findUnique({
				where: { tenantId_name: { tenantId, name: emp.departmentName } },
				select: { id: true },
			})
			departmentId = dept?.id ?? undefined
		}

		await prisma.employee.upsert({
			where: { tenantId_phone: { tenantId, phone: emp.phone } },
			update: { name: emp.name, departmentId },
			create: { tenantId, name: emp.name, phone: emp.phone, departmentId },
		})
	}
}

run()
	.then(() => {
		console.log('Seed concluído')
	})
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
