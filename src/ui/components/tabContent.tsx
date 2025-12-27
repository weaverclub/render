import { Tabs } from '@base-ui/react'
import { useTabs } from '#ui/tabs'

export function TabContent() {
	const [tabs] = useTabs()

	return (
		<>
			{tabs.map((tab) => (
				<Tabs.Panel key={tab.id} value={tab.id}>
					<iframe
						src={`/iframe/${tab.path}`}
						className="w-full h-full border-none bg-white"
						title={tab.name}
					/>
				</Tabs.Panel>
			))}
		</>
	)
}
