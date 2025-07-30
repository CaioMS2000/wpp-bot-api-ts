import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { CompanyMapper } from '../../mappers/company-mapper'
import { prisma } from '@/lib/prisma'
import { ManagerMapper } from '../../mappers/manager-mapper'

export class PrismaCompanyRepository extends CompanyRepository {
	async save(company: Company): Promise<void> {
		const data = CompanyMapper.toModel(company)
		const businessHours = CompanyMapper.businessHoursToModel(company)

		await prisma.$transaction(async tx => {
			await tx.company.upsert({
				where: { id: company.id },
				update: data,
				create: {
					...data,
					id: company.id,
				},
			})

			await tx.manager.findUniqueOrThrow({ where: { id: company.managerId } })
			await tx.manager.update({
				where: { id: company.managerId },
				data: {
					companyId: company.id,
				},
			})

			// Atualiza businessHours removendo os antigos e inserindo os novos
			await tx.businessHour.deleteMany({
				where: { companyId: company.id },
			})

			await tx.businessHour.createMany({
				data: businessHours,
			})
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
