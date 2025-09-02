export function createSlug(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
}

export const sanitize = (text: string) =>
	text
		.normalize('NFD')
		.replace(/\p{M}/gu, '') // remove marcas (acentos) unicode
		.replace(/[^a-zA-Z0-9.-]+/g, '_') // espaços e outros -> "_"
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
