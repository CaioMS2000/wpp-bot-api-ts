import { sendWhatsAppMessageBody } from './client'

export async function sendTextMessage(to: string, text: string) {
	const res = await sendWhatsAppMessageBody({
		to,
		type: 'text',
		text: { body: text },
	})
	return res
}

type Button = { id: string; title: string }

export async function sendButtonMessage(
	to: string,
	text: string,
	buttons: Button[]
) {
	const res = await sendWhatsAppMessageBody({
		to,
		type: 'interactive',
		interactive: {
			type: 'button',
			body: { text },
			action: {
				buttons: buttons.map(b => ({
					type: 'reply',
					reply: { id: b.id, title: b.title },
				})),
			},
		},
	})
	return res
}

type ListRow = { id: string; title: string; description?: string }
type ListSection = { title: string; rows: ListRow[] }

export async function sendListMessage(
	to: string,
	bodyText: string,
	buttonText: string,
	sections: ListSection[]
) {
	const res = await sendWhatsAppMessageBody({
		to,
		type: 'interactive',
		interactive: {
			type: 'list',
			body: { text: bodyText },
			action: {
				button: buttonText,
				sections: sections.map(section => ({
					title: section.title,
					rows: section.rows.map(row => ({
						id: row.id,
						title: row.title,
						description: row.description,
					})),
				})),
			},
		},
	})
	return res
}

type UploadDocumentResponse = { id: string }

export async function uploadDocument(
	fileUrl: string,
	mimeType = 'application/pdf'
) {
	const res = await sendWhatsAppMessageBody<UploadDocumentResponse>(
		{ type: mimeType, url: fileUrl },
		'media'
	)
	return res.id
}

export async function sendDocumentMessage(
	to: string,
	document: { mediaId: string; filename: string }
) {
	const res = await sendWhatsAppMessageBody({
		to,
		type: 'document',
		document: { id: document.mediaId, filename: document.filename },
	})
	return res
}
