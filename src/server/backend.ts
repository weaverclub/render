import { BunContext } from '@effect/platform-bun'
import { Console, Effect } from 'effect'
import type { CSS } from '#core/css/css'
import type { ReactStory } from '#react/reactStory'
import index from '../ui/index.html'
import { getStories } from './api/getStories'
import { renderIframe } from './api/renderIframe'

// Track connected WebSocket clients for HMR
const hmrClients = new Set<{ send: (msg: string) => void }>()

export const notifyHmrClients = () => {
	for (const client of hmrClients) {
		try {
			client.send(JSON.stringify({ type: 'reload' }))
		} catch {
			hmrClients.delete(client)
		}
	}
}

// Mutable state for HMR updates
// biome-ignore lint/suspicious/noExplicitAny: Required for story typing
let currentStories: ReactStory<any>[] = []
let currentCss: CSS[] = []
let currentProjectRoot = ''

export const updateBackendState = ({
	stories,
	css,
	projectRoot
}: StartBackendArgs) => {
	currentStories = stories
	currentCss = css
	currentProjectRoot = projectRoot
}

export const startBackend = ({ stories, css, projectRoot }: StartBackendArgs) =>
	Effect.sync(() => {
		// Initialize mutable state
		currentStories = stories
		currentCss = css
		currentProjectRoot = projectRoot

		return Bun.serve({
			port: 3210,
			routes: {
				'/iframe/*': {
					GET: (request) =>
						Effect.runPromise(
							renderIframe({
								request,
								stories: currentStories,
								css: currentCss,
								projectRoot: currentProjectRoot
							}).pipe(Effect.provide(BunContext.layer))
						)
				},
				'/api/stories': {
					GET: (request) =>
						Effect.runSync(getStories({ request, stories: currentStories }))
				},
				// Explicit routes for UI paths
				'/': index,
				'/index.html': index
			},
			// @ts-expect-error
			fetch(req, server) {
				const url = new URL(req.url)

				// Handle WebSocket upgrade for HMR
				if (url.pathname === '/__hmr') {
					const upgraded = server.upgrade(req)
					if (upgraded) return undefined
					return new Response('WebSocket upgrade failed', { status: 500 })
				}

				// Fall back to index for any other paths (SPA routing)
				return index
			},
			websocket: {
				open(ws) {
					hmrClients.add(ws)
					console.log('🔌 HMR client connected')
				},
				close(ws) {
					hmrClients.delete(ws)
					console.log('🔌 HMR client disconnected')
				},
				message(_ws, _message) {
					// No client messages expected
				}
			}
		})
	}).pipe(
		Effect.tap(() => Console.log('Backend started on http://localhost:3210'))
	)

type StartBackendArgs = {
	// biome-ignore lint/suspicious/noExplicitAny: Required for story typing
	stories: ReactStory<any>[]
	css: CSS[]
	projectRoot: string
}
