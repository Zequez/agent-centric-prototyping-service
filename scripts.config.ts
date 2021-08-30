import { DenonConfig } from "https://deno.land/x/denon/mod.ts";
import { config as env } from "https://deno.land/x/dotenv/mod.ts";

const config: DenonConfig = {
  allow: ["net", "read", "write", "env"],
  unstable: true,
  importmap: "importmap.json",
  env: env(),
  scripts: {
    dev: {
      cmd: "main.ts",
      desc: "Start the prototyping server on development mode",
      env: {
        APP_ENV: "development",
        PORT: "8888",
      },
    },
    prod: {
      cmd: "main.ts",
      desc: "Start the prototyping server on production mode",
      env: {
        APP_ENV: "production",
      },
    },
  },
  watcher: {
    exts: ["ts", "json"],
    skip: ["cache/*"],
  },
};

export default config;
