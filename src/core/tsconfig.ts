import { FileSystem, Path } from '@effect/platform'
import { Effect, Option, Schema } from 'effect'

const tsconfigSchema = Schema.Struct({
	compilerOptions: Schema.Struct({
		baseUrl: Schema.String.pipe(Schema.optional),
		paths: Schema.Record({
			key: Schema.String,
			value: Schema.Array(Schema.String)
		}).pipe(Schema.optional)
	})
})

const candidates = ['tsconfig.app.json', 'tsconfig.base.json', 'tsconfig.json']

export const findNearestTsconfig = Effect.fn(function* (startPath: string) {
	let aux: string | null = null
	const path = yield* Path.Path
	const fs = yield* FileSystem.FileSystem

	while (startPath) {
		for (const candidate of candidates) {
			const tsconfigPath = path.join(startPath, candidate)

			const exists = yield* fs.exists(tsconfigPath)

			if (exists) {
				const content = yield* Effect.tryPromise(() => import(tsconfigPath))

				const parsed = yield* Schema.decodeUnknown(tsconfigSchema)(content)

				if (parsed.compilerOptions?.paths) return Option.some(tsconfigPath)
			}
		}

		const parentDir = path.dirname(startPath)

		startPath = parentDir

		if (parentDir === aux) break

		aux = startPath
	}

	return Option.none()
})
