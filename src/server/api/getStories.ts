import { Effect } from 'effect'
import type { ReactStory } from '#react/reactStory'

export const getStories = ({ stories }: GetStoriesArgs) =>
	Effect.sync(() => {
		const categorizedStories: Record<string, SimpleStory[]> = {}

		for (const story of stories) {
			const [category, storyName] = story.name.split('/')

			if (!category || !storyName) continue

			if (!categorizedStories[category]) {
				categorizedStories[category] = []
			}

			categorizedStories[category].push({
				name: storyName,
				path: story.id
			})
		}

		const sortedCategories = Object.keys(categorizedStories).sort()

		for (const category of sortedCategories) {
			categorizedStories[category]?.sort((a, b) => a.name.localeCompare(b.name))
		}

		return new Response(JSON.stringify(categorizedStories), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	})

type SimpleStory = {
	name: string
	path: string
}

type GetStoriesArgs = {
	request: Request
	// biome-ignore lint/suspicious/noExplicitAny: Required for ReactStory type
	stories: ReactStory<any>[]
}
