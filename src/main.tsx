import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

// Sentry.init({
//   dsn: "https://7758ae90eac34e6786c251e87cb4a141@o1230528.ingest.sentry.io/6377227",
//   integrations: [new BrowserTracing()],

//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// });

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <ToastContainer />
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
);
