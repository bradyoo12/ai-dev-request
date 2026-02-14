import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App'

/**
 * Server-side render function.
 * Called by the pre-render script or backend SSR service to produce
 * static HTML for a given URL path.
 *
 * Uses StaticRouter (server-safe) instead of BrowserRouter,
 * and renders AppRoutes (the shared route tree without a router wrapper).
 *
 * @param url - The URL path to render (e.g., "/" or "/about")
 * @returns An object containing the rendered HTML string
 */
export function render(url: string): { html: string } {
  const html = renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  )
  return { html }
}
