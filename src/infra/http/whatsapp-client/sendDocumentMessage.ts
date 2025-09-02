import { sendWhatsAppMessageBody } from './client'

type UploadDocumentResponse = {
	id: string
}

/**
 * Faz upload de um documento e retorna o media ID.
 * O arquivo precisa estar acessível publicamente via URL.
 */
export async function uploadDocument(
	fileUrl: string,
	mimeType = 'application/pdf'
): Promise<string> {
	const res = await sendWhatsAppMessageBody<UploadDocumentResponse>(
		{
			type: mimeType,
			url: fileUrl,
		},
		'media'
	)

	return res.id
}

/**
 * Envia uma mensagem de documento (PDF, etc.).
 */
export async function sendDocumentMessage(
	to: string,
	document: {
		mediaId: string
		filename: string
	}
) {
	return sendWhatsAppMessageBody({
		to,
		type: 'document',
		document: {
			id: document.mediaId,
			filename: document.filename,
		},
	})
}
