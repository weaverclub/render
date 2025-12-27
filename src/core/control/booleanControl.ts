import { Control } from './control'

export class BooleanControl extends Control {
	public defaultValue: boolean

	public constructor(args: BooleanControlArgs) {
		super(args.name)
		this.defaultValue = args.defaultValue
	}
}

type BooleanControlArgs = {
	name: string
	defaultValue: boolean
}
