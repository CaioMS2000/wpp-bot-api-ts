import { Customer, CustomerRepository } from '@/repository/CustomerRepository'
import { PrismaClient } from '@prisma/client'

export class PrismaCustomerRepository implements CustomerRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async upsert(
		tenantId: string,
		phone: string,
		name?: string | null,
		email?: string | null,
		profession?: string | null
	): Promise<Customer> {
		const row = await this.prisma.customer.upsert({
			where: { tenantId_phone: { tenantId, phone } },
			update: {
				name: name ?? undefined,
				email: email ?? undefined,
				profession: profession ?? undefined,
			},
			create: {
				tenantId,
				phone,
				name: name ?? `Client-${phone}`,
				email: email ?? undefined,
				profession: profession ?? undefined,
			},
			select: {
				tenantId: true,
				phone: true,
				name: true,
				email: true,
				profession: true,
			},
		})
		return { ...row, name: row.name ?? '' }
	}

	async findByPhones(
		tenantId: string,
		phones: string[]
	): Promise<
		Array<{
			phone: string
			name: string
			email: string | null
			profession: string | null
		}>
	> {
		if (!phones.length) return []
		const unique = Array.from(new Set(phones)).filter(Boolean)
		if (!unique.length) return []
		const rows = await this.prisma.customer.findMany({
			where: { tenantId, phone: { in: unique } },
			select: { phone: true, name: true, email: true, profession: true },
		})
		return rows.map(r => ({
			phone: r.phone,
			name: r.name ?? '',
			email: r.email ?? null,
			profession: r.profession ?? null,
		}))
	}
}
