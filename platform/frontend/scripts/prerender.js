/**
 * Pre-render script for Vite SSR.
 *
 * This script loads the SSR build output and renders key pages to static HTML files.
 * The resulting HTML files are saved to dist/ssr/ and can be served by:
 * - Azure Static Web Apps (as static files)
 * - The backend SsrService (for dynamic SSR fallback)
 *
 * Usage:
 *   1. Build the client: npm run build:client
 *   2. Build the SSR bundle: npm run build:ssr
 *   3. Run pre-render: npm run prerender
 *
 * Or use the combined build command: npm run build && npm run prerender
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = resolve(__dirname, '..')

// Pages to pre-render for SEO
// Add more routes here as needed
const ROUTES_TO_PRERENDER = [
  '/',
]

async function prerender() {
  const distDir = join(root, 'dist')
  const ssrOutputDir = join(distDir, 'ssr')

  // Check that the SSR bundle exists
  const ssrBundlePath = join(distDir, 'server', 'entry-server.js')
  if (!existsSync(ssrBundlePath)) {
    console.error(`SSR bundle not found at: ${ssrBundlePath}`)
    console.error('Run "npm run build:ssr" first to generate the SSR bundle.')
    process.exit(1)
  }

  // Check that the client build exists (we need index.html as template)
  const templatePath = join(distDir, 'index.html')
  if (!existsSync(templatePath)) {
    console.error(`Client build not found at: ${templatePath}`)
    console.error('Run "npm run build:client" first to generate the client build.')
    process.exit(1)
  }

  const template = readFileSync(templatePath, 'utf-8')

  // Create SSR output directory
  if (!existsSync(ssrOutputDir)) {
    mkdirSync(ssrOutputDir, { recursive: true })
  }

  // Load the SSR module
  console.log(`Loading SSR bundle from: ${ssrBundlePath}`)
  const { render } = await import(ssrBundlePath)

  console.log(`Pre-rendering ${ROUTES_TO_PRERENDER.length} routes...`)

  for (const route of ROUTES_TO_PRERENDER) {
    try {
      const { html: appHtml } = render(route)

      // Inject the rendered HTML into the template
      const fullHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      )

      // Determine output filename
      const fileName = route === '/' ? 'index.html' : `${route.slice(1).replace(/\//g, '-')}.html`
      const outputPath = join(ssrOutputDir, fileName)

      writeFileSync(outputPath, fullHtml, 'utf-8')
      console.log(`  Pre-rendered: ${route} -> ${outputPath}`)
    } catch (error) {
      console.error(`  Failed to pre-render ${route}:`, error.message)
    }
  }

  console.log('Pre-rendering complete!')
}

prerender().catch((error) => {
  console.error('Pre-render script failed:', error)
  process.exit(1)
})
