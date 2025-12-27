import { controls } from '#react/reactControlBuilder'
import { story } from '#react/reactStory'
import { Button } from './button'

const buttonControls = controls<typeof Button>()
	.variant('variant', {
		defaultValue: 'default',
		options: ['default', 'destructive', 'ghost', 'outline', 'secondary', 'link']
	})
	.variant('size', {
		defaultValue: 'default',
		options: [
			'default',
			'xs',
			'sm',
			'lg',
			'icon',
			'icon-xs',
			'icon-sm',
			'icon-lg'
		]
	})
	.bool('disabled', {
		defaultValue: false
	})

export const Story = story({
	name: 'UI/Button',
	component: Button,
	controls: buttonControls,
	render: (props) => <Button {...props}>Click me</Button>
})
