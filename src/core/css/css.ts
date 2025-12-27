import { Array as Arr, Effect } from 'effect'
import { getProjectDependencies } from '../pkg'
import { compileTailwindCss } from './tailwind'

const tailwindDependencyNames = [
	'tailwindcss',
	'@tailwindcss/vite',
	'@tailwindcss/cli'
]

const cssStategyMap: Record<
	CSSStrategy,
	(projectRoot: string) => Effect.Effect<CSS, Error>
> = {
	tailwind: compileTailwindCss
}

export const loadCSS = Effect.fn(function* (projectRoot: string) {
	const strategies = yield* detectCSSStrategies(projectRoot)

	const tasks = Arr.map(Array.from(strategies), (strategy) => {
		const loadFn = cssStategyMap[strategy]
		return loadFn(projectRoot)
	})

	const results = yield* Effect.all(tasks, {
		concurrency: 'unbounded'
	})

	return results
})

export const detectCSSStrategies = Effect.fn(function* (projectRoot: string) {
	const deps = yield* getProjectDependencies(projectRoot)

	const strategies = new Set<CSSStrategy>()

	for (const depName of tailwindDependencyNames) {
		if (deps.includes(depName)) strategies.add('tailwind')
	}

	return strategies
})

type CSSStrategy = 'tailwind'

export type CSS = {
	paths: string[]
	compiledOutput: string
}
