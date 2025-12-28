import { watch } from 'node:fs'
import { Path } from '@effect/platform'
import { BunContext } from '@effect/platform-bun'
import { Console, Effect } from 'effect'
import { loadCSS } from '#core/css/css'
import { compileTailwindCss } from '#core/css/tailwind'
import { loadStories } from '#core/story'
import {
	notifyHmrClients,
	startBackend,
	updateBackendState
} from '#server/backend'

export const renderCommand = Effect.fn(function* ({ path }: RenderCommandArgs) {
	const { resolve } = yield* Path.Path

	const absolutePath = resolve(path)

	let stories = yield* loadStories(absolutePath)
	let css = yield* loadCSS(absolutePath)

	yield* Console.log(`Found ${stories.length} stories`)

	const backend = yield* startBackend({
		stories,
		css,
		projectRoot: absolutePath
	})

	yield* Console.log('👀 Watching for file changes...')

	// Set up file watcher for HMR
	let debounceTimer: ReturnType<typeof setTimeout> | null = null
	const watcher = watch(
		absolutePath,
		{ recursive: true },
		(_event, filename) => {
			// Only react to relevant file changes
			if (!filename) return

			// Ignore node_modules entirely
			if (filename.includes('node_modules')) return

			const isRelevant =
				filename.endsWith('.tsx') ||
				filename.endsWith('.ts') ||
				filename.endsWith('.jsx') ||
				filename.endsWith('.js') ||
				filename.endsWith('.css')

			if (!isRelevant) return

			// Debounce rapid changes
			if (debounceTimer) clearTimeout(debounceTimer)
			debounceTimer = setTimeout(async () => {
				console.log(`\n🔄 File changed: ${filename}`)
				console.time('   ⏱️  Total HMR')

				try {
					// Run story loading and CSS compilation in parallel
					// Total time = max(stories, css) instead of sum
					const [newStories, newCss] = await Promise.all([
						Effect.runPromise(
							loadStories(absolutePath).pipe(Effect.provide(BunContext.layer))
						),
						Effect.runPromise(
							compileTailwindCss(absolutePath).pipe(
								Effect.provide(BunContext.layer)
							)
						)
					])

					stories = newStories
					css = [newCss]
					console.log(
						`   Reloaded ${stories.length} stories, CSS: ${newCss.compiledOutput.length} bytes`
					)

					// Update backend state for new requests
					updateBackendState({
						stories,
						css,
						projectRoot: absolutePath
					})

					// Notify connected clients
					notifyHmrClients()
					console.timeEnd('   ⏱️  Total HMR')
					console.log(`   ✅ HMR complete`)
				} catch (error) {
					console.timeEnd('   ⏱️  Total HMR')
					console.error('   Error during reload:', error)
				}
			}, 100)
		}
	)

	// Handle cleanup on exit
	process.on('SIGINT', () => {
		console.log('\n\n👋 Shutting down...')
		watcher.close()
		backend.stop()
		process.exit(0)
	})

	// Keep the server running
	yield* Effect.never
})

type RenderCommandArgs = {
	path: string
}
