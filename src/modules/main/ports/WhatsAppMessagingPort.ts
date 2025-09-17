import { MessagingPort, MsgButton, MsgListSection } from './MessagingPort'
import {
	sendButtonMessage,
	sendListMessage,
	sendTextMessage,
} from '@/infra/whatsapp/senders'

/**
 * WhatsApp implementation for MessagingPort.
 * Currently supports plain text messages only (as per system requirements).
 */
export class WhatsAppMessagingPort implements MessagingPort {
	async sendText(
		_tenantId: string,
		toPhone: string,
		message: string
	): Promise<void> {
		await sendTextMessage(toPhone, message)
	}

	async sendButtons(
		_tenantId: string,
		toPhone: string,
		text: string,
		buttons: MsgButton[]
	): Promise<void> {
		await sendButtonMessage(toPhone, text, buttons)
	}

	async sendList(
		_tenantId: string,
		toPhone: string,
		bodyText: string,
		buttonText: string,
		sections: MsgListSection[]
	): Promise<void> {
		await sendListMessage(toPhone, bodyText, buttonText, sections)
	}
}
