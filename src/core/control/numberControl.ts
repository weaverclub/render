import { Control } from './control'

export class NumberControl extends Control {
	public defaultValue: number

	public constructor(args: NumberControlArgs) {
		super(args.name)
		this.defaultValue = args.defaultValue
	}
}

type NumberControlArgs = {
	name: string
	defaultValue: number
}
