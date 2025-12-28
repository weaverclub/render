import type { BunRequest } from 'bun'
import { Effect } from 'effect'
import { bundleStoryForBrowser } from '#core/bundler'
import type { CSS } from '#core/css/css'
import type { ReactStory } from '#react/reactStory'

/**
 * Render iframe using client-side only rendering.
 * This avoids SSR issues with duplicate React instances.
 */
export const renderIframe = Effect.fn(function* ({
	request,
	css,
	stories,
	projectRoot
}: RenderIframeArgs) {
	const storyId = request.url.split('/iframe/')[1]?.split('?')[0] // Strip query params
	console.log('[renderIframe] 🔍 Request URL:', request.url)
	console.log('[renderIframe] 🔍 Story ID:', storyId)
	console.log(
		'[renderIframe] 🔍 Available stories:',
		stories.map((s) => ({ id: s.id, sourcePath: s.sourcePath }))
	)
	console.log('[renderIframe] 🔍 Project root:', projectRoot)

	const story = stories.find((s) => s.id === storyId)

	if (!story) {
		console.log('[renderIframe] ❌ Story not found!')
		return new Response('Story not found', { status: 404 })
	}

	console.log('[renderIframe] ✅ Found story:', {
		id: story.id,
		sourcePath: story.sourcePath
	})

	// Bundle the story for browser - will be rendered client-side
	let bundledScript: string | undefined
	let bundleError: string | undefined
	if (story.sourcePath) {
		console.log('[renderIframe] 📦 Starting bundle for:', story.sourcePath)
		const bundleResult = yield* bundleStoryForBrowser({
			storyPath: story.sourcePath,
			projectRoot,
			storyId: story.id
		}).pipe(
			Effect.tapError((err) =>
				Effect.sync(() => {
					console.log('[renderIframe] ❌ Bundle error:', err)
					bundleError = String(err)
				})
			),
			Effect.option
		)

		if (bundleResult._tag === 'Some') {
			console.log(
				'[renderIframe] ✅ Bundle success! Size:',
				bundleResult.value.length,
				'bytes'
			)
			bundledScript = bundleResult.value
		} else {
			console.log('[renderIframe] ❌ Bundle returned None')
		}
	} else {
		console.log('[renderIframe] ❌ No sourcePath on story!')
	}

	if (!bundledScript) {
		const errorMsg = `Failed to bundle story. Error: ${bundleError || 'Unknown'}`
		console.log('[renderIframe] ❌', errorMsg)
		return new Response(errorMsg, { status: 500 })
	}

	// Build CSS string
	console.log('[renderIframe] 🎨 CSS array length:', css.length)
	console.log(
		'[renderIframe] 🎨 CSS entries:',
		css.map((c) => ({
			paths: c.paths,
			contentLength: c.compiledOutput?.length
		}))
	)
	const cssString = css.map((c) => c.compiledOutput).join('\n')
	console.log('[renderIframe] 🎨 Total CSS length:', cssString.length)

	// Base64 encode the script to avoid any HTML parsing issues
	const scriptBase64 = Buffer.from(bundledScript).toString('base64')

	// Generate HTML with client-side only rendering (no SSR)
	// Use a blob URL approach to completely avoid script content parsing issues
	const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssString}</style>
</head>
<body>
<div id="root"></div>
<script>
(function() {
  var script = atob("${scriptBase64}");
  var blob = new Blob([script], { type: 'application/javascript' });
  var url = URL.createObjectURL(blob);
  var s = document.createElement('script');
  s.type = 'module';
  s.src = url;
  document.body.appendChild(s);
})();
</script>
</body>
</html>`

	return new Response(html, {
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
