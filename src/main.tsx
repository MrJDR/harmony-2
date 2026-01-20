import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA.
// IMPORTANT: On Lovable preview domains, SW caching can cause stale bundles and React context mismatches.
// So we *disable* SW on preview and force-unregister any existing registrations.
const hostname = window.location.hostname;
const isLovablePreview = hostname.includes('lovableproject.com') || hostname.startsWith('id-preview--');

if (isLovablePreview) {
  navigator.serviceWorker
    ?.getRegistrations?.()
    .then((regs) => regs.forEach((reg) => reg.unregister()))
    .catch(() => void 0);
} else {
  registerSW({
    onNeedRefresh() {
      console.log("New content available, please refresh.");
    },
    onOfflineReady() {
      console.log("App ready for offline use.");
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
