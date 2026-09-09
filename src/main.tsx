import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalChunkErrorHandlers } from "./utils/chunkReload";

// Reload once when a stale-chunk error slips past React's ErrorBoundary
// (unhandled promise rejections, plain window errors) after a fresh deploy.
installGlobalChunkErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
