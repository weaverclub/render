import { Tabs } from '@base-ui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryClient } from './api'
import { AppSidebar } from './components/appSidebar'
import { SidebarProvider } from './components/sidebar'
import { TabContent } from './components/tabContent'
import { TabList } from './components/tabList'
import { useActiveTab, useTabs } from './tabs'

export function App() {
	const { activeTab, setActiveTab } = useActiveTab()
	const [tabs] = useTabs()

	const tabValue = activeTab?.id ?? null

	useEffect(() => {
		const firstTab = tabs[0]

		if (firstTab && !activeTab) {
			setActiveTab(firstTab.id)
		}
	}, [setActiveTab, activeTab, tabs])

	return (
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<AppSidebar />
				<main className="flex flex-col w-full h-screen overflow-hidden">
					<Tabs.Root
						className="flex flex-col flex-1 min-h-0"
						value={tabValue}
						onValueChange={(value) => setActiveTab(value as string)}
					>
						<TabList />
						<TabContent />
					</Tabs.Root>
				</main>
			</SidebarProvider>
		</QueryClientProvider>
	)
}
