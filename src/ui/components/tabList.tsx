import { Tabs } from '@base-ui/react/tabs'
import { useAtom } from 'jotai'
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react'
import { useEffect } from 'react'
import {
	previousStoriesAtom,
	tabsHistoryAtom,
	useActiveTab,
	useCloseTab,
	useMarkTabAsPermanent,
	useTabs
} from '#ui/tabs'
import { Button } from './button'

export function TabList() {
	const { activeTab } = useActiveTab()
	const [tabs, setTabs] = useTabs()
	const [tabHistories] = useAtom(tabsHistoryAtom)
	const [previousStories] = useAtom(previousStoriesAtom)
	const markTabAsPermanent = useMarkTabAsPermanent()
	const closeTab = useCloseTab()

	const activeHistory = activeTab ? tabHistories[activeTab.id] : null
	const canGoBack = activeHistory?.canGoBack() ?? false
	const canGoForward = activeHistory
		? (activeHistory.location.state?.__TSR_index ?? 0) <
			activeHistory.length - 1
		: false

	useEffect(() => {
		if (!activeTab || !activeHistory) return

		const resolveName = (path: string) => {
			if (!previousStories) return null
			for (const category of Object.values(previousStories)) {
				for (const story of category) {
					if (story.path === path) return story.name
				}
			}
			return null
		}

		const unsubscribe = activeHistory.subscribe(({ location }) => {
			const nextName = resolveName(location.href)
			setTabs((current) =>
				current.map((tab) =>
					tab.id === activeTab.id
						? {
								...tab,
								path: location.href,
								name: nextName ?? tab.name
							}
						: tab
				)
			)
		})

		return unsubscribe
	}, [activeTab, activeHistory, previousStories, setTabs])

	return (
		<Tabs.List className="border-b h-8 bg-sidebar flex w-full">
			{tabs.length > 0 && (
				<div className="flex h-full items-center px-1.5 gap-0.5 border-r">
					<Button
						variant="ghost"
						size="icon-sm"
						disabled={!canGoBack}
						onClick={() => activeHistory?.back()}
					>
						<ArrowLeftIcon />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						disabled={!canGoForward}
						onClick={() => activeHistory?.forward()}
					>
						<ArrowRightIcon />
					</Button>
				</div>
			)}
			{tabs.map((tab) => (
				<Tabs.Tab
					nativeButton={false}
					render={<div />}
					key={tab.id}
					value={tab.id}
					className="px-6 h-8 border-r text-xs flex items-center justify-center relative group data-[temporary=true]:italic select-none"
					data-temporary={tab.temporary}
					onClick={() => {
						if (tab.temporary) {
							markTabAsPermanent(tab.id)
						}
					}}
				>
					{tab.name}
					<Button
						size="icon-xs"
						variant="ghost"
						className="absolute right-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 p-0"
						onClick={(e) => {
							e.stopPropagation()
							closeTab(tab.id)
						}}
					>
						<XIcon />
					</Button>
				</Tabs.Tab>
			))}
		</Tabs.List>
	)
}
