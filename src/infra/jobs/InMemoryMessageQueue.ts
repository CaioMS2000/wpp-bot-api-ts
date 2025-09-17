import type { MessageQueue, QueueJob } from './MessageQueue'

export class InMemoryMessageQueue implements MessageQueue {
	private q: QueueJob[] = []
	private waiting: Array<(job: QueueJob) => void> = []
	private started = false

	async enqueue(job: QueueJob): Promise<void> {
		const waiter = this.waiting.shift()
		if (waiter) {
			waiter(job)
			return
		}
		this.q.push(job)
	}

	startConsumer(
		handler: (job: QueueJob) => Promise<void>,
		options?: { concurrency?: number }
	): void {
		if (this.started) return
		this.started = true
		const concurrency = Math.max(1, Math.min(16, options?.concurrency ?? 3))
		for (let i = 0; i < concurrency; i++) this.spawnWorker(handler)
	}

	private async next(): Promise<QueueJob> {
		if (this.q.length > 0) return this.q.shift() as QueueJob
		return await new Promise<QueueJob>(resolve => {
			this.waiting.push(resolve)
		})
	}

	private async spawnWorker(handler: (job: QueueJob) => Promise<void>) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const job = await this.next()
			try {
				await handler(job)
			} catch (err) {
				try {
					// best-effort: log error; no retry strategy here (simple in-memory)
					console.error('[MessageQueue] job failed', err)
				} catch {}
			}
		}
	}
}
