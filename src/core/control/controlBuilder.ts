import type { Control } from './control'

export interface ControlBuilder<Props, Used extends keyof Props> {
	array<Name extends Exclude<ArrayPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: Props[Name]
		}
	): ControlBuilder<Props, Used | Name>

	bool<Name extends Exclude<BooleanPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: boolean
		}
	): ControlBuilder<Props, Used | Name>

	number<Name extends Exclude<NumberPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: number
		}
	): ControlBuilder<Props, Used | Name>

	string<Name extends Exclude<StringPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: string
		}
	): ControlBuilder<Props, Used | Name>

	variant<Name extends Exclude<VariantPropNames<Props>, Used> & string>(
		name: Name,
		options: {
			defaultValue: ExtractStringLiteralUnion<Props[Name]>
			options: ExtractStringLiteralUnion<Props[Name]>[]
		}
	): ControlBuilder<Props, Used | Name>
}

type NonNullableValue<T> = T extends null | undefined ? never : T

export type ExtractStringLiteralUnion<T> =
	NonNullableValue<T> extends string
		? string extends NonNullableValue<T>
			? never
			: NonNullableValue<T>
		: never

export type ArrayPropNames<Props> = {
	[K in keyof Props]: NonNullableValue<Props[K]> extends readonly unknown[]
		? K
		: never
}[keyof Props]

export type BooleanPropNames<Props> = {
	[K in keyof Props]: NonNullableValue<Props[K]> extends boolean
		? boolean extends NonNullableValue<Props[K]>
			? K
			: never
		: never
}[keyof Props]

export type NumberPropNames<Props> = {
	[K in keyof Props]: NonNullableValue<Props[K]> extends number
		? number extends NonNullableValue<Props[K]>
			? K
			: never
		: never
}[keyof Props]

export type StringPropNames<Props> = {
	[K in keyof Props]: NonNullableValue<Props[K]> extends string
		? string extends NonNullableValue<Props[K]>
			? K
			: never
		: never
}[keyof Props]

export type VariantPropNames<Props> = {
	[K in keyof Props]: ExtractStringLiteralUnion<Props[K]> extends never
		? never
		: K
}[keyof Props]

// biome-ignore lint/suspicious/noExplicitAny: Required for flexible builder type
export type UnfinishedControls = ControlBuilder<any, any> | Control[]
