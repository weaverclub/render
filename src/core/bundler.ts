import { FileSystem } from '@effect/platform'
import { Effect, Option, Schema } from 'effect'
import { findNearestNodeModules, getProjectDependencies } from './pkg'
import { findNearestTsconfig } from './tsconfig'

// Common React-related packages that might not be direct dependencies
const commonExternals = [
	'react',
	'react-dom',
	'react/jsx-runtime',
	'react/jsx-dev-runtime',
	'@weaverclub/render'
]

const moduleSchema = Schema.Record({
	key: Schema.String,
	value: Schema.Any
})

export const bundleStoryFile = Effect.fn(function* ({
	storyPath,
	projectRoot
}: BundleStoryFileArgs) {
	const tsconfigPath = yield* findNearestTsconfig(projectRoot)
	const deps = yield* getProjectDependencies(projectRoot)
	const args = ['build', storyPath, '--target', 'bun', '--format', 'esm']

	for (const dep of deps) args.push('--external', dep)
	for (const ext of commonExternals)
		if (!deps.includes(ext)) args.push('--external', ext)
	if (Option.isSome(tsconfigPath))
		args.push('--tsconfig-override', tsconfigPath.value)

	const proc = Bun.spawn(['bun', ...args], {
		cwd: projectRoot,
		stdout: 'pipe',
		stderr: 'pipe'
	})

	const [stdout, stderr] = yield* Effect.all(
		[
			Effect.tryPromise(() => new Response(proc.stdout).text()),
			Effect.tryPromise(() => new Response(proc.stderr).text())
		],
		{
			concurrency: 'unbounded'
		}
	)

	const exitCode = yield* Effect.tryPromise(() => proc.exited)

	// Check if we got valid bundled output (starts with bun comment or contains export)
	// Bun may exit with non-zero code due to internal warnings but still produce valid output
	const hasValidOutput =
		stdout.startsWith('// @bun') || stdout.includes('export {')

	if (exitCode !== 0 && !hasValidOutput)
		return yield* Effect.fail(`Bundle failed:\n${stderr || stdout}`)

	return stdout
})

/**
 * Bundle a story file for the browser with React hydration support.
 * This creates a self-contained bundle that can run in the browser.
 */
export const bundleStoryForBrowser = Effect.fn(function* ({
	storyPath,
	projectRoot,
	storyId
}: BundleStoryForBrowserArgs) {
	console.log('[bundleStoryForBrowser] 🚀 Starting...')
	console.log('[bundleStoryForBrowser] 📁 storyPath:', storyPath)
	console.log('[bundleStoryForBrowser] 📁 projectRoot:', projectRoot)
	console.log('[bundleStoryForBrowser] 📁 storyId:', storyId)

	const tsconfigPath = yield* findNearestTsconfig(projectRoot)
	console.log('[bundleStoryForBrowser] 📄 tsconfig:', tsconfigPath)

	// Create a temporary entry file that imports the story and hydrates it
	const fs = yield* FileSystem.FileSystem
	const nodeModules = yield* findNearestNodeModules(projectRoot)
	console.log('[bundleStoryForBrowser] 📦 nodeModules:', nodeModules)

	const tempDir = Option.isSome(nodeModules)
		? `${nodeModules.value}/.cache/render`
		: `${projectRoot}/.render-cache`
	console.log('[bundleStoryForBrowser] 📂 tempDir:', tempDir)

	yield* fs.makeDirectory(tempDir, { recursive: true })

	const entryFile = `${tempDir}/render-${storyId.replace(/[^a-z0-9]/gi, '_')}.tsx`
	console.log('[bundleStoryForBrowser] 📝 entryFile:', entryFile)

	// Convert Windows backslashes to forward slashes for import path
	const storyPathForImport = storyPath.replace(/\\/g, '/')

	// Write the entry file - using explicit React import for JSX
	// Use createRoot for client-side only rendering (not SSR hydration)
	const entryCode = `
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as StoryModule from '${storyPathForImport}';

const rootElement = document.getElementById('root');

// Find the story export
let StoryExport;
for (const [key, exported] of Object.entries(StoryModule)) {
  if (exported && typeof exported === 'object' && '~type' in exported && exported['~type'] === 'ReactStory') {
    StoryExport = exported;
    break;
  }
}

if (StoryExport && rootElement) {
  // Get default props (empty for now, will be enhanced later)
  const defaultProps = {};
  const element = StoryExport.render(defaultProps);
  ReactDOMClient.createRoot(rootElement).render(element);
}
`

	console.log('[bundleStoryForBrowser] 📝 Writing entry code...')
	yield* fs.writeFileString(entryFile, entryCode)
	console.log('[bundleStoryForBrowser] ✅ Entry file written')

	// Build for browser
	const args = ['build', entryFile, '--target', 'browser', '--format', 'esm']

	// Don't mark anything as external for browser bundle - we need everything inlined
	if (Option.isSome(tsconfigPath))
		args.push('--tsconfig-override', tsconfigPath.value)

	console.log(
		'[bundleStoryForBrowser] 🔨 Running bun with args:',
		['bun', ...args].join(' ')
	)
	console.log('[bundleStoryForBrowser] 📂 CWD:', projectRoot)

	const proc = Bun.spawn(['bun', ...args], {
		cwd: projectRoot,
		stdout: 'pipe',
		stderr: 'pipe'
	})

	const [stdout, stderr] = yield* Effect.all(
		[
			Effect.tryPromise(() => new Response(proc.stdout).text()),
			Effect.tryPromise(() => new Response(proc.stderr).text())
		],
		{
			concurrency: 'unbounded'
		}
	)

	const exitCode = yield* Effect.tryPromise(() => proc.exited)
	console.log('[bundleStoryForBrowser] 📊 Exit code:', exitCode)
	console.log('[bundleStoryForBrowser] 📊 Stdout length:', stdout.length)
	console.log('[bundleStoryForBrowser] 📊 Stderr:', stderr || '(empty)')
	if (stdout.length < 500) {
		console.log('[bundleStoryForBrowser] 📊 Stdout content:', stdout)
	} else {
		console.log(
			'[bundleStoryForBrowser] 📊 Stdout preview:',
			stdout.slice(0, 200) + '...'
		)
	}

	// Clean up temp file
	yield* fs.remove(entryFile).pipe(Effect.ignore)

	// Check if we got valid bundled output (starts with bun comment or contains export)
	// Bun may exit with non-zero code due to internal warnings but still produce valid output
	const hasValidOutput =
		stdout.startsWith('// @bun') || stdout.includes('export {')
	console.log('[bundleStoryForBrowser] 📊 Has valid output:', hasValidOutput)

	if (exitCode !== 0 && !hasValidOutput) {
		console.log('[bundleStoryForBrowser] ❌ Bundle failed!')
		return yield* Effect.fail(`Browser bundle failed:\n${stderr || stdout}`)
	}

	console.log('[bundleStoryForBrowser] ✅ Bundle success!')
	return stdout
})

export const importStoryWithBundler = Effect.fn(function* ({
	storyPath,
	projectRoot
}: ImportStoryWithBundlerArgs) {
	const fs = yield* FileSystem.FileSystem

	const nodeModules = yield* findNearestNodeModules(projectRoot)
	const bundledCode = yield* bundleStoryFile({
		storyPath,
		projectRoot
	})

	const tempFile = yield* fs.makeTempFileScoped({
		directory: Option.isSome(nodeModules) ? nodeModules.value : undefined,
		suffix: '.mjs'
	})

	yield* fs.writeFileString(tempFile, bundledCode)

	const module = yield* Effect.tryPromise(() => import(tempFile))

	return yield* Schema.decodeUnknown(moduleSchema)(module)
})

type BundleStoryFileArgs = {
	storyPath: string
	projectRoot: string
}

type BundleStoryForBrowserArgs = {
	storyPath: string
	projectRoot: string
	storyId: string
}

type ImportStoryWithBundlerArgs = {
	storyPath: string
	projectRoot: string
}
