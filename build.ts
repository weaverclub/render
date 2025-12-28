// We need to build:
// 1. The UI frontend for CLI (bundled into dist/cli)
// 2. The CLI
// 3. The library

import { FileSystem } from '@effect/platform'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import tailwind from 'bun-plugin-tailwind'
import { Effect } from 'effect'
import { build as tsdownBuild } from 'tsdown'

// Build UI into the CLI folder so it can serve static files
export const buildUIForCLI = Effect.tryPromise(() =>
	Bun.build({
		entrypoints: ['./src/ui/index.html'],
		outdir: './dist/cli', // Output directly to CLI folder
		minify: true,
		target: 'browser',
		sourcemap: 'linked',
		plugins: [tailwind]
	})
)

export const buildCLI = Effect.tryPromise(() =>
	Bun.build({
		entrypoints: ['./src/cli/entrypoint.ts'],
		outdir: './dist/cli',
		minify: true,
		target: 'bun',
		naming: '[name].mjs',
		external: [
			'react',
			'react-dom',
			'react-dom/server',
			'react/jsx-runtime',
			'react/jsx-dev-runtime'
		]
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
	Effect.tap(() => buildUIForCLI), // Build UI first
	Effect.tap(() => buildCLI), // Then CLI
	Effect.provide(BunContext.layer),
	BunRuntime.runMain
)
