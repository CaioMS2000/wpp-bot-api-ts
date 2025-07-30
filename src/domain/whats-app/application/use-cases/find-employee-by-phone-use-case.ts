import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class FindEmployeeByPhoneUseCase {
	constructor(private employeeRepository: EmployeeRepository) {}

	async execute(companyId: string, phone: string) {
		const employee = await this.employeeRepository.findByPhone(companyId, phone)

		return employee
	}
}
