import { User } from '@/@types'
export type OutputMessage =
	| TextOutput
	| ButtonOutput
	| ListOutput
	| DocumentOutput

type TextOutput = {
	type: 'text'
	content: string
}

type ButtonOutput = {
	type: 'button'
	text: string
	buttons: Array<{ id: string; title: string }>
}

type ListOutput = {
	type: 'list'
	text: string
	buttonText: string
	sections: Array<{
		title: string
		rows: Array<{ id: string; title: string; description?: string }>
	}>
}

type DocumentOutput = {
	type: 'document'
	fileUrl: string
	filename: string
}

export type OutputPort = {
	handle(toUser: User, output: OutputMessage): void | Promise<void>
}
