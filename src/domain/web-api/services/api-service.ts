import {
	BusinessHours,
	Day,
	TimeString,
	WeekDay,
} from '@/core/value-objects/business-hours'
import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { SenderType } from '@/domain/whats-app/@types'
import { GetClientUseCase } from '@/domain/whats-app/application/use-cases/get-client-use-case'
import { GetEmployeeUseCase } from '@/domain/whats-app/application/use-cases/get-employee-use-case'
import { z } from 'zod'
import { GetAllCompanyEmployeesUseCase } from '../use-cases/get-all-company-employees-use-case'
import { GetManagerProfileUseCase } from '../use-cases/get-manager-profile-use-case'
import { Conversation } from '@/domain/entities/conversation'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { GetCompanyUseCase } from '@/domain/whats-app/application/use-cases/get-company-use-case'
import { logger } from '@/core/logger'
import { businessHoursSchema, createEmployeeSchema } from './schemas'
import { Employee } from '@/domain/entities/employee'
import { DepartmentService } from '@/domain/whats-app/application/services/department-service'

type BusinessHoursType = z.infer<typeof businessHoursSchema>
type CompanyType = Omit<
	Parameters<typeof Company.create>[0],
	'businessHours'
> & {
	businessHours: BusinessHoursType
}
type CreateEmployeeType = z.infer<typeof createEmployeeSchema>
type ChatMessage =
	| {
			content: string
			sender: 'client' | 'employee'
			senderName: string
			timestamp: Date
	  }
	| {
			content: string
			sender: 'ai'
			senderName: 'AI'
			timestamp: Date
	  }
type FAQs = Record<
	string,
	{
		question: string
		answer: string
	}[]
>
export class APIService {
	constructor(
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository,
		private conversationRepository: ConversationRepository,
		private companyRepository: CompanyRepository,
		private faqRepository: FAQRepository,
		private getManagerProfileUseCase: GetManagerProfileUseCase,
		private getAllCompanyEmployeesUseCase: GetAllCompanyEmployeesUseCase,
		private getClientUseCase: GetClientUseCase,
		private getEmployeeUseCase: GetEmployeeUseCase,
		private getCompanyUseCase: GetCompanyUseCase,
		private departmentService: DepartmentService
	) {}

	private parseBusinessHours(businessHours: NonNullable<BusinessHoursType>) {
		return new BusinessHours(
			businessHours.map(
				d =>
					new Day(
						d.dayOfWeek.toLowerCase() as WeekDay,
						d.open as TimeString,
						d.close as TimeString
					)
			)
		)
	}

	async createCompany(data: CompanyType) {
		const { businessHours } = data
		let businessHoursObj: BusinessHours | undefined

		if (businessHours) {
			businessHoursObj = this.parseBusinessHours(businessHours)
		}

		const company = Company.create({
			...data,
			businessHours: businessHoursObj,
		})

		await this.companyRepository.save(company)

		return company
	}
	async updateCompany(cnpj: string, data: Partial<CompanyType>) {
		logger.debug('Updating company', { cnpj, data })
		const company = await this.companyRepository.findByCNPJ(cnpj)
		let businessHoursObj: BusinessHours | undefined

		if (data.businessHours) {
			businessHoursObj = this.parseBusinessHours(data.businessHours)
		}

		if (!company) {
			throw new Error('Company not found')
		}

		const updatedCompany = Company.create(
			{
				cnpj: data.cnpj ?? company.cnpj,
				name: data.name ?? company.name,
				email: data.email ?? company.email,
				phone: data.phone ?? company.phone,
				website: data.website ?? company.website,
				description: data.description ?? company.description,
				managerId: company.managerId,
				businessHours: businessHoursObj ?? company.businessHours,
			},
			company.id
		)

		await this.companyRepository.save(updatedCompany)

		return {
			cnpj: updatedCompany.cnpj,
			name: updatedCompany.name,
			email: updatedCompany.email,
			phone: updatedCompany.phone,
			website: updatedCompany.website,
			description: updatedCompany.description,
		}
	}

	async getCompanyInfo(companyId: string) {
		const company = await this.getCompanyUseCase.execute(companyId)
		const businessHours: BusinessHoursType = []

		company.businessHours.getDays().forEach(day => {
			const parsedDay = {
				open: day.openTime,
				close: day.closeTime,
				dayOfWeek: day.weekDay,
			}

			businessHours.push(parsedDay)
		})

		return {
			name: company.name,
			phone: company.phone,
			email: company.email,
			website: company.website,
			description: company.description,
			cnpj: company.cnpj,
			managerId: company.managerId,
			businessHours,
		} satisfies CompanyType
	}

	async getManagerProfile(managerId: string) {
		return this.getManagerProfileUseCase.execute(managerId)
	}

	async getAllCompanyEmployees(companyId: string) {
		return this.getAllCompanyEmployeesUseCase.execute(companyId)
	}

	async getAllCompanyDepartments(companyId: string) {
		return this.departmentRepository.findAll(companyId)
	}

	async getDepartment(companyId: string, departmentId: string) {
		const department = await this.departmentRepository.find(
			companyId,
			departmentId
		)

		if (!department) {
			throw new Error('Department not found')
		}

		const employees = await this.departmentService.listEmployees(
			companyId,
			departmentId
		)

		return {
			name: department.name,
			description: department.description,
			employees: employees.map(employee => ({
				name: employee.name,
				phone: employee.phone,
			})),
		}
	}

	async getEmployeeByPhone(companyId: string, phone: string) {
		const employee = await this.employeeRepository.findByPhone(companyId, phone)
		let departmentName = ''

		if (!employee) {
			throw new Error('Employee not found')
		}

		if (employee.departmentId) {
			const department = await this.departmentRepository.find(
				companyId,
				employee.departmentId
			)

			if (department) {
				departmentName = department.name
			}
		}

		return {
			name: employee.name,
			phone: employee.phone,
			departmentName,
		}
	}

	async getChat(companyId: string, id: string) {
		const conversation = await this.conversationRepository.findOrThrow(
			companyId,
			id
		)

		return this.parseChat(conversation)
	}

	async getChats(companyId: string) {
		const conversations =
			await this.conversationRepository.findAllBelongingToClient(companyId)

		return Promise.all(
			conversations.map(conversation => this.parseChat(conversation))
		)
	}

	async getRecentChats(companyId: string, limit = 10) {
		const conversations =
			await this.conversationRepository.findRecentBelongingToClient(
				companyId,
				limit
			)

		return Promise.all(
			conversations.map(conversation => this.parseChat(conversation))
		)
	}

	private async parseChat(conversation: Conversation) {
		const chat = {
			id: conversation.id,
			startedAt: conversation.startedAt,
			endedAt: conversation.endedAt,
			messages: new Array<ChatMessage>(),
		}

		for (const m of conversation.messages) {
			const messageContent = m.content
			const messageTimestamp = m.timestamp

			switch (m.senderType) {
				case SenderType.CLIENT: {
					if (!m.senderId) {
						throw new Error('Client ID is required')
					}
					const client = await this.getClientUseCase.execute(
						conversation.companyId,
						m.senderId!
					)

					chat.messages.push({
						content: messageContent,
						sender: 'client',
						timestamp: messageTimestamp,
						senderName: client.name,
					})
					break
				}
				case SenderType.EMPLOYEE: {
					if (!m.senderId) {
						throw new Error('Employee ID is required')
					}
					const employee = await this.getEmployeeUseCase.execute(
						conversation.companyId,
						m.senderId
					)

					chat.messages.push({
						content: messageContent,
						sender: 'employee',
						timestamp: messageTimestamp,
						senderName: employee.name,
					})
					break
				}
				case SenderType.AI: {
					chat.messages.push({
						content: messageContent,
						sender: 'ai',
						timestamp: messageTimestamp,
						senderName: 'AI',
					})
					break
				}
				default:
					throw new Error('Invalid sender type')
			}
		}

		return chat
	}

	async getFAQs(companyId: string) {
		const categories = await this.faqRepository.findCategories(companyId)
		const faqs: FAQs = {}

		for (const category of categories) {
			faqs[category.name] = []
			const items = await this.faqRepository.findItemsByCategory(
				companyId,
				category.id
			)

			items.forEach(item => {
				faqs[category.name].push({
					question: item.question,
					answer: item.answer,
				})
			})
		}

		return faqs
	}

	async createEmployee(data: CreateEmployeeType) {
		const employee = Employee.create(data)
		await this.employeeRepository.save(employee)
		return employee
	}
}
