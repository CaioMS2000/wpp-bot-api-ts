import {
	WppIncomingContent,
	WppIncomingMessage,
} from '@/modules/whats-app/@types/messages'

export function parseWhatsAppMessage(body: any): WppIncomingMessage | null {
	const entry0 = body?.entry?.[0]
	const change0 = entry0?.changes?.[0]
	const value = change0?.value
	const msg = value?.messages?.[0]
	if (!msg) return null

	const base = {
		from: String(msg.from),
		to: String(
			value?.metadata?.display_phone_number ??
				value?.metadata?.phone_number_id ??
				''
		),
		name: value?.contacts?.[0]?.profile?.name as string | undefined,
	}

	// TEXT
	if (msg.type === 'text' && msg.text?.body) {
		const content: WppIncomingContent = {
			kind: 'text',
			text: String(msg.text.body),
		}
		return { ...base, content }
	}

	// INTERACTIVE LIST REPLY
	if (msg.type === 'interactive' && msg.interactive?.list_reply?.id) {
		const listReply = msg.interactive.list_reply
		const content: WppIncomingContent = {
			kind: 'list_reply',
			id: String(listReply.id),
			title: String(listReply.title ?? ''),
		}
		return { ...base, content }
	}

	// INTERACTIVE BUTTON REPLY
	if (msg.type === 'interactive' && msg.interactive?.button_reply?.id) {
		const buttonReply = msg.interactive.button_reply
		const content: WppIncomingContent = {
			kind: 'button_reply',
			id: String(buttonReply.id),
			title: String(buttonReply.title ?? ''),
		}
		return { ...base, content }
	}

	// IMAGE
	if (msg.type === 'image' && msg.image?.id) {
		const content: WppIncomingContent = {
			kind: 'image',
			caption: msg.image?.caption ?? undefined,
			media: {
				id: String(msg.image.id),
				mime: String(msg.image.mime_type ?? ''),
				sha256: msg.image?.sha256,
			},
		}
		return { ...base, content }
	}

	// DOCUMENT
	if (msg.type === 'document' && msg.document?.id) {
		const content: WppIncomingContent = {
			kind: 'document',
			caption: msg.document?.caption ?? undefined,
			media: {
				id: String(msg.document.id),
				mime: String(msg.document.mime_type ?? ''),
				sha256: msg.document?.sha256,
				size: msg.document?.file_size
					? Number(msg.document.file_size)
					: undefined,
				filename: msg.document?.filename ?? undefined,
			},
		}
		return { ...base, content }
	}

	// AUDIO
	if (msg.type === 'audio' && msg.audio?.id) {
		const content: WppIncomingContent = {
			kind: 'audio',
			media: {
				id: String(msg.audio.id),
				mime: String(msg.audio.mime_type ?? ''),
				sha256: msg.audio?.sha256,
			},
		}
		return { ...base, content }
	}

	// VIDEO
	if (msg.type === 'video' && msg.video?.id) {
		const content: WppIncomingContent = {
			kind: 'video',
			caption: msg.video?.caption ?? undefined,
			media: {
				id: String(msg.video.id),
				mime: String(msg.video.mime_type ?? ''),
				sha256: msg.video?.sha256,
			},
		}
		return { ...base, content }
	}

	// STICKER (se quiser suportar)
	if (msg.type === 'sticker' && msg.sticker?.id) {
		const content: WppIncomingContent = {
			kind: 'sticker',
			media: {
				id: String(msg.sticker.id),
				mime: String(msg.sticker.mime_type ?? ''),
				sha256: msg.sticker?.sha256,
			},
		}
		return { ...base, content }
	}

	return null // tipos não suportados
}
