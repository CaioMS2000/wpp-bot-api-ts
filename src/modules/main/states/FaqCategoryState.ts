import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { FaqMenuState } from './FaqMenuState'

/**
 * Estado que envia perguntas/respostas de uma categoria e volta ao menu.
 */
export class FaqCategoryState implements State {
	constructor(
		private readonly context: CustomerServiceContext,
		private readonly category: string
	) {}

	async handle(_: string): Promise<void> {
		const entries = await this.context.fetchFaq(this.category)
		const formatted = entries
			.map(e => `Q: ${e.question}\nA: ${e.answer}`)
			.join('\n')

		await this.context.sendMessage(
			formatted || 'Sem perguntas nesta categoria.'
		)

		// Volta automaticamente para o menu de categorias (lista interativa)
		this.context.transitionTo(new FaqMenuState(this.context))
		await this.context.showFaqCategoriesMenu()
	}

	getName(): string {
		return 'faq_category'
	}

	getSnapshot(): unknown {
		return { category: this.category }
	}
}
