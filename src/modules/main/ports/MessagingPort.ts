import { logger } from '@/infra/logging/logger'

export type MsgButton = { id: string; title: string }
export type MsgListRow = { id: string; title: string; description?: string }
export type MsgListSection = { title: string; rows: MsgListRow[] }

export interface MessagingPort {
	sendText(tenantId: string, toPhone: string, message: string): Promise<void>
	sendButtons(
		tenantId: string,
		toPhone: string,
		text: string,
		buttons: MsgButton[]
	): Promise<void>
	sendList(
		tenantId: string,
		toPhone: string,
		bodyText: string,
		buttonText: string,
		sections: MsgListSection[]
	): Promise<void>
}

export class ConsoleMessagingPort implements MessagingPort {
	// Structured logger for dev console
	private log = logger.child({ component: 'push.console' })
	async sendText(
		tenantId: string,
		toPhone: string,
		message: string
	): Promise<void> {
		this.log.info('push_text', { tenantId, toPhone, size: message.length })
	}

	async sendButtons(
		tenantId: string,
		toPhone: string,
		text: string,
		buttons: MsgButton[]
	): Promise<void> {
		this.log.info('push_buttons', {
			tenantId,
			toPhone,
			textSize: text.length,
			buttonsCount: buttons.length,
		})
	}

	async sendList(
		tenantId: string,
		toPhone: string,
		bodyText: string,
		buttonText: string,
		sections: MsgListSection[]
	): Promise<void> {
		this.log.info('push_list', {
			tenantId,
			toPhone,
			bodySize: bodyText.length,
			buttonText,
			sections: sections.length,
		})
	}
}
