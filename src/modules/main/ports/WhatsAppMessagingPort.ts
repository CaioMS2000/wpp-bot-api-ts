import { logger as _logger } from '@/infra/logging/logger'
import { inc } from '@/infra/logging/metrics'
import {
	sendButtonMessage,
	sendListMessage,
	sendTextMessage,
} from '@/infra/whatsapp/senders'
import { MessagingPort, MsgButton, MsgListSection } from './MessagingPort'

/**
 * WhatsApp implementation for MessagingPort.
 * Currently supports plain text messages only (as per system requirements).
 */
export class WhatsAppMessagingPort implements MessagingPort {
	async sendText(
		tenantId: string,
		toPhone: string,
		message: string
	): Promise<void> {
		const logger = _logger.child({ component: 'whatsapp', tenantId, toPhone })
		const t0 = Date.now()
		try {
			const res: any = await sendTextMessage(toPhone, message)
			const id = res?.messages?.[0]?.id ?? res?.messages?.id
			logger.info('wpp_send_text_ok', {
				messageId: id,
				latencyMs: Date.now() - t0,
			})
			inc('whatsapp_send_ok', { type: 'text' })
		} catch (err) {
			logger.error('wpp_send_text_error', { latencyMs: Date.now() - t0, err })
			inc('whatsapp_send_error', { type: 'text' })
			throw err
		}
	}

	async sendButtons(
		tenantId: string,
		toPhone: string,
		text: string,
		buttons: MsgButton[]
	): Promise<void> {
		const logger = _logger.child({ component: 'whatsapp', tenantId, toPhone })
		const t0 = Date.now()
		try {
			const res: any = await sendButtonMessage(toPhone, text, buttons)
			const id = res?.messages?.[0]?.id ?? res?.messages?.id
			logger.info('wpp_send_buttons_ok', {
				messageId: id,
				latencyMs: Date.now() - t0,
			})
			inc('whatsapp_send_ok', { type: 'buttons' })
		} catch (err) {
			logger.error('wpp_send_buttons_error', {
				latencyMs: Date.now() - t0,
				err,
			})
			inc('whatsapp_send_error', { type: 'buttons' })
			throw err
		}
	}

	async sendList(
		tenantId: string,
		toPhone: string,
		bodyText: string,
		buttonText: string,
		sections: MsgListSection[]
	): Promise<void> {
		const logger = _logger.child({ component: 'whatsapp', tenantId, toPhone })
		const t0 = Date.now()
		try {
			const res: any = await sendListMessage(
				toPhone,
				bodyText,
				buttonText,
				sections
			)
			const id = res?.messages?.[0]?.id ?? res?.messages?.id
			logger.info('wpp_send_list_ok', {
				messageId: id,
				latencyMs: Date.now() - t0,
			})
			inc('whatsapp_send_ok', { type: 'list' })
		} catch (err) {
			logger.error('wpp_send_list_error', { latencyMs: Date.now() - t0, err })
			inc('whatsapp_send_error', { type: 'list' })
			throw err
		}
	}
}
