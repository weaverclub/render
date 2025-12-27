import { FileSystem, Path } from '@effect/platform'
import { Effect, Option, Schema } from 'effect'

const packageJsonSchema = Schema.Struct({
	dependencies: Schema.Record({
		key: Schema.String,
		value: Schema.String
	}).pipe(Schema.optional),
	devDependencies: Schema.Record({
		key: Schema.String,
		value: Schema.String
	}).pipe(Schema.optional),
	peerDependencies: Schema.Record({
		key: Schema.String,
		value: Schema.String
	}).pipe(Schema.optional)
})

export const findNearestPackageJson = Effect.fn(function* (startPath: string) {
	let aux: string | null = null
	const path = yield* Path.Path
	const fs = yield* FileSystem.FileSystem

	while (startPath) {
		const candidatePath = path.join(startPath, 'package.json')

		const exists = yield* fs.exists(candidatePath)

		if (exists) {
			const content = yield* fs.readFileString(candidatePath)

			const contentAsJSON = yield* Effect.try(() => JSON.parse(content))

			const parsed =
				yield* Schema.decodeUnknown(packageJsonSchema)(contentAsJSON)

			return Option.some(parsed)
		}

		const parentDir = path.dirname(startPath)

		startPath = parentDir

		if (parentDir === aux) break

		aux = startPath
	}

	return Option.none()
})

export const findNearestNodeModules = Effect.fn(function* (startPath: string) {
	let aux: string | null = null
	const path = yield* Path.Path
	const fs = yield* FileSystem.FileSystem

	while (startPath) {
		const candidatePath = path.join(startPath, 'node_modules')

		const exists = yield* fs.exists(candidatePath)

		if (exists) {
			return Option.some(candidatePath)
		}

		const parentDir = path.dirname(startPath)

		startPath = parentDir

		if (parentDir === aux) break

		aux = startPath
	}

	return Option.none()
})

export const getProjectDependencies = Effect.fn(function* (
	projectRoot: string
) {
	const pkg = yield* findNearestPackageJson(projectRoot)

	if (Option.isNone(pkg)) return []

	const deps = [
		...Object.keys(pkg.value.dependencies || {}),
		...Object.keys(pkg.value.devDependencies || {}),
		...Object.keys(pkg.value.peerDependencies || {})
	]

	return deps
})
