export type ActiveConversation = {
	id: string
	employeePhone: string
	employeeName: string
	departmentName: string | null
	customerPhone: string
}

export interface ConversationRepository {
	start(
		tenantId: string,
		employeePhone: string,
		customerPhone: string,
		arrivedAt?: Date
	): Promise<ActiveConversation>

	findActiveByEmployeePhone(
		tenantId: string,
		employeePhone: string
	): Promise<ActiveConversation | null>

	findActiveByCustomerPhone(
		tenantId: string,
		customerPhone: string
	): Promise<ActiveConversation | null>

	endByEmployeePhone(
		tenantId: string,
		employeePhone: string
	): Promise<ActiveConversation | null>

	endByEmployeePhoneWithResolution(
		tenantId: string,
		employeePhone: string,
		resolution: 'RESOLVED' | 'UNRESOLVED'
	): Promise<ActiveConversation | null>

	appendMessage(
		conversationId: string,
		sender: 'EMPLOYEE' | 'CUSTOMER',
		text: string
	): Promise<void>
}
