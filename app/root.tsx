import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { ThemeProvider, initializeTheme } from "~/utils/themeProvider";
import tailwindStyles from "./tailwind.css";
import "~/styles/tabs.css";
import { ActionFunction, json } from "@remix-run/node";

// Add a non-blocking script to initialize theme immediately to avoid flash
const themeInitScript = `
  (function() {
    // Force light mode by default
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      // Explicitly remove dark class if not dark mode
      document.documentElement.classList.remove("dark");
      if (!theme) localStorage.setItem("theme", "light");
    }
  })();
`;

export const action: ActionFunction = async ({ request }) => {
  // Allow POST requests to pass through to child routes
  return null;
};

export function links() {
  return [{ rel: "stylesheet", href: tailwindStyles }];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </ThemeProvider>
      </body>
    </html>
  );
}
