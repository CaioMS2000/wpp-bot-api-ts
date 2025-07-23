import { SenderType, UserType } from '@/domain/whats-app/@types'
import {
	FromType as PrismaFromType,
	StateName as PrismaStateName,
	UserType as PrismaUserType,
} from 'ROOT/prisma/generated'

export const stateNameToPrismaEnum: Record<string, PrismaStateName> = {
	InitialMenuState: 'initial_menu',
	FAQItemsState: 'faq_items',
	FAQCategoriesState: 'faq_categories',
	AIChatState: 'ai_chat',
	ListDepartmentQueueState: 'department_queue_list',
	ChatWithClientState: 'chat_with_client',
	DepartmentSelectionState: 'department_selection',
	DepartmentQueueState: 'department_queue',
	DepartmentChatState: 'department_chat',
}

export function fromPrismaUserType(prismaType: PrismaUserType): UserType {
	return UserType[prismaType]
}

export function toPrismaUserType(userType: UserType): PrismaUserType {
	return UserType[userType] as PrismaUserType
}

export function fromPrismaFromType(prismaType: PrismaFromType): SenderType {
	return SenderType[prismaType]
}

export function toPrismaFromType(fromType: SenderType): PrismaFromType {
	return SenderType[fromType] as PrismaFromType
}
