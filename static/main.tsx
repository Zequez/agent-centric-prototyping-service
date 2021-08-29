/// <reference lib="dom" />
import React from "https://esm.sh/react@17";
import ReactDOM from "https://esm.sh/react-dom@17";
import App from "./app.tsx";

import liveReloader from "./liveReloader.ts";

liveReloader();

ReactDOM.render(<App />, document.getElementById("app"));
