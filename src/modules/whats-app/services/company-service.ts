import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { Company, CreateCompanyInput } from '@/entities/company'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { CompanyMapper } from '@/infra/database/mappers/company-mapper'
import { prisma } from '@/lib/prisma'

export class CompanyService {
	// constructor() {}

	async createCompany(data: CreateCompanyInput) {
		const company = Company.create(data)

		await prisma.company.create({
			data: {
				id: company.id,
				name: company.name,
				email: company.email,
				website: company.website,
				description: company.description,
				cnpj: company.cnpj,
				phone: company.phone,
				managerId: company.managerId,
				businessHours: {
					createMany: {
						data: company.businessHours.getDays().map(day => {
							const { weekDay, openTime, closeTime } = day

							return {
								day: weekDay,
								openTime,
								closeTime,
							}
						}),
					},
				},
			},
		})
		await prisma.manager.update({
			where: { id: company.managerId },
			data: { companyId: company.id },
		})
	}

	async save(company: Company) {
		await prisma.company.update({
			where: { id: company.id },
			data: {
				name: company.name,
				email: company.email,
				website: company.website,
				description: company.description,
				cnpj: company.cnpj,
				phone: company.phone,
			},
		})
	}

	async getByPhone(companyPhone: string): Promise<Nullable<Company>>
	async getByPhone(
		companyPhone: string,
		config: NotNullConfig
	): Promise<Company>
	async getByPhone(companyPhone: string, config?: NotNullParams) {
		const model = await prisma.company.findFirst({
			where: { phone: companyPhone },
			include: { businessHours: true },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Company not found')
			}

			return null
		}

		return CompanyMapper.toEntity(model)
	}

	async getCompany(id: string): Promise<Nullable<Company>>
	async getCompany(id: string, config: NotNullConfig): Promise<Company>
	async getCompany(id: string, config?: NotNullParams) {
		const model = await prisma.company.findFirst({
			where: { id },
			include: { businessHours: true },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Company not found')
			}

			return null
		}

		return CompanyMapper.toEntity(model)
	}

	async getCompanyByManagerId(managerId: string): Promise<Nullable<Company>>
	async getCompanyByManagerId(
		managerId: string,
		config: NotNullConfig
	): Promise<Company>
	async getCompanyByManagerId(managerId: string, config?: NotNullParams) {
		const model = await prisma.company.findFirst({
			where: { managerId },
			include: { businessHours: true },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Company not found')
			}

			return null
		}

		return CompanyMapper.toEntity(model)
	}

	async getCompanyByCNPJ(cnpj: string): Promise<Nullable<Company>>
	async getCompanyByCNPJ(cnpj: string, config: NotNullConfig): Promise<Company>
	async getCompanyByCNPJ(cnpj: string, config?: NotNullParams) {
		const model = await prisma.company.findFirst({
			where: { cnpj },
			include: { businessHours: true },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Company not found')
			}

			return null
		}

		return CompanyMapper.toEntity(model)
	}
}
