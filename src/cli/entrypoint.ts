#! /usr/bin/env bun

import { Args, Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import pkg from "../../package.json" with { type: "json" };
import { renderCommand } from "./command/renderCommand";

const path = Args.path();

const command = Command.make("render", { path }).pipe(
  Command.withDescription("The simplest way to preview React components"),
  Command.withHandler(renderCommand)
);

const cli = Command.run(command, {
  name: "Render",
  version: pkg.version,
});

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(BunContext.layer),
  Effect.tapErrorCause(Effect.logError),
  BunRuntime.runMain
);
