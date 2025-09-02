import type { Readable } from 'node:stream'
import { Readable as ReadableStream } from 'node:stream'
import { env } from '@/config/env'
import { FileTooLargeError } from '@/errors/errors/file-too-large-error'
import { z } from 'zod'

// Schemas Zod para validação da resposta da API do WhatsApp
const WhatsAppMediaMetaSchema = z.object({
	url: z.string(),
	mime_type: z.string(),
	file_size: z.number().optional(),
	id: z.string(),
})

const WhatsAppMediaResponseSchema = z.object({
	url: z.string(),
	mime_type: z.string(),
	file_size: z.number().optional(),
	id: z.string(),
})

export type MediaStreamDownload = {
	kind: 'stream'
	stream: Readable
	mime: string
	size?: number
	filename?: string
}
export type MediaBufferDownload = {
	kind: 'buffer'
	buffer: Buffer
	mime: string
	size?: number
	filename?: string
}
export type MediaDownload = MediaStreamDownload | MediaBufferDownload

export class WhatsAppMediaService {
	constructor(
		private readonly graphBase = 'https://graph.facebook.com/v21.0',
		private readonly token = env.WPP_TOKEN,
		private readonly timeoutMs = 30_000,
		private readonly maxBytes = 100 * 1024 * 1024 // 100MB
	) {}

	async getMediaMeta(
		mediaId: string
	): Promise<{ url: string; mime: string; file_size?: number; id: string }> {
		const url = `${this.graphBase}/${mediaId}`
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

		try {
			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${this.token}` },
				signal: controller.signal,
			})

			if (!res.ok) throw new Error(`WhatsApp getMediaMeta ${res.status}`)

			const jsonData = await res.json()
			const parsedData = WhatsAppMediaMetaSchema.parse(jsonData)

			return {
				url: parsedData.url,
				mime: parsedData.mime_type,
				file_size: parsedData.file_size,
				id: parsedData.id,
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new Error(
					`Resposta inválida da API do WhatsApp: ${error.errors.map(e => e.message).join(', ')}`
				)
			}
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Timeout ao obter metadados da mídia')
			}
			throw error
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async downloadAsStream(mediaId: string): Promise<MediaDownload> {
		const meta = await this.getMediaMeta(mediaId)
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

		try {
			const res = await fetch(meta.url, {
				headers: { Authorization: `Bearer ${this.token}` },
				signal: controller.signal,
			})

			if (!res.ok) throw new Error(`WhatsApp media download ${res.status}`)

			// opcional: validar Content-Length <= maxBytes
			const cl = Number(res.headers.get('content-length') ?? 0)
			if (cl && cl > this.maxBytes)
				throw new FileTooLargeError('Arquivo excede limite configurado')

			const stream = ReadableStream.from(res.body as any)
			return {
				kind: 'stream',
				stream,
				mime: meta.mime,
				size: meta.file_size,
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Timeout ao baixar mídia como stream')
			}
			throw error
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async downloadAsBuffer(mediaId: string): Promise<MediaDownload> {
		const meta = await this.getMediaMeta(mediaId)
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

		try {
			const res = await fetch(meta.url, {
				headers: { Authorization: `Bearer ${this.token}` },
				signal: controller.signal,
			})

			if (!res.ok) throw new Error(`WhatsApp media download ${res.status}`)

			const arrBuf = await res.arrayBuffer()
			const buf = Buffer.from(arrBuf)
			if (buf.byteLength > this.maxBytes)
				throw new FileTooLargeError('Arquivo excede limite configurado')

			return {
				kind: 'buffer',
				buffer: buf,
				mime: meta.mime,
				size: meta.file_size,
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Timeout ao baixar mídia como buffer')
			}
			throw error
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async download(mediaId: string): Promise<MediaBufferDownload>
	async download(
		mediaId: string,
		config: { mode: 'buffer' }
	): Promise<MediaBufferDownload>
	async download(
		mediaId: string,
		config: { mode: 'stream' }
	): Promise<MediaStreamDownload>
	async download(
		mediaId: string,
		config?: { mode: 'buffer' | 'stream' }
	): Promise<MediaDownload> {
		if (config?.mode === 'stream') {
			return this.downloadAsStream(mediaId)
		}
		return this.downloadAsBuffer(mediaId)
	}
}
