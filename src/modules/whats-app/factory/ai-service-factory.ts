import { AIService } from '../services/ai-service'

export abstract class AIServiceFactory {
	abstract getService(): AIService
}
