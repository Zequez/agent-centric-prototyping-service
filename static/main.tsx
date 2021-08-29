/// <reference lib="dom" />
import React from "https://esm.sh/react@17";
import ReactDOM from "https://esm.sh/react-dom@17";

import liveReloader from "./liveReloader.ts";

liveReloader();

ReactDOM.render(<div>Hello from react</div>, document.getElementById("app"));
