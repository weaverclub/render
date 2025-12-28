import { createRoot, type Root } from 'react-dom/client'
import './styles.css'
import { queryClient } from './api'
import { App } from './app'

const elem = document.getElementById('root')

if (!elem) throw new Error('Root element not found')

// HMR WebSocket client
function setupHMR() {
	let reconnectAttempts = 0
	const maxReconnectAttempts = 10

	function refreshIframes() {
		// Find all iframes and refresh them by updating their src
		const iframes = document.querySelectorAll('iframe')
		iframes.forEach((iframe) => {
			const currentSrc = iframe.src
			// Add or update a cache-busting param
			const url = new URL(currentSrc)
			url.searchParams.set('_hmr', Date.now().toString())
			iframe.src = url.toString()
		})
		console.log(`[HMR] Refreshed ${iframes.length} iframe(s)`)

		// Invalidate stories query to refetch sidebar
		queryClient.invalidateQueries({ queryKey: ['stories'] })
		console.log('[HMR] Invalidated stories query')
	}

	function connect() {
		const ws = new WebSocket(`ws://${location.host}/__hmr`)

		ws.onopen = () => {
			console.log('[HMR] Connected')
			reconnectAttempts = 0
		}

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data)
			if (data.type === 'reload') {
				console.log('[HMR] Reloading iframes...')
				refreshIframes()
			}
		}

		ws.onclose = () => {
			console.log('[HMR] Disconnected')
			if (reconnectAttempts < maxReconnectAttempts) {
				reconnectAttempts++
				setTimeout(connect, 1000 * Math.min(reconnectAttempts, 5))
			}
		}

		ws.onerror = () => ws.close()
	}

	connect()
}

if (import.meta.hot) {
	let root: Root = import.meta.hot.data.root

	if (!root) root = import.meta.hot.data.root = createRoot(elem)

	root.render(<App />)
} else {
	createRoot(elem).render(<App />)
}

// Always set up our custom WebSocket HMR
setupHMR()
