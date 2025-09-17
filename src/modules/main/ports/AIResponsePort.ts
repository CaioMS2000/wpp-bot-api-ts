export type AIMakeResponseInput = {
	tenantId: string
	conversationId: string
	userPhone: string
	role: 'CLIENT' | 'EMPLOYEE'
	text: string
	lastResponseId?: string | null
}

export type AIMakeResponseResult = {
	text: string
	responseId?: string
	usage?: {
		input_tokens?: number
		output_tokens?: number
		total_tokens?: number
	}
	summarized?: boolean
}

export interface AIResponsePort {
	makeResponse(input: AIMakeResponseInput): Promise<AIMakeResponseResult>
}
