import { sendWhatsAppMessageBody } from './client'

type ListRow = {
	id: string
	title: string
	description?: string
}

type ListSection = {
	title: string
	rows: ListRow[]
}

export async function sendListMessage(
	to: string,
	bodyText: string,
	buttonText: string,
	sections: ListSection[]
) {
	return sendWhatsAppMessageBody({
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
}
