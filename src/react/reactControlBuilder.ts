import type { ComponentType } from 'react'
import { ArrayControl } from '#core/control/arrayControl'
import { BooleanControl } from '#core/control/booleanControl'
import type { Control } from '#core/control/control'
import type {
	ArrayPropNames,
	BooleanPropNames,
	ControlBuilder,
	ExtractStringLiteralUnion,
	NumberPropNames,
	StringPropNames,
	VariantPropNames
} from '#core/control/controlBuilder'
import { NumberControl } from '#core/control/numberControl'
import { StringControl } from '#core/control/stringControl'
import { VariantControl } from '#core/control/variantControl'
import type { ReactStory } from './reactStory'

export function controls<
	// biome-ignore lint/suspicious/noExplicitAny: Required for React component prop inference
	Component extends React.ComponentType<any>
>(): ReactControlBuilder<React.ComponentProps<Component>, never> {
	return new ReactControlBuilder<React.ComponentProps<Component>, never>()
}

const CONTROLS_SYMBOL = Symbol.for('@renderweaver/controls')

export class ReactControlBuilder<Props, Used extends keyof Props>
	implements ControlBuilder<Props, Used>
{
	private controls: Control[] = []

	public [CONTROLS_SYMBOL](): Control[] {
		return this.controls
	}

	public array<
		Name extends Exclude<ArrayPropNames<Props>, Used> & string,
		Type = Props[Name] extends Array<infer U> ? U : never
	>(
		name: Name,
		options: {
			defaultValue: Props[Name]
		}
	): ControlBuilder<Props, Used | Name> {
		this.controls.push(
			new ArrayControl<Type>({
				name,
				defaultValue: options.defaultValue as Type[]
			})
		)

		return this as unknown as ControlBuilder<Props, Used | Name>
	}

	public bool<Name extends Exclude<BooleanPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: boolean
		}
	): ControlBuilder<Props, Used | Name> {
		this.controls.push(
			new BooleanControl({
				name,
				defaultValue: options.defaultValue
			})
		)

		return this as unknown as ControlBuilder<Props, Used | Name>
	}

	public number<Name extends Exclude<NumberPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: number
		}
	): ControlBuilder<Props, Used | Name> {
		this.controls.push(
			new NumberControl({
				name,
				defaultValue: options.defaultValue
			})
		)

		return this as unknown as ControlBuilder<Props, Used | Name>
	}

	public string<Name extends Exclude<StringPropNames<Props>, Used> & string>(
		name: Name,
		options: { defaultValue: string }
	): ControlBuilder<Props, Used | Name> {
		this.controls.push(
			new StringControl({
				name,
				defaultValue: options.defaultValue
			})
		)

		return this as unknown as ControlBuilder<Props, Used | Name>
	}

	public variant<Name extends Exclude<VariantPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: ExtractStringLiteralUnion<Props[Name]>
			options: ExtractStringLiteralUnion<Props[Name]>[]
		}
	): ControlBuilder<Props, Used | Name> {
		this.controls.push(
			new VariantControl({
				name: name,
				options: options.options as string[],
				defaultValue: options.defaultValue as string
			})
		)

		return this as unknown as ControlBuilder<Props, Used | Name>
	}
}

export function getDefaultPropsForReactComponent<
	// biome-ignore lint/suspicious/noExplicitAny: Required for React component prop inference
	Component extends ComponentType<any>
>(story: ReactStory<Component>): React.ComponentProps<Component> {
	if (!story.controls) {
		return {} as React.ComponentProps<Component>
	}

	return {} as React.ComponentProps<Component>
}
