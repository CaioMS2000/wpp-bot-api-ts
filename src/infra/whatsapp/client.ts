import { env } from '@/config/env'
import { logger } from '@/infra/logging/logger'

const BASE_URL = 'https://graph.facebook.com/v22.0'
const phoneNumberId = env.PHONE_NUMBER_ID
const token = env.WPP_TOKEN

export async function sendWhatsAppMessageBody<T = any>(
	body: object,
	path: 'messages' | 'media' = 'messages'
): Promise<T> {
	const res = await fetch(`${BASE_URL}/${phoneNumberId}/${path}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
	})

	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		const errorMessage = `Erro ao enviar mensagem. Body= ${JSON.stringify(
			body
		)} erro= ${JSON.stringify(error)}`
		logger.error('whatsapp_send_error', {
			component: 'whatsapp.client',
			bodySize: JSON.stringify(body).length,
			error,
		})
		throw new Error(errorMessage)
	}

	return (await res.json()) as T
}

type MediaInfo = {
	id: string
	url: string
	mime_type?: string
	sha256?: string
	file_size?: number
}

export async function getMediaInfo(mediaId: string): Promise<MediaInfo> {
	const res = await fetch(`${BASE_URL}/${mediaId}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		throw new Error(
			`Erro ao obter media info: ${mediaId} -> ${JSON.stringify(error)}`
		)
	}
	return (await res.json()) as MediaInfo
}

export async function downloadMediaByUrl(url: string): Promise<ArrayBuffer> {
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`Erro ao baixar mídia: ${res.status} ${text}`)
	}
	return await res.arrayBuffer()
}

export async function downloadMediaById(
	mediaId: string
): Promise<{ data: ArrayBuffer; mime?: string }> {
	const info = await getMediaInfo(mediaId)
	const data = await downloadMediaByUrl(info.url)
	return { data, mime: info.mime_type }
}
