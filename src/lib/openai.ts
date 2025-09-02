import { env } from '@/config/env'
import { OpenAI } from 'openai'

export const openAIClient = new OpenAI({
	apiKey: env.OPENAI_API_KEY,
	// logLevel: 'debug',
	maxRetries: 0,
})
