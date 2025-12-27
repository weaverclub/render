import { Array as Arr, Effect } from "effect";
import type { ReactStory } from "#react/reactStory";
import { importStoryWithBundler } from "./bundler";

export const loadStories = Effect.fn(function* (absolutePath: string) {
  const glob = new Bun.Glob("**/*.stories.{ts,tsx,js,jsx,mts,cts}");

  const files = Arr.fromIterable(
    glob.scanSync({ absolute: true, cwd: absolutePath })
  );

  const tasks = Arr.map(files, (file) =>
    importStoryWithBundler({
      storyPath: file,
      projectRoot: absolutePath,
    }).pipe(
      Effect.scoped,
      Effect.map((mod) => ({ mod, sourcePath: file }))
    )
  );

  const results = yield* Effect.all(tasks, { concurrency: "unbounded" });

  const stories = Arr.flatMap(results, ({ mod, sourcePath }) =>
    Object.values(mod).map((story) => {
      if (
        story !== null &&
        typeof story === "object" &&
        "~type" in story &&
        story["~type"] === "ReactStory"
      ) {
        // Attach the source path for browser bundling
        (story as ReactStory<React.ComponentType>).sourcePath = sourcePath;
      }
      return story;
    })
  );

  return stories.filter(
    // biome-ignore lint/suspicious/noExplicitAny: Required for story filtering
    (story): story is ReactStory<any> =>
      story !== null &&
      typeof story === "object" &&
      "~type" in story &&
      story["~type"] === "ReactStory"
  );
});

export interface Story {
  // biome-ignore lint/suspicious/noExplicitAny: Required for generic story execution
  render: (...args: any[]) => unknown;
}
