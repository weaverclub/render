import { Control } from './control'

export class VariantControl<T> extends Control {
	public defaultValue: T
	public options: Array<T>

	public constructor(args: VariantControlArgs<T>) {
		super(args.name)
		this.defaultValue = args.defaultValue
		this.options = args.options
	}
}

type VariantControlArgs<T> = {
	name: string
	options: Array<T>
	defaultValue: T
}
