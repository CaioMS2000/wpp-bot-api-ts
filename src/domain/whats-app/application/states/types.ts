import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { FAQCategory } from '@/domain/entities/faq-category'
import { User, UserType } from '../../@types'
import { AIChatState } from './ai-chat-state'
import { DepartmentChatState } from './client-only/department-chat-state'
import { DepartmentQueueState } from './client-only/department-queue-state'
import { DepartmentSelectionState } from './client-only/department-selection-state'
import { ChatWithClientState } from './employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from './employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from './faq-categories-state'
import { FAQItemsState } from './faq-items-state'
import { InitialMenuState } from './initial-menu-state'

// biome-ignore lint/style/useEnumInitializers: Permitir membros implicitamente inicializados
export enum StateName {
	AIChatState,
	DepartmentChatState,
	DepartmentQueueState,
	DepartmentSelectionState,
	ChatWithClientState,
	ListDepartmentQueueState,
	FAQCategoriesState,
	FAQItemsState,
	InitialMenuState,
}

export type StateDataType =
	| {
			stateName: StateName.DepartmentChatState
			params: { employee: Employee; client: Client; department: Department }
	  }
	| {
			stateName: StateName.DepartmentQueueState
			params: { client: Client; department: Department }
	  }
	| {
			stateName: StateName.ChatWithClientState
			params: {
				employee: Employee
				department: Department
				client: Client
				company: Company
			}
	  }
	| {
			stateName: StateName.ListDepartmentQueueState
			params: { employee: Employee; department: Department }
	  }
	| {
			stateName: StateName.FAQItemsState
			params: { user: User; category: FAQCategory }
	  }
	| {
			stateName: StateName.AIChatState
			params: { conversation: Conversation; user: User }
	  }
	| {
			stateName: StateName.DepartmentSelectionState
			params: {
				client: Client
				activeDepartments: Department[]
			}
	  }
	| {
			stateName: StateName.FAQCategoriesState
			params: { user: User; categories: FAQCategory[] }
	  }
	| {
			stateName: StateName.InitialMenuState
			params: { user: User; company: Company; conversation: Conversation }
	  }

export type StateTransitionIntention =
	| {
			target: StateName.DepartmentChatState
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: StateName.DepartmentQueueState
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: StateName.ChatWithClientState
			context: {
				clientPhone: string
				departmentId: string
				companyId: string
			}
	  }
	| {
			target: StateName.ListDepartmentQueueState
			context: { departmentId: string; companyId: string }
	  }
	| {
			target: StateName.FAQItemsState
			context: {
				userId: string
				userType: UserType
				categoryId: string
				companyId: string
			}
	  }
	| {
			target: StateName.AIChatState
			context: { userId: string; userType: UserType; companyId: string }
	  }
	| {
			target: StateName.DepartmentSelectionState
			context: {
				clientPhone: string
				companyId: string
			}
	  }
	| {
			target: StateName.FAQCategoriesState
			context: { userId: string; userType: UserType; companyId: string }
	  }
	| {
			target: StateName.InitialMenuState
			context: { userId: string; userType: UserType; companyId: string }
	  }
