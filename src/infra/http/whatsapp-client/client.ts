import { env } from '@/env'

const BASE_URL = 'https://graph.facebook.com/v22.0'
const phoneNumberId = env.PHONE_NUMBER_ID
const token = env.WPP_TOKEN

export async function sendWhatsAppMessageBody<T = any>(
	body: object,
	path = 'messages'
): Promise<T> {
	const res = await fetch(`${BASE_URL}/${phoneNumberId}/${path}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			...body,
		}),
	})

	if (!res.ok) {
		const error = await res.json()
		throw new Error(
			`Erro ao enviar mensagem. Requisição usada:\n${JSON.stringify(body)}\nerro:\n${JSON.stringify(error)}`
		)
	}

	return res.json() as Promise<T>
}
