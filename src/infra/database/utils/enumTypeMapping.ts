import { SenderType, UserType } from '@/@types'
import {
	FromType as PrismaFromType,
	StateName as PrismaStateName,
	UserType as PrismaUserType,
} from 'ROOT/prisma/generated'
import { ConversationStateType } from '@/states'

export const toPrismaStateName = (
	state: ConversationStateType
): PrismaStateName => {
	const map: Record<ConversationStateType, PrismaStateName> = {
		[ConversationStateType.INITIAL_MENU]: 'INITIAL_MENU',
		[ConversationStateType.BEGIN]: 'BEGIN',
		[ConversationStateType.CHATTING_WITH_AI]: 'CHATTING_WITH_AI',
		[ConversationStateType.SELECTING_FAQ_CATEGORY]: 'SELECTING_FAQ_CATEGORY',
		[ConversationStateType.LISTING_FAQ_ITEMS]: 'LISTING_FAQ_ITEMS',
		[ConversationStateType.SELECTING_DEPARTMENT]: 'SELECTING_DEPARTMENT',
		[ConversationStateType.DEPARTMENT_QUEUE]: 'DEPARTMENT_QUEUE',
		[ConversationStateType.CHATTING_WITH_CLIENT]: 'CHATTING_WITH_CLIENT',
		[ConversationStateType.LISTING_DEPARTMENT_QUEUE]:
			'LISTING_DEPARTMENT_QUEUE',
		[ConversationStateType.CHATTING_WITH_EMPLOYEE]: 'CHATTING_WITH_EMPLOYEE',
	}
	return map[state]
}

export const fromPrismaStateName = (
	prismaState: PrismaStateName
): ConversationStateType => {
	const map: Record<PrismaStateName, ConversationStateType> = {
		BEGIN: ConversationStateType.BEGIN,
		INITIAL_MENU: ConversationStateType.INITIAL_MENU,
		CHATTING_WITH_AI: ConversationStateType.CHATTING_WITH_AI,
		SELECTING_FAQ_CATEGORY: ConversationStateType.SELECTING_FAQ_CATEGORY,
		LISTING_FAQ_ITEMS: ConversationStateType.LISTING_FAQ_ITEMS,
		SELECTING_DEPARTMENT: ConversationStateType.SELECTING_DEPARTMENT,
		DEPARTMENT_QUEUE: ConversationStateType.DEPARTMENT_QUEUE,
		CHATTING_WITH_CLIENT: ConversationStateType.CHATTING_WITH_CLIENT,
		LISTING_DEPARTMENT_QUEUE: ConversationStateType.LISTING_DEPARTMENT_QUEUE,
		CHATTING_WITH_EMPLOYEE: ConversationStateType.CHATTING_WITH_EMPLOYEE,
	}
	return map[prismaState]
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
