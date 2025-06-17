import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class FindEmployeeByPhoneUseCase {
    constructor(private employeeRepository: EmployeeRepository) {}

    async execute(phone: string) {
        const employee = await this.employeeRepository.findByPhone(phone)

        return employee
    }
}
