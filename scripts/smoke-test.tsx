// Renders <App /> via ReactDOMServer to catch runtime crashes before shipping —
// specifically the class of bug that broke production once already: a
// component using something (like React Router's <Link>/<BrowserRouter>)
// outside the context it needs, which tsc's type-checking can't see but a
// real render immediately throws on. Run via `npm run smoke-test`, and as
// part of `npm run prebuild` before every packaged build.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://notioncreativeart.com/' })
// @ts-expect-error — assigning browser globals for a Node smoke test
global.window = dom.window
global.document = dom.window.document

const { renderToString } = await import('react-dom/server')
const { createElement } = await import('react')
const { default: App } = await import('../src/App')

try {
  renderToString(createElement(App))
  console.log('smoke-test: App rendered successfully ✓')
  process.exit(0)
} catch (err) {
  console.error('smoke-test: App CRASHED during render — this would be a blank white screen in production:')
  console.error(err)
  process.exit(1)
}
