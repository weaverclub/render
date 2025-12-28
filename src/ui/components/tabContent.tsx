import { Tabs } from '@base-ui/react'
import { useMemo, useRef } from 'react'
import { cn } from '#ui/cn'
import { useMarkTabAsPermanent, useTabs } from '#ui/tabs'

export function TabContent() {
	const [tabs] = useTabs()
	const markTabAsPermanent = useMarkTabAsPermanent()
	const visitedPathsRef = useRef<string[]>([])
	const MAX_CACHE = 15

	// Build a global list of visited paths across all tabs
	const visitedPaths = useMemo(() => {
		console.info('[TabContent] recompute visited paths', {
			tabs: tabs.map((t) => t.path),
			cache: visitedPathsRef.current
		})
		const cache = [...visitedPathsRef.current]
		let changed = false
		for (const tab of tabs) {
			if (!cache.includes(tab.path)) {
				console.info('[TabContent] adding path to cache', tab.path)
				cache.push(tab.path)
				changed = true
			}
		}
		if (cache.length > MAX_CACHE) {
			cache.splice(0, cache.length - MAX_CACHE)
			changed = true
		}
		if (changed) {
			visitedPathsRef.current = cache
			return [...cache]
		}
		return visitedPathsRef.current
	}, [tabs])

	return (
		<>
			{tabs.map((tab) => (
				<Tabs.Panel
					key={tab.id}
					value={tab.id}
					className="flex-1 min-h-0 data-[hidden]:hidden"
					keepMounted
				>
					<TabIframeCache
						activePath={tab.path}
						title={tab.name}
						onInteract={markTabAsPermanent}
						visitedPaths={visitedPaths}
					/>
				</Tabs.Panel>
			))}
		</>
	)
}

type TabIframeCacheProps = {
	activePath: string
	title: string
	onInteract: (id: string) => void
	visitedPaths: string[]
}

function TabIframeCache({
	activePath,
	title,
	onInteract,
	visitedPaths
}: TabIframeCacheProps) {
	return (
		<div className="w-full h-full relative">
			{visitedPaths.map((path) => (
				<iframe
					key={path}
					src={`/iframe/${path}`}
					className={cn(
						'w-full h-full border-none bg-white absolute inset-0',
						path === activePath
							? 'visible opacity-100'
							: 'invisible opacity-0 pointer-events-none'
					)}
					title={title}
					onPointerDown={() => {
						console.info('[TabContent] iframe interact', { path: activePath })
						onInteract(activePath)
					}}
				/>
			))}
		</div>
	)
}
