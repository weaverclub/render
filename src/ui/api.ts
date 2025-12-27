import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

export async function getStories(): Promise<GetStoriesResponse> {
	return fetch('/api/stories').then((res) => res.json())
}

export type GetStoriesResponse = {
	[category: string]: Story[]
}

export type Story = {
	name: string
	path: string
}
