import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { FAQCategory } from '@/domain/entities/faq-category'
import { Message } from '@/domain/entities/message'
import { isClient, isEmployee } from '@/utils/entity'
import { MenuOption, User, UserType } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateName, StateTransitionIntention } from './types'

type FAQCategoriesStateProps = {
	user: User
	categories: FAQCategory[]
}

export class FAQCategoriesState extends ConversationState<FAQCategoriesStateProps> {
	constructor(outputPort: OutputPort, user: User, categories: FAQCategory[]) {
		super(outputPort, { user, categories })
	}

	get user() {
		return this.props.user
	}

	get categories() {
		return this.props.categories
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		if (message.content === 'Menu principal') {
			if (isClient(this.user)) {
				return {
					target: StateName.InitialMenuState,
					context: {
						userId: this.user.id,
						userType: UserType.CLIENT,
						companyId: this.user.companyId,
					},
				}
			} else if (isEmployee(this.user)) {
				return {
					target: StateName.InitialMenuState,
					context: {
						userId: this.user.id,
						userType: UserType.EMPLOYEE,
						companyId: this.user.companyId,
					},
				}
			}

			throw new Error('Invalid user type')
		}

		const correspondingCategory = this.categories.find(
			category => category.name === message.content
		)

		if (!correspondingCategory) {
			return null
		}

		const partialObject = {
			userId: this.user.id,
			categoryId: correspondingCategory.id,
		}

		if (isClient(this.user)) {
			return {
				target: StateName.FAQItemsState,
				context: {
					...partialObject,
					userType: UserType.CLIENT,
					companyId: this.user.companyId,
				},
			}
		} else if (isEmployee(this.user)) {
			return {
				target: StateName.FAQItemsState,
				context: {
					...partialObject,
					userType: UserType.EMPLOYEE,
					companyId: this.user.companyId,
				},
			}
		}

		throw new Error('Invalid user type')
	}

	async onEnter() {
		const menuOptions: MenuOption[] = this.categories
			.map((category, index) => ({
				key: (index + 1).toString(),
				label: category.name,
				forClient: true,
				forEmployee: true,
			}))
			.concat([
				{
					key: 'menu',
					label: 'Menu principal',
					forClient: true,
					forEmployee: true,
				},
			])
		const listOutput: OutputMessage = {
			type: 'list',
			text: 'Categorias',
			buttonText: 'Ver',
			sections: [
				{
					title: 'Items',
					rows: menuOptions.map(opt => ({
						id: opt.key,
						title: opt.label,
					})),
				},
			],
		} as const

		this.outputPort.handle(this.user, listOutput)
	}
}
