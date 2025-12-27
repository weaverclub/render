import { Tabs } from '@base-ui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api'
import { AppSidebar } from './components/appSidebar'
import { SidebarProvider } from './components/sidebar'
import { TabContent } from './components/tabContent'
import { TabList } from './components/tabList'

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<AppSidebar />
				<main className="flex flex-col w-full">
					<Tabs.Root>
						<TabList />
						<TabContent />
					</Tabs.Root>
				</main>
			</SidebarProvider>
		</QueryClientProvider>
	)
}
