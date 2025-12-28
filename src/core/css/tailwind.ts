import { Array as Arr, Effect, Option } from 'effect'

// Path to the CLI bundled with this package (relative to this file in src/core/css/)
const BUNDLED_CLI = new URL(
	'../../../node_modules/@tailwindcss/cli/dist/index.mjs',
	import.meta.url
).pathname

// Cache for compiled CSS output - always kept updated
let cachedCssOutput: string | null = null
let tailwindWatcher: {
	proc: ReturnType<typeof Bun.spawn>
	outputFile: string
} | null = null

export const compileTailwindCss = Effect.fn(function* (projectRoot: string) {
	const glob = new Bun.Glob('**/*.css')

	const files = Arr.fromIterable(
		glob.scanSync({ absolute: true, cwd: projectRoot })
	)

	const entrypoint = Arr.head(files)

	if (Option.isNone(entrypoint))
		return yield* Effect.fail(new Error('No CSS files found for Tailwind CSS.'))

	// Use bundled @tailwindcss/cli - runs via bun for speed
	const proc = Bun.spawn(
		['bun', BUNDLED_CLI, '-i', entrypoint.value, '--minify'],
		{
			cwd: projectRoot,
			stdout: 'pipe',
			stderr: 'pipe'
		}
	)

	const [stdout, stderr] = yield* Effect.all(
		[
			Effect.tryPromise(() => new Response(proc.stdout).text()),
			Effect.tryPromise(() => new Response(proc.stderr).text())
		],
		{
			concurrency: 'unbounded'
		}
	)
	const exitCode = yield* Effect.tryPromise(() => proc.exited)

	if (exitCode !== 0)
		return yield* Effect.fail(
			new Error(`Tailwind CSS compilation failed: ${stderr}`)
		)

	cachedCssOutput = stdout

	return {
		paths: files,
		compiledOutput: stdout
	}
})

// Start Tailwind in watch mode for faster incremental builds
export const startTailwindWatchMode = Effect.fn(function* (
	projectRoot: string
) {
	const glob = new Bun.Glob('**/*.css')
	const files = Arr.fromIterable(
		glob.scanSync({ absolute: true, cwd: projectRoot })
	)
	const entrypoint = Arr.head(files)

	if (Option.isNone(entrypoint))
		return yield* Effect.fail(new Error('No CSS files found for Tailwind CSS.'))

	// Create a temp output file
	const outputFile = `${projectRoot}/node_modules/.cache/render/tailwind.css`

	// Ensure the cache directory exists
	yield* Effect.tryPromise(async () => {
		await Bun.write(outputFile, '')
	})

	// Start Tailwind in watch mode - use 'inherit' for stderr to see errors
	const proc = Bun.spawn(
		[
			'bunx',
			'@tailwindcss/cli',
			'-i',
			entrypoint.value,
			'-o',
			outputFile,
			'--minify',
			'--watch'
		],
		{
			cwd: projectRoot,
			stdout: 'ignore',
			stderr: 'inherit'
		}
	)

	tailwindWatcher = { proc, outputFile }

	// Wait for initial compilation and poll for file to have content
	let attempts = 0
	while (attempts < 20) {
		yield* Effect.sleep('100 millis')
		const file = Bun.file(outputFile)
		const size = file.size
		if (size > 0) {
			const content = yield* Effect.tryPromise(() => file.text())
			if (content.length > 0) {
				cachedCssOutput = content
				console.log(
					`   [Tailwind] Initial compilation: ${content.length} bytes`
				)
				break
			}
		}
		attempts++
	}

	return { outputFile }
})

// Read the latest CSS from the watch mode output with retry
export const getWatchedCss = Effect.fn(function* () {
	if (!tailwindWatcher) {
		console.log(
			'   [CSS Debug] No tailwind watcher, using cached:',
			(cachedCssOutput ?? '').length,
			'bytes'
		)
		return cachedCssOutput ?? ''
	}

	// Try to read with retries (Tailwind might be mid-write)
	let attempts = 0
	while (attempts < 10) {
		const css = yield* Effect.tryPromise(async () => {
			if (!tailwindWatcher) return ''
			const file = Bun.file(tailwindWatcher.outputFile)
			return file.text()
		})

		if (css.length > 0) {
			cachedCssOutput = css // Update cache
			console.log('   [CSS Debug] Read from watcher:', css.length, 'bytes')
			return css
		}

		// File is empty, Tailwind might be recompiling - wait and retry
		yield* Effect.sleep('50 millis')
		attempts++
	}

	// Fall back to cached if file is still empty
	console.log(
		'   [CSS Debug] File empty, using cached:',
		(cachedCssOutput ?? '').length,
		'bytes'
	)
	return cachedCssOutput ?? ''
})

// Stop the Tailwind watcher
export const stopTailwindWatcher = () => {
	if (tailwindWatcher) {
		tailwindWatcher.proc.kill()
		tailwindWatcher = null
	}
}
