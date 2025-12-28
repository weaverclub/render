// We need to build:
// 1. The UI frontend
// 2. The CLI
// 3. The library

import { FileSystem } from '@effect/platform'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import tailwind from 'bun-plugin-tailwind'
import { Effect } from 'effect'
import { build as tsdownBuild } from 'tsdown'

export const buildUI = Effect.tryPromise(() =>
	Bun.build({
		entrypoints: ['./src/ui/index.html'],
		outdir: './dist/ui',
		minify: true,
		target: 'browser',
		sourcemap: 'linked',
		plugins: [tailwind]
	})
)

export const buildCLI = Effect.tryPromise(() =>
	Bun.build({
		entrypoints: ['./src/cli/entrypoint.ts'],
		outdir: './dist',
		minify: true,
		compile: true,
		target: 'bun',
		sourcemap: 'linked'
	})
)

export const buildLibrary = Effect.tryPromise(() =>
	tsdownBuild({
		entry: {
			index: './src/react/react.ts'
		},
		outDir: 'dist',
		sourcemap: true,
		dts: true,
		clean: true,
		format: ['esm']
	})
)

const cleanFolder = FileSystem.FileSystem.pipe(
	Effect.flatMap((fs) =>
		fs.remove('./dist', {
			recursive: true
		})
	),
	Effect.ignore
)

cleanFolder.pipe(
	Effect.tap(() => buildLibrary),
	Effect.tap(() => buildUI),
	Effect.tap(() => buildCLI),
	Effect.provide(BunContext.layer),
	BunRuntime.runMain
)
