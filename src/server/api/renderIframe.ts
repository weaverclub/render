import type { BunRequest } from 'bun'
import { Effect } from 'effect'
import { renderToReadableStream } from 'react-dom/server'
import { bundleStoryForBrowser } from '#core/bundler'
import type { CSS } from '#core/css/css'
import { mountHTML } from '#core/html'
import { getDefaultPropsForReactComponent } from '#react/reactControlBuilder'
import type { ReactStory } from '#react/reactStory'
import { streamToString } from '#server/streaming'

export const renderIframe = Effect.fn(function* ({
	request,
	css,
	stories,
	projectRoot
}: RenderIframeArgs) {
	const storyId = request.url.split('/iframe/')[1]?.split('?')[0] // Strip query params
	const story = stories.find((s) => s.id === storyId)

	if (!story) return new Response('Story not found', { status: 404 })

	const defaultProps = getDefaultPropsForReactComponent(story)

	const element = story.render(defaultProps)

	const stream = yield* Effect.tryPromise(() => renderToReadableStream(element))

	const html = yield* streamToString(stream)

	// Bundle the story for browser hydration
	let bundledScript: string | undefined
	if (story.sourcePath) {
		const bundleResult = yield* bundleStoryForBrowser({
			storyPath: story.sourcePath,
			projectRoot,
			storyId: story.id
		}).pipe(Effect.option)

		if (bundleResult._tag === 'Some') {
			bundledScript = bundleResult.value
		}
	}

	const mountedHTML = yield* mountHTML({
		css,
		element: html,
		bundledScript
	})

	return new Response(mountedHTML, {
		headers: {
			'Content-Type': 'text/html',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			Pragma: 'no-cache',
			Expires: '0'
		}
	})
})

type RenderIframeArgs = {
	request: BunRequest<'iframe/*'>
	// biome-ignore lint/suspicious/noExplicitAny: Required for ReactStory type
	stories: ReactStory<any>[]
	css: CSS[]
	projectRoot: string
}
