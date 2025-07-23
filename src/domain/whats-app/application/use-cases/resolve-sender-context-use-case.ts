import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Employee } from '@/domain/entities/employee'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { FindEmployeeByPhoneUseCase } from './find-employee-by-phone-use-case'
import { FindOrCreateClientUseCase } from './find-or-create-client-use-case'

export type SenderContext =
	| {
			type: 'client'
			company: Company
			client: Client
			employee: Nullable<Employee>
	  }
	| {
			type: 'employee'
			company: Company
			employee: Employee
			client: Nullable<Client>
	  }

export class ResolveSenderContextUseCase {
	constructor(
		private companyRepository: CompanyRepository,
		private findEmployeeByPhoneUseCase: FindEmployeeByPhoneUseCase,
		private findOrCreateClientUseCase: FindOrCreateClientUseCase
	) {}

	async execute(
		fromPhone: string,
		toPhone: string,
		name?: string
	): Promise<SenderContext> {
		const company = await this.companyRepository.findByPhone(toPhone)
		if (!company) {
			throw new Error(`Empresa com número ${toPhone} não encontrada.`)
		}

		const employee = await this.findEmployeeByPhoneUseCase.execute(fromPhone)

		if (employee) {
			return { type: 'employee', company, employee, client: null }
		}

		const client = await this.findOrCreateClientUseCase.execute(
			company.id,
			fromPhone,
			name
		)

		if (client) {
			return { type: 'client', company, client, employee: null }
		}

		throw new Error(
			`Remetente ${fromPhone} não encontrado para a empresa ${company.name}`
		)
	}
}
