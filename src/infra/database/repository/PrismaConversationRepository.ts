import {
	ActiveConversation,
	ConversationRepository,
} from '@/repository/ConversationRepository'
import { $Enums, PrismaClient } from '@prisma/client'

export class PrismaConversationRepository implements ConversationRepository {
	constructor(private readonly prisma: PrismaClient) {}

	private toActive(row: any): ActiveConversation {
		return {
			id: row.id,
			employeePhone: row.employee.phone,
			employeeName: row.employee.name,
			departmentName: row.department?.name ?? null,
			customerPhone: row.customerPhone,
		}
	}

	async start(
		tenantId: string,
		employeePhone: string,
		customerPhone: string,
		arrivedAt?: Date
	): Promise<ActiveConversation> {
		return this.prisma.$transaction(async tx => {
			const employee = await tx.employee.findUnique({
				where: { tenantId_phone: { tenantId, phone: employeePhone } },
				select: { id: true, name: true, phone: true, departmentId: true },
			})
			if (!employee) throw new Error('Funcionário não encontrado')

			// encerra qualquer conversa ativa existente para o funcionário
			await tx.conversation.updateMany({
				where: { tenantId, employeeId: employee.id, active: true },
				data: { active: false, endedAt: new Date() },
			})

			const convo = await tx.conversation.create({
				data: {
					tenantId,
					employeeId: employee.id,
					customerPhone,
					departmentId: employee.departmentId ?? undefined,
					arrivedAt: arrivedAt ?? undefined,
				},
				select: {
					id: true,
					customerPhone: true,
					department: { select: { name: true } },
					employee: { select: { name: true, phone: true } },
				},
			})

			return this.toActive(convo)
		})
	}

	async findActiveByEmployeePhone(
		tenantId: string,
		employeePhone: string
	): Promise<ActiveConversation | null> {
		const row = await this.prisma.conversation.findFirst({
			where: {
				tenantId,
				active: true,
				employee: { is: { phone: employeePhone, tenantId } },
			},
			select: {
				id: true,
				customerPhone: true,
				department: { select: { name: true } },
				employee: { select: { name: true, phone: true } },
			},
		})
		return row ? this.toActive(row) : null
	}

	async findActiveByCustomerPhone(
		tenantId: string,
		customerPhone: string
	): Promise<ActiveConversation | null> {
		const row = await this.prisma.conversation.findFirst({
			where: { tenantId, active: true, customerPhone },
			select: {
				id: true,
				customerPhone: true,
				department: { select: { name: true } },
				employee: { select: { name: true, phone: true } },
			},
		})
		return row ? this.toActive(row) : null
	}

	async endByEmployeePhone(
		tenantId: string,
		employeePhone: string
	): Promise<ActiveConversation | null> {
		const row = await this.prisma.conversation.findFirst({
			where: {
				tenantId,
				active: true,
				employee: { is: { phone: employeePhone, tenantId } },
			},
			select: { id: true },
		})
		if (!row) return null

		const ended = await this.prisma.conversation.update({
			where: { id: row.id },
			data: {
				active: false,
				endedAt: new Date(),
				resolution: $Enums.ConversationResolution.RESOLVED,
			},
			select: {
				id: true,
				customerPhone: true,
				department: { select: { name: true } },
				employee: { select: { name: true, phone: true } },
			},
		})

		return this.toActive(ended)
	}

	async endByEmployeePhoneWithResolution(
		tenantId: string,
		employeePhone: string,
		resolution: $Enums.ConversationResolution
	): Promise<ActiveConversation | null> {
		const row = await this.prisma.conversation.findFirst({
			where: {
				tenantId,
				active: true,
				employee: { is: { phone: employeePhone, tenantId } },
			},
			select: { id: true },
		})
		if (!row) return null

		const ended = await this.prisma.conversation.update({
			where: { id: row.id },
			data: { active: false, endedAt: new Date(), resolution },
			select: {
				id: true,
				customerPhone: true,
				department: { select: { name: true } },
				employee: { select: { name: true, phone: true } },
			},
		})

		return this.toActive(ended)
	}

	async appendMessage(
		conversationId: string,
		sender: 'EMPLOYEE' | 'CUSTOMER',
		text: string
	): Promise<void> {
		await this.prisma.message.create({
			data: { conversationId, sender, text },
		})
	}
}
