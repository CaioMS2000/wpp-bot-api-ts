import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { CreateEmployeeType } from '../@types'

export class CreateEmployeeUseCase {
	constructor(private readonly employeeRepository: EmployeeRepository) {}

	async execute(data: CreateEmployeeType) {
		const employee = Employee.create(data)
		await this.employeeRepository.save(employee)
		return employee
	}
}
