// biome-ignore-all lint/suspicious/noExplicitAny: Required for React component prop inference
import type { UnfinishedControls } from "#core/control/controlBuilder";
import type { Story } from "#core/story";

export function story<Component extends React.ComponentType<any>>(
  args: StoryArgs<Component>
) {
  return new ReactStory(args);
}

export class ReactStory<
  Component extends React.ComponentType<any>,
> implements Story {
  public name: string;
  public id: string;
  public component: React.ComponentType<any> | undefined;
  public render: (props: React.ComponentProps<Component>) => React.ReactElement;
  public controls: UnfinishedControls | undefined;
  public "~type" = "ReactStory";
  public sourcePath?: string; // Path to the story source file for browser bundling

  public constructor(args: StoryArgs<Component>) {
    this.name = args.name;
    this.component = args.component;
    this.render = args.render;
    this.controls = args.controls;
    this.id = this.name.replace(/\s+/g, "-").toLowerCase();
  }
}

type StoryArgs<Component extends React.ComponentType<any>> = {
  name: string;
  render: (props: React.ComponentProps<Component>) => React.ReactElement;
  component?: Component;
  controls?: UnfinishedControls;
};
