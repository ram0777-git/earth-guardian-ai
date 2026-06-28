import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API client to use the local development server
setBaseUrl("http://localhost:5000");

createRoot(document.getElementById("root")!).render(<App />);
