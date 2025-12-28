import { $ } from 'bun'
import pkg from './package.json'

const args = Bun.argv.slice(2)
const versionArg = args[0]

if (!versionArg) {
	console.error('❌ Usage: bun run publish <version>')
	console.error('   Example: bun run publish 1.0.2')
	console.error('   Example: bun run publish patch')
	console.error('   Example: bun run publish minor')
	console.error('   Example: bun run publish major')
	process.exit(1)
}

const currentVersion = pkg.version
let newVersion: string

if (['patch', 'minor', 'major'].includes(versionArg)) {
	const [major, minor, patch] = currentVersion.split('.').map(Number)
	switch (versionArg) {
		case 'patch':
			newVersion = `${major}.${minor}.${(patch ?? 0) + 1}`
			break
		case 'minor':
			newVersion = `${major}.${(minor ?? 0) + 1}.0`
			break
		case 'major':
			newVersion = `${(major ?? 0) + 1}.0.0`
			break
		default:
			newVersion = currentVersion
	}
} else {
	newVersion = versionArg
}

console.log(`📦 Publishing render v${newVersion}`)
console.log(`   Current version: ${currentVersion}`)
console.log('')

// Run tests first
// console.log('🧪 Running tests...')
// await $`bun run test run`

// Bump version
console.log(`\n📝 Bumping version to ${newVersion}...`)
await $`npm version ${newVersion} --no-git-tag-version`

// Build
console.log('\n🔨 Building...')
await $`bun run build`

// Git commit, tag, and push
console.log('\n📤 Committing and pushing...')
await $`git add package.json`
await $`git commit -m "v${newVersion}"`
await $`git tag v${newVersion}`
await $`git push origin main --tags`

console.log(`\n✅ Done! v${newVersion} is being published via GitHub Actions.`)
console.log(`   Check: https://github.com/weaverclub/render/actions`)
