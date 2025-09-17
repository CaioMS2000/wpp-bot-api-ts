// Types and parser for WhatsApp Cloud API webhook payloads

export type WppText = {
	kind: 'text'
	text: string
}

export type WppListReply = {
	kind: 'list_reply'
	id: string
	title: string
}

export type WppButtonReply = {
	kind: 'button_reply'
	id: string
	title: string
}

export type MediaMeta = {
	id: string
	mime: string
	sha256?: string
	size?: number
}

export type WppImage = {
	kind: 'image'
	caption?: string
	media: MediaMeta
}

export type WppDocument = {
	kind: 'document'
	caption?: string
	media: MediaMeta & { filename?: string }
}

export type WppAudio = {
	kind: 'audio'
	media: MediaMeta
}

export type WppVideo = {
	kind: 'video'
	caption?: string
	media: MediaMeta
}

export type WppSticker = {
	kind: 'sticker'
	media: MediaMeta
}

export type WppContent =
	| WppText
	| WppListReply
	| WppButtonReply
	| WppImage
	| WppDocument
	| WppAudio
	| WppVideo
	| WppSticker

export type WppMessage = {
	from: string
	to: string
	name: string
	content: WppContent
}
