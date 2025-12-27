import type { ComponentProps } from 'react'
import { useActiveTab, useNewTab, useReplaceTab, useTabs } from '#ui/tabs'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from './contextMenu'
import { SidebarMenuButton } from './sidebar'

export function TabButton({ story, ...props }: TabButtonProps) {
	const [tabs] = useTabs()
	const { activeTab, setActiveTab } = useActiveTab()
	const newTab = useNewTab()
	const replaceTab = useReplaceTab()

	function handleOpen(state: 'temporary' | 'permanent') {
		return () => {
			const existingTab = tabs.find((tab) => tab.path === story.id)

			if (existingTab) {
				return setActiveTab(existingTab.id)
			}

			if (activeTab?.temporary) {
				return replaceTab(activeTab.id, {
					name: story.name,
					path: story.id,
					temporary: state === 'temporary'
				})
			}

			return newTab({
				name: story.name,
				path: story.id,
				temporary: state === 'temporary'
			})
		}
	}

	function handleOpenInNewTab() {
		return () => {
			newTab({
				name: story.name,
				path: story.id,
				temporary: false
			})
		}
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger
				render={
					<SidebarMenuButton
						onClick={handleOpen('temporary')}
						onDoubleClick={handleOpen('permanent')}
						{...props}
					/>
				}
			/>

			<ContextMenuContent>
				<ContextMenuItem onSelect={handleOpen('permanent')}>
					Open
				</ContextMenuItem>
				<ContextMenuItem onSelect={handleOpenInNewTab()}>
					Open in New Tab
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

type TabButtonProps = ComponentProps<typeof SidebarMenuButton> & {
	story: {
		name: string
		id: string
	}
}
