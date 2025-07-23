import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq-category'
import { FAQItem } from '@/domain/entities/faq-item'
import { Message } from '@/domain/entities/message'
import { isClient, isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { User, UserType } from '../../@types'
import { GetFAQItemsUseCase } from '../use-cases/get-faq-items-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ConversationState } from './conversation-state'
import { StateName, StateTransitionIntention } from './types'

export type FAQItemsStateProps = {
	category: FAQCategory
	user: User
}

export class FAQItemsState extends ConversationState<FAQItemsStateProps> {
	constructor(
		outputPort: OutputPort,
		user: User,
		category: FAQCategory,
		private getFAQItemsUseCase: GetFAQItemsUseCase
	) {
		super(outputPort, { user, category })
	}

	get category() {
		return this.props.category
	}

	get user() {
		return this.props.user
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		throw new Error('Method not implemented.')
	}

	async getNextState(
		message = ''
	): Promise<Nullable<StateTransitionIntention>> {
		// return { stateName: 'FAQCategoriesState' }
		if (isClient(this.user)) {
			return {
				target: StateName.FAQCategoriesState,
				context: {
					userId: this.user.id,
					userType: UserType.CLIENT,
					companyId: this.user.companyId,
				},
			}
		} else if (isEmployee(this.user)) {
			return {
				target: StateName.FAQCategoriesState,
				context: {
					userId: this.user.id,
					userType: UserType.EMPLOYEE,
					companyId: this.user.companyId,
				},
			}
		}

		throw new Error('Invalid user type')
	}

	async onEnter() {
		const items = await this.getFAQItemsUseCase.execute(
			this.user.companyId,
			this.category.id
		)

		logger.debug('[FAQItemsState.onEnter]\n', {
			items,
			category: this.category,
		})

		const textOutput: OutputMessage = {
			type: 'text',
			content: items.reduce((acc, item) => {
				return `${acc}*${item.question}*\n${item.answer}\n\n`
			}, `*FAQ - ${this.category.name}*\n\n`),
		} as const

		await execute(this.outputPort.handle, this.user, textOutput)
	}
}
