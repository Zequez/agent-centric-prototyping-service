/// <reference lib="dom" />
import ENV from "../cache/env.ts";
import React from "https://esm.sh/react@17";
import ReactDOM from "https://esm.sh/react-dom@17";
import App from "./app.tsx";
import liveReloader from "./liveReloader.ts";

console.log(ENV);

if (!ENV.APP_ENV) throw new Error("APP_ENV environment variable not found");
const isDev = ENV.APP_ENV === "development";

if (isDev) liveReloader();

ReactDOM.render(<App />, document.getElementById("app"));
