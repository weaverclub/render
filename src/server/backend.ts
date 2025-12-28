import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BunContext } from '@effect/platform-bun'
import { Console, Effect } from 'effect'
import type { CSS } from '#core/css/css'
import type { ReactStory } from '#react/reactStory'
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

// Get the directory where the CLI is located
const getCliDir = () => {
	// Use Node's fileURLToPath which handles Windows paths and URL encoding correctly
	const currentFilePath = fileURLToPath(import.meta.url)
	return path.dirname(currentFilePath)
}

// Create a Response from a static file
const serveStaticFile = async (filePath: string, contentType: string) => {
	const file = Bun.file(filePath)
	if (await file.exists()) {
		return new Response(file, {
			headers: { 'Content-Type': contentType }
		})
	}
	return new Response('Not found', { status: 404 })
}

export const startBackend = ({ stories, css, projectRoot }: StartBackendArgs) =>
	Effect.sync(() => {
		// Initialize mutable state
		currentStories = stories
		currentCss = css
		currentProjectRoot = projectRoot

		const cliDir = getCliDir()

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
				}
			},
			// @ts-expect-error
			async fetch(req, server) {
				const url = new URL(req.url)

				// Handle WebSocket upgrade for HMR
				if (url.pathname === '/__hmr') {
					const upgraded = server.upgrade(req)
					if (upgraded) return undefined
					return new Response('WebSocket upgrade failed', { status: 500 })
				}

				// Serve chunk files (JS and CSS assets)
				if (url.pathname.startsWith('/chunk-')) {
					const filename = url.pathname.slice(1) // Remove leading /
					const filePath = path.join(cliDir, filename)
					const ext = path.extname(filename)
					const contentType =
						ext === '.js'
							? 'application/javascript'
							: ext === '.css'
								? 'text/css'
								: 'application/octet-stream'
					return serveStaticFile(filePath, contentType)
				}

				// Serve index.html for all other routes (SPA)
				const indexPath = path.join(cliDir, 'index.html')
				return serveStaticFile(indexPath, 'text/html')
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
