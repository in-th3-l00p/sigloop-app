import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ConvexClientProvider from "./ConvexClientProvider.jsx"
import "./index.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConvexClientProvider>
      <App />
    </ConvexClientProvider>
  </StrictMode>,
)
