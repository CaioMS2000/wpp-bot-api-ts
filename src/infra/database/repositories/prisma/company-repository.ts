import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { prisma } from '@/lib/prisma'
import { CompanyMapper } from '../../mappers/company-mapper'
import { ManagerMapper } from '../../mappers/manager-mapper'

export class PrismaCompanyRepository extends CompanyRepository {
	async save(company: Company): Promise<void> {
		const data = CompanyMapper.toModel(company)
		const businessHours = CompanyMapper.businessHoursToModel(company)

		await prisma.$transaction(async tx => {
			// Garante que o manager existe
			const manager = await tx.manager.findUniqueOrThrow({
				where: { id: company.managerId },
			})

			// Cria a empresa (ou atualiza)
			const existingCompany = await tx.company.findUnique({
				where: { cnpj: company.cnpj },
			})
			let companyId: string

			if (existingCompany) {
				await tx.company.update({
					where: { id: existingCompany.id },
					data: {
						name: data.name,
						email: data.email,
						website: data.website,
						description: data.description,
						phone: data.phone,
					},
				})
				companyId = existingCompany.id
			} else {
				const created = await tx.company.create({
					data: {
						id: company.id,
						name: data.name,
						email: data.email,
						website: data.website,
						description: data.description,
						cnpj: data.cnpj,
						phone: data.phone,
						managerId: company.managerId,
					},
				})
				companyId = created.id
			}

			// Atualiza o manager agora com companyId, depois da company ter sido criada
			await tx.manager.update({
				where: { id: manager.id },
				data: { companyId },
			})

			// Remove horários antigos
			await tx.businessHour.deleteMany({ where: { companyId } })

			// Insere os horários novos
			await tx.businessHour.createMany({ data: businessHours })
		})
	}

	async find(id: string): Promise<Nullable<Company>> {
		const raw = await prisma.company.findUnique({
			where: { id },
			include: {
				manager: true,
				businessHours: true,
			},
		})

		if (!raw) return null

		const manager = await prisma.manager.findUniqueOrThrow({
			where: { id: raw.managerId },
		})
		const company = CompanyMapper.toEntity(raw)
		company.manager = ManagerMapper.toEntity(manager)

		return company
	}

	async findOrThrow(id: string): Promise<Company> {
		const company = await this.find(id)
		if (!company) {
			throw new Error(`Company with id ${id} not found`)
		}
		return company
	}

	async findByPhone(phone: string): Promise<Nullable<Company>> {
		const raw = await prisma.company.findUnique({
			where: { phone },
			include: {
				manager: true,
				businessHours: true,
			},
		})

		if (!raw) return null

		const company = CompanyMapper.toEntity(raw)

		return company
	}

	async findByCNPJ(cnpj: string): Promise<Nullable<Company>> {
		const raw = await prisma.company.findUnique({
			where: { cnpj },
			include: {
				manager: true,
				businessHours: true,
			},
		})

		if (!raw) return null

		const company = CompanyMapper.toEntity(raw)

		return company
	}

	async findByManagerId(managerId: string): Promise<Nullable<Company>> {
		const raw = await prisma.company.findUnique({
			where: { managerId },
			include: {
				manager: true,
				businessHours: true,
			},
		})

		if (!raw) return null

		const company = CompanyMapper.toEntity(raw)

		return company
	}
}
