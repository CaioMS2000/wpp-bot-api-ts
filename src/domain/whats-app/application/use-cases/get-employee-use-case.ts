import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class GetEmployeeUseCase {
	constructor(private employeeRepository: EmployeeRepository) {}

	async execute(companyId: string, employeeId: string) {
		return this.employeeRepository.findOrThrow(companyId, employeeId)
	}
}
