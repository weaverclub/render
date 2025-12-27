import { Tabs } from '@base-ui/react/tabs'
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react'
import { useCloseTab, useMarkTabAsPermanent, useTabs } from '#ui/tabs'
import { Button } from './button'

export function TabList() {
	const [tabs] = useTabs()
	const markTabAsPermanent = useMarkTabAsPermanent()
	const closeTab = useCloseTab()

	return (
		<Tabs.List className="border-b h-8 bg-sidebar flex w-full">
			{tabs.length > 0 && (
				<div className="flex h-full items-center px-1.5 gap-0.5 border-r">
					<Button variant="ghost" size="icon-sm">
						<ArrowLeftIcon />
					</Button>
					<Button variant="ghost" size="icon-sm">
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
