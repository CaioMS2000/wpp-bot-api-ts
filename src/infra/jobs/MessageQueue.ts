export type IncomingMessageJob = {
	kind: 'inbound'
	tenantId: string
	messageId: string
	from: string
	to: string
	name: string
	content: {
		kind:
			| 'text'
			| 'list_reply'
			| 'button_reply'
			| 'document'
			| 'image'
			| 'audio'
			| 'video'
			| 'sticker'
		text?: string
		title?: string
		media?: {
			id: string
			filename?: string
			mime?: string
		}
	}
	receivedAt: string
}

export type ToolIntent =
	| { type: 'ENTER_QUEUE'; department: string }
	| { type: 'END_AI_CHAT'; reason?: string }

export type ToolIntentJob = {
	kind: 'intent'
	tenantId: string
	userPhone: string
	conversationId: string
	intents: ToolIntent[]
}

export type QueueJob = IncomingMessageJob | ToolIntentJob

export interface MessageQueue {
	enqueue(job: QueueJob): Promise<void>
	startConsumer(
		handler: (job: QueueJob) => Promise<void>,
		options?: { concurrency?: number }
	): void
}
