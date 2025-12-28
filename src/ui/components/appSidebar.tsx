import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getStories } from '#ui/api'
import { useSyncTabsWithStories } from '#ui/tabs'
import { Button } from './button'
import { Kbd } from './kdb'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu
} from './sidebar'
import { Spinner } from './spinner'
import { TabButton } from './tabButton'

export function AppSidebar() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['stories'],
		queryFn: getStories
	})

	const syncTabsWithStories = useSyncTabsWithStories()

	// Sync tabs with stories whenever stories change
	useEffect(() => {
		if (data) {
			syncTabsWithStories(data)
		}
	}, [data, syncTabsWithStories])

	return (
		<Sidebar>
			<SidebarHeader>
				<Button
					variant="outline"
					size="lg"
					className="flex justify-between gap-1 w-full text-zinc-500 font-normal"
				>
					<span>Search...</span>
					<Kbd>⌘ K</Kbd>
				</Button>
			</SidebarHeader>

			<SidebarContent>
				{isLoading && (
					<div className="w-full py-8 flex items-center justify-center">
						<Spinner />
					</div>
				)}
				{error && (
					<div className="w-full py-8 flex flex-col items-center justify-center text-center gap-2">
						<p className="text-xs text-destructive font-medium">
							Failed to load stories.
						</p>
						<p className="text-xs text-muted-foreground">
							Check if your server is running and accessible.
						</p>
					</div>
				)}
				{data &&
					Object.keys(data).map((storyGroup) => (
						<SidebarGroup key={storyGroup}>
							<SidebarGroupLabel>{storyGroup}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{data[storyGroup]?.map((story) => (
										<TabButton
											key={story.path}
											story={{
												id: story.path,
												name: story.name
											}}
										>
											<span>{story.name}</span>
										</TabButton>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
			</SidebarContent>
		</Sidebar>
	)
}
