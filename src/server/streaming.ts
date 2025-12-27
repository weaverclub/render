import { Effect } from 'effect'

export const streamToString = Effect.fn(function* (stream: ReadableStream) {
	const reader = stream.getReader()
	const chunks: Uint8Array[] = []

	while (true) {
		const { done, value } = yield* Effect.tryPromise(() => reader.read())

		if (done) break

		chunks.push(value)
	}

	return new TextDecoder().decode(Buffer.concat(chunks))
})
