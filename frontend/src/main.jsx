import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider.jsx"
import ConvexClientProvider from "./ConvexClientProvider.jsx"
import "./index.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="sigloop-theme">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ConvexClientProvider>
          <App />
        </ConvexClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
