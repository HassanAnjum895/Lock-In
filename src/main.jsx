import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { AppProvider } from "./context/AppContext";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;

function Root() {
  // Without a backend URL the app runs fully offline (local-only), as before.
  if (!convex) {
    return (
      <AppProvider>
        <App />
      </AppProvider>
    );
  }
  return (
    <ConvexAuthProvider client={convex}>
      <AppProvider>
        <App />
      </AppProvider>
    </ConvexAuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
