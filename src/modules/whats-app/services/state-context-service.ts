import { User, UserType } from '@/@types'
import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { NotImplementedError } from '@/errors/errors/not-implemented-error'
import { ConversationStateType } from '@/states'
import { StateParamType } from '@/states/types'
import { assertFn } from '@/utils/assert'
import { isClient } from '@/utils/entity'
import {
	chattingWithClientMetadataSchema,
	chattingWithEmployeeMetadataSchema,
	departmentQueueMetadataSchema,
	listingDepartmentQueueMetadataSchema,
	listingFAQItemsMetadataSchema,
} from '@/validators/states-metadata'
import { StateAccessDeniedError } from '../errors/state-access-denied'
import { ParamsOfState } from './state-service'

export type ContextOfState<S extends ConversationStateType> = Extract<
	StateParamType,
	{ target: S }
>['context']

type StateParamByTarget = {
	[K in ConversationStateType]: Extract<StateParamType, { target: K }>
}

type ContextByTarget = {
	[K in ConversationStateType]: Extract<
		StateParamType,
		{ target: K }
	>['context']
}

export class StateContextService {
	getContextFor(
		company: Company,
		conversation: Conversation,
		user: User,
		userType: UserType
	): StateParamType {
		const target = conversation.state
		switch (target) {
			case ConversationStateType.BEGIN: {
				type Ctx = ContextByTarget[typeof target]
				const context: Ctx = {
					userId: user.id,
					userType,
					companyId: company.id,
				}
				return {
					target,
					context,
				}
			}
			case ConversationStateType.INITIAL_MENU: {
				type Ctx = ContextByTarget[typeof target]
				const context: Ctx = {
					userId: user.id,
					userType,
					companyId: company.id,
				}

				return {
					target,
					context,
				}
			}
			case ConversationStateType.SELECTING_FAQ_CATEGORY: {
				type Ctx = ContextByTarget[typeof target]
				const context: Ctx = {
					userId: user.id,
					userType,
					companyId: company.id,
				}

				return {
					target,
					context,
				}
			}
			case ConversationStateType.CHATTING_WITH_AI: {
				type Ctx = ContextByTarget[typeof target]
				const context: Ctx = {
					userId: user.id,
					userType,
					companyId: company.id,
				}

				return {
					target,
					context,
				}
			}

			case ConversationStateType.SELECTING_DEPARTMENT: {
				if (!isClient(user) || userType !== UserType.CLIENT) {
					throw new StateAccessDeniedError(
						"Only clients can use 'ConversationStateType.SELECTING_DEPARTMENT'"
					)
				}

				type Ctx = ContextByTarget[typeof target]
				const context: Ctx = {
					clientPhone: user.phone,
					companyId: company.id,
				}

				return {
					target,
					context,
				}
			}

			case ConversationStateType.DEPARTMENT_QUEUE: {
				if (!isClient(user) || userType !== UserType.CLIENT) {
					throw new StateAccessDeniedError(
						"Only clients can use 'ConversationStateType.DEPARTMENT_QUEUE'"
					)
				}

				type Ctx = ContextByTarget[typeof target]

				const metadata = departmentQueueMetadataSchema.parse(
					conversation.stateMetadata
				)
				const context: Ctx = {
					clientPhone: user.phone,
					companyId: company.id,
					departmentId: metadata.departmentId,
				}

				return {
					target,
					context,
				}
			}
			case ConversationStateType.CHATTING_WITH_EMPLOYEE: {
				if (!isClient(user) || userType !== UserType.CLIENT) {
					throw new StateAccessDeniedError(
						"Only clients can use 'ConversationStateType.SELECTING_DEPARTMENT'"
					)
				}

				type Ctx = ContextByTarget[typeof target]
				const metadata = chattingWithEmployeeMetadataSchema.parse(
					conversation.stateMetadata
				)
				const context: Ctx = {
					clientPhone: user.phone,
					companyId: company.id,
					departmentId: metadata.departmentId,
				}

				return {
					target,
					context,
				}
			}
			case ConversationStateType.CHATTING_WITH_CLIENT: {
				type Ctx = ContextByTarget[typeof target]
				const metadata = chattingWithClientMetadataSchema.parse(
					conversation.stateMetadata
				)
				const context: Ctx = {
					companyId: company.id,
					clientPhone: metadata.clientPhone,
					departmentId: metadata.departmentId,
				}

				return {
					target,
					context,
				}
			}
			case ConversationStateType.LISTING_DEPARTMENT_QUEUE: {
				type Ctx = ContextByTarget[typeof target]
				const metadata = listingDepartmentQueueMetadataSchema.parse(
					conversation.stateMetadata
				)
				const context: Ctx = {
					companyId: company.id,
					departmentId: metadata.departmentId,
				}

				return {
					target,
					context,
				}
			}

			case ConversationStateType.LISTING_FAQ_ITEMS: {
				type Ctx = ContextByTarget[typeof target]
				const metadata = listingFAQItemsMetadataSchema.parse(
					conversation.stateMetadata
				)
				const context: Ctx = {
					categoryId: metadata.categoryId,
					companyId: company.id,
					userType,
					userId: user.id,
				}

				return {
					target,
					context,
				}
			}

			default: {
				// garante exaustão em tempo de compilação se surgir novo estado
				const _never: never = target
				throw new Error(
					`Estado não suportado em getContextFor: ${String(_never)}`
				)
			}
		}
	}
}
