import { openAIClient } from '@/lib/openai'
import { logger } from '@/logger'

export type TagClassification = {
	tags: string[]
	confidence: number
}

function slug(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^\w\-]+/g, '_')
		.slice(0, 60)
}

export async function classifyTags(
	message: string
): Promise<TagClassification> {
	try {
		logger.debug('[TagRouter] Classificando mensagem:', message)

		const res = await openAIClient.responses.create({
			model: 'gpt-4o-mini',
			input: `Classifique a mensagem a seguir em tags curtas e retorne um JSON no formato {"tags": string[], "confidence": number}. Mensagem: "${message}"`,
			max_output_tokens: 50,
			// @ts-expect-error: 'response_format'
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'tags',
					schema: {
						type: 'object',
						properties: {
							tags: {
								type: 'array',
								items: { type: 'string' },
							},
							confidence: { type: 'number' },
						},
						required: ['tags', 'confidence'],
					},
				},
			},
		})

		const text = res.output_text ?? '{}'
		const parsed = JSON.parse(text)
		const rawTags: string[] = Array.isArray(parsed.tags) ? parsed.tags : []
		const confidence =
			typeof parsed.confidence === 'number' ? parsed.confidence : 0

		const result = {
			tags: rawTags.map(slug),
			confidence,
		}

		logger.debug('[TagRouter] Resultado da classificação:', result)

		return result
	} catch (err) {
		logger.error(err)
		return { tags: [], confidence: 0 }
	}
}
