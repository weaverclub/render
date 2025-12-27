import { Control } from './control'

export class ArrayControl<T> extends Control {
	public defaultValue: Array<T>

	public constructor(args: ArrayControlArgs<T>) {
		super(args.name)
		this.defaultValue = args.defaultValue
	}
}

type ArrayControlArgs<T> = {
	name: string
	defaultValue: Array<T>
}
