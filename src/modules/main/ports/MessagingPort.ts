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
	async sendText(
		tenantId: string,
		toPhone: string,
		message: string
	): Promise<void> {
		console.log(`[push][${tenantId}] TEXT to ${toPhone}: ${message}`)
	}

	async sendButtons(
		tenantId: string,
		toPhone: string,
		text: string,
		buttons: MsgButton[]
	): Promise<void> {
		console.log(
			`[push][${tenantId}] BUTTONS to ${toPhone}: ${text} -> ${JSON.stringify(buttons)}`
		)
	}

	async sendList(
		tenantId: string,
		toPhone: string,
		bodyText: string,
		buttonText: string,
		sections: MsgListSection[]
	): Promise<void> {
		console.log(
			`[push][${tenantId}] LIST to ${toPhone}: ${bodyText} | ${buttonText} -> ${JSON.stringify(sections)}`
		)
	}
}
