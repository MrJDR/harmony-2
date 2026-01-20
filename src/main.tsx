import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
registerSW({
  onNeedRefresh() {
    // Show a prompt to user to refresh for updates
    console.log("New content available, please refresh.");
  },
  onOfflineReady() {
    console.log("App ready for offline use.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
