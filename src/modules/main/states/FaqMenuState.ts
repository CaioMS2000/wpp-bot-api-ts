import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { FaqCategoryState } from './FaqCategoryState'
import { InitialState } from './InitialState'

/**
 * Estado responsável por listar categorias do FAQ e delegar para categorias.
 */
export class FaqMenuState implements State {
	constructor(private readonly context: CustomerServiceContext) {}

	async handle(message: string): Promise<void> {
		const trimmed = message.trim().toLowerCase()

		if (trimmed === 'voltar') {
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}

		const categories = await this.context.fetchFaqCategories()
		const matched = categories.find(c => c.toLowerCase() === trimmed)
		if (matched) {
			const next = new FaqCategoryState(this.context, matched)
			this.context.transitionTo(next)
			await next.handle(message)
			return
		}

		await this.context.showFaqCategoriesMenu()
	}

	getName(): string {
		return 'faq_menu'
	}

	getSnapshot(): unknown {
		return undefined
	}
}
