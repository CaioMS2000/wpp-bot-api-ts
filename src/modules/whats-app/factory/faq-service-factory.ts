import { FAQService } from '../services/faq-service'

export class FAQServiceFactory {
	getService() {
		return new FAQService()
	}
}
