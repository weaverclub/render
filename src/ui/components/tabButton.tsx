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

	const open = (state: 'temporary' | 'permanent') => {
		console.info('[TabButton] open', { story: story.id, state })
		const existingTab = tabs.find((tab) => tab.path === story.id)

		if (existingTab) {
			console.info('[TabButton] focusing existing tab', existingTab.id)
			setActiveTab(existingTab.id)
			return
		}

		if (activeTab?.temporary) {
			console.info('[TabButton] replacing temporary tab', activeTab.id)
			replaceTab(activeTab.id, {
				name: story.name,
				path: story.id,
				temporary: state === 'temporary'
			})
			return
		}

		newTab({
			name: story.name,
			path: story.id,
			temporary: state === 'temporary'
		})
	}

	const openInNewTab = () => {
		console.info('[TabButton] open in new tab', { story: story.id })
		newTab({
			name: story.name,
			path: story.id,
			temporary: false
		})
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger
				render={
					<SidebarMenuButton
						onClick={() => open('temporary')}
						onDoubleClick={() => open('permanent')}
						{...props}
					/>
				}
			/>

			<ContextMenuContent>
				<ContextMenuItem
					onSelect={(event) => {
						event.preventDefault?.()
						event.stopPropagation?.()
						console.info('[TabButton] context open')
						open('permanent')
					}}
					onClick={(event) => {
						event.preventDefault()
						event.stopPropagation()
						console.info('[TabButton] context open click')
						open('permanent')
					}}
				>
					Open
				</ContextMenuItem>
				<ContextMenuItem
					onSelect={(event) => {
						event.preventDefault?.()
						event.stopPropagation?.()
						console.info('[TabButton] context open in new tab')
						openInNewTab()
					}}
					onClick={(event) => {
						event.preventDefault()
						event.stopPropagation()
						console.info('[TabButton] context open in new tab click')
						openInNewTab()
					}}
				>
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
