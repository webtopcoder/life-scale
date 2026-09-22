import { createRoot } from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import App from "./App.tsx";
import "./index.css";
import { captureAffiliateParams } from "./constants/analytics";

captureAffiliateParams();

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
} as const;

createRoot(document.getElementById("root")!).render(
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    options={options}
  >
    <App />
  </PostHogProvider>
);
