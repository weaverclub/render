import { createMemoryHistory, type RouterHistory } from '@tanstack/react-router'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const activeTabIdAtom = atomWithStorage<string | null>(
	'activeTabId',
	null
)
export const tabsAtom = atomWithStorage<Tab[]>('tabs', [])
export const tabsHistoryAtom = atom<Record<string, RouterHistory>>((get) =>
	get(tabsAtom).reduce(
		(acc, tab) => {
			acc[tab.id] = createMemoryHistory({
				initialEntries: [tab.path]
			})
			return acc
		},
		{} as Record<string, RouterHistory>
	)
)

export function useTabs() {
	return useAtom(tabsAtom)
}

export function useActiveTab() {
	const [tabs] = useAtom(tabsAtom)
	const [activeTabId, setActiveTab] = useAtom(activeTabIdAtom)
	const [tabsHistory] = useAtom(tabsHistoryAtom)

	const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null
	const tabHistory = activeTabId ? tabsHistory[activeTabId] : null

	return { activeTab, setActiveTab, tabHistory }
}

export function useNewTab() {
	const [, setTabs] = useAtom(tabsAtom)
	const [, setActiveTab] = useAtom(activeTabIdAtom)

	return (tab: Omit<Tab, 'id'>) => {
		const id = crypto.randomUUID()

		setTabs((tabs) => [...tabs, { ...tab, id }])
		setActiveTab(id)

		return id
	}
}

export function useMarkTabAsPermanent() {
	const [tabs, setTabs] = useAtom(tabsAtom)

	return (id: string) => {
		setTabs(
			tabs.map((tab) => (tab.id === id ? { ...tab, temporary: false } : tab))
		)
	}
}

export function useCloseTab() {
	const [tabs, setTabs] = useAtom(tabsAtom)
	const [activeTabId, setActiveTab] = useAtom(activeTabIdAtom)

	return (id: string) => {
		setTabs(tabs.filter((tab) => tab.id !== id))

		if (activeTabId === id) {
			const tabIndex = tabs.findIndex((tab) => tab.id === id)
			const newActiveTab = tabs[tabIndex - 1] || tabs[tabIndex + 1] || null
			setActiveTab(newActiveTab ? newActiveTab.id : null)
		}
	}
}

export function useReplaceTab() {
	const [tabs, setTabs] = useAtom(tabsAtom)

	return (id: string, newTab: Omit<Tab, 'id'>) => {
		setTabs(tabs.map((tab) => (tab.id === id ? { ...newTab, id } : tab)))
	}
}

export type Tab = {
	id: string
	name: string
	path: string
	temporary: boolean
}
