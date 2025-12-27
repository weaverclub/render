import { Control } from './control'

export class StringControl extends Control {
	public defaultValue: string

	public constructor(args: StringControlArgs) {
		super(args.name)
		this.defaultValue = args.defaultValue
	}
}

type StringControlArgs = {
	name: string
	defaultValue: string
}
