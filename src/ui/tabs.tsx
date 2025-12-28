import { createMemoryHistory, type RouterHistory } from '@tanstack/react-router'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { GetStoriesResponse } from './api'

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

// Track previous stories for detecting changes
export const previousStoriesAtom = atom<GetStoriesResponse | null>(null)

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

// Hook to synchronize tabs with story changes (redirect orphaned tabs)
export function useSyncTabsWithStories() {
	const [tabs, setTabs] = useAtom(tabsAtom)
	const [activeTabId, setActiveTab] = useAtom(activeTabIdAtom)
	const [previousStories, setPreviousStories] = useAtom(previousStoriesAtom)

	return (currentStories: GetStoriesResponse) => {
		// Get all current story paths
		const currentPaths = new Set<string>()
		for (const category of Object.values(currentStories)) {
			for (const story of category) {
				currentPaths.add(story.path)
			}
		}

		// Get all previous story paths for change detection
		const previousPaths = new Set<string>()
		if (previousStories) {
			for (const category of Object.values(previousStories)) {
				for (const story of category) {
					previousPaths.add(story.path)
				}
			}
		}

		// Find tabs that point to stories that no longer exist
		const orphanedTabs = tabs.filter((tab) => !currentPaths.has(tab.path))

		if (orphanedTabs.length > 0) {
			// Find new stories that weren't in the previous list (likely renames)
			const newStories: Array<{ path: string; name: string }> = []
			for (const category of Object.values(currentStories)) {
				for (const story of category) {
					if (!previousPaths.has(story.path)) {
						newStories.push(story)
					}
				}
			}

			// Try to redirect orphaned tabs to new stories (by similar name matching)
			const updatedTabs = tabs.map((tab) => {
				if (!currentPaths.has(tab.path)) {
					// Try to find a match by similar name
					const matchedStory = newStories.find((story) => {
						// Check if the new story name is similar (edit distance or contains match)
						const oldName = tab.name.toLowerCase()
						const newName = story.name.toLowerCase()
						return (
							newName.includes(oldName) ||
							oldName.includes(newName) ||
							levenshteinDistance(oldName, newName) <= 3
						)
					})

					if (matchedStory) {
						// Remove matched story from pool to avoid duplicate matches
						const index = newStories.indexOf(matchedStory)
						if (index > -1) newStories.splice(index, 1)

						return {
							...tab,
							path: matchedStory.path,
							name: matchedStory.name
						}
					}
				}
				return tab
			})

			// Remove tabs that couldn't be redirected
			const validTabs = updatedTabs.filter((tab) => currentPaths.has(tab.path))

			if (
				validTabs.length !== tabs.length ||
				updatedTabs.some((t, i) => t.path !== tabs[i]?.path)
			) {
				setTabs(validTabs)

				// If active tab was removed, select the first available tab
				if (activeTabId && !validTabs.find((t) => t.id === activeTabId)) {
					setActiveTab(validTabs[0]?.id ?? null)
				}
			}
		}

		// Update previous stories for next comparison
		setPreviousStories(currentStories)
	}
}

// Simple Levenshtein distance for fuzzy matching renamed stories
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = []

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i]
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1]
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1
				)
			}
		}
	}

	return matrix[b.length][a.length]
}

export type Tab = {
	id: string
	name: string
	path: string
	temporary: boolean
}
