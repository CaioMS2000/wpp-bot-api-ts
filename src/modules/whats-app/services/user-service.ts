import { SenderType, User, UserType, UserUnionType } from '@/@types'
import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { Client, CreateClientInput } from '@/entities/client'
import { Company } from '@/entities/company'
import { CreateEmployeeInput, Employee } from '@/entities/employee'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { UserResolutionError } from '@/errors/errors/user-resolution-error'
import { ClientMapper } from '@/infra/database/mappers/client-mapper'
import { EmployeeMapper } from '@/infra/database/mappers/employee-mapper'
import { prisma } from '@/lib/prisma'
import { CompanyService } from './company-service'

export type SenderContext =
	| {
			type: SenderType.CLIENT
			company: Company
			client: Client
			employee: null
	  }
	| {
			type: SenderType.EMPLOYEE
			company: Company
			employee: Employee
			client: null
	  }

type CreateUserClient = { userType: UserType.CLIENT; data: CreateClientInput }
type CreateUserEmployee = {
	userType: UserType.EMPLOYEE
	data: CreateEmployeeInput
}
type CreateUserArgs = CreateUserClient | CreateUserEmployee

export class UserService {
	constructor(private companyService: CompanyService) {}

	async createUser({ userType, data }: CreateUserClient): Promise<Client>
	async createUser({ userType, data }: CreateUserEmployee): Promise<Employee>
	async createUser({ userType, data }: CreateUserArgs) {
		switch (userType) {
			case UserType.CLIENT: {
				const client = Client.create(data)

				await prisma.client.create({
					data: {
						id: client.id,
						name: client.name,
						email: client.email,
						profession: client.profession,
						phone: client.phone,
						companyId: client.companyId,
					},
				})
				return client
			}
			case UserType.EMPLOYEE: {
				const employee = Employee.create(data)

				await prisma.employee.create({
					data: {
						id: employee.id,
						name: employee.name,
						phone: employee.phone,
						departmentId: employee.departmentId,
						companyId: employee.companyId,
					},
				})
				return employee
			}
		}
	}

	async save(data: UserUnionType) {
		const { user, userType } = data

		switch (userType) {
			case UserType.CLIENT: {
				await prisma.client.update({
					where: {
						id: user.id,
						companyId: user.companyId,
					},
					data: {
						phone: user.phone,
						name: user.name,
						email: user.email,
						profession: user.profession,
					},
				})
				break
			}
			case UserType.EMPLOYEE: {
				await prisma.employee.update({
					where: {
						id: user.id,
						companyId: user.companyId,
					},
					data: {
						phone: user.phone,
						name: user.name,
					},
				})
				break
			}
		}
	}

	async resolveUser(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<
		| { user: Extract<User, Client>; type: UserType.CLIENT }
		| { user: Extract<User, Employee>; type: UserType.EMPLOYEE }
	> {
		let user: Nullable<User> = null
		let resolvedUserType: Nullable<UserType> = null

		if (userType === UserType.CLIENT) {
			const existingClient = await this.getClient(companyId, userId)
			user = existingClient
			resolvedUserType = UserType.CLIENT
		} else if (userType === UserType.EMPLOYEE) {
			const existingEmployee = await this.getEmployee(companyId, userId)
			user = existingEmployee
			resolvedUserType = UserType.EMPLOYEE
		}

		if (!user || !resolvedUserType) {
			throw new UserResolutionError('Could not resolve user')
		}

		if (resolvedUserType === UserType.CLIENT && user instanceof Client) {
			return { user, type: resolvedUserType }
		}

		if (resolvedUserType === UserType.EMPLOYEE && user instanceof Employee) {
			return { user, type: resolvedUserType }
		}

		throw new Error()
	}

	async getClient(
		companyId: string,
		clientId: string
	): Promise<Nullable<Client>>
	async getClient(
		companyId: string,
		clientId: string,
		config: NotNullConfig
	): Promise<Client>
	async getClient(companyId: string, clientId: string, config?: NotNullParams) {
		const model = await prisma.client.findFirst({
			where: { companyId, id: clientId },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Client not found')
			}

			return null
		}

		return ClientMapper.toEntity(model)
	}

	async getEmployee(
		companyId: string,
		employeeId: string
	): Promise<Nullable<Employee>>
	async getEmployee(
		companyId: string,
		employeeId: string,
		config: NotNullConfig
	): Promise<Employee>
	async getEmployee(
		companyId: string,
		employeeId: string,
		config?: NotNullParams
	) {
		const model = await prisma.employee.findFirst({
			where: { companyId, id: employeeId },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Employee not found')
			}

			return null
		}

		return EmployeeMapper.toEntity(model)
	}

	async getEmployeeByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Employee>>
	async getEmployeeByPhone(
		companyId: string,
		phone: string,
		config: NotNullConfig
	): Promise<Employee>
	async getEmployeeByPhone(
		companyId: string,
		phone: string,
		config?: NotNullParams
	) {
		const model = await prisma.employee.findFirst({
			where: { companyId, phone },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Employee not found')
			}

			return null
		}

		return EmployeeMapper.toEntity(model)
	}

	async getClientByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Client>>
	async getClientByPhone(
		companyId: string,
		phone: string,
		config: NotNullConfig
	): Promise<Client>
	async getClientByPhone(
		companyId: string,
		phone: string,
		config?: NotNullParams
	) {
		const model = await prisma.client.findFirst({
			where: { companyId, phone },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Client not found')
			}

			return null
		}

		return ClientMapper.toEntity(model)
	}

	async resolveSenderContext(
		fromPhone: string,
		toPhone: string,
		name?: string
	): Promise<SenderContext> {
		try {
			const company = await this.companyService.getByPhone(toPhone, {
				notNull: true,
			})
			const employee = await this.getEmployeeByPhone(company.id, fromPhone)

			if (employee) {
				return { type: SenderType.EMPLOYEE, company, employee, client: null }
			}

			let client = await this.getClientByPhone(company.id, fromPhone)

			if (!client) {
				client = await this.createUser({
					userType: UserType.CLIENT,
					data: {
						companyId: company.id,
						phone: fromPhone,
						...(name ? { name } : {}),
					},
				})
			}

			return { type: SenderType.CLIENT, company, client, employee: null }
		} catch (error) {
			throw new UserResolutionError(
				`Could not resolve any user for phone: ${fromPhone}`
			)
		}
	}

	async getAllEmployeesByCompany(companyId: string) {
		const models = await prisma.employee.findMany({ where: { companyId } })

		return models.map(EmployeeMapper.toEntity)
	}

	async getEmployeeByDepartment(
		companyId: string,
		departmentId: string
	): Promise<Nullable<Employee>>
	async getEmployeeByDepartment(
		companyId: string,
		departmentId: string,
		config: NotNullConfig
	): Promise<Employee>
	async getEmployeeByDepartment(
		companyId: string,
		departmentId: string,
		config?: NotNullParams
	) {
		const model = await prisma.employee.findFirst({
			where: { companyId, departmentId },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Employee not found')
			}

			return null
		}

		return EmployeeMapper.toEntity(model)
	}
}
