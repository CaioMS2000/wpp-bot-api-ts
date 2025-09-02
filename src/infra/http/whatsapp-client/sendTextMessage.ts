import { sendWhatsAppMessageBody } from './client'

export async function sendTextMessage(to: string, text: string) {
	return sendWhatsAppMessageBody({
		to,
		type: 'text',
		text: { body: text },
	})
}
