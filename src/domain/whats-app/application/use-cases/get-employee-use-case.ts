import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class GetEmployeeUseCase {
	constructor(private employeeRepository: EmployeeRepository) {}

	async execute(employeeId: string) {
		return this.employeeRepository.findOrThrow(employeeId)
	}
}
