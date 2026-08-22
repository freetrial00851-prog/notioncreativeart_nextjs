/**
 * One-time migration script: converts Vite/React Router patterns to Next.js.
 * Run: node scripts/migrate-to-next.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(import.meta.dirname, '..', 'src')
const SKIP = new Set(['NavLink.tsx', 'Providers.tsx', 'CustomerShell.tsx'])

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!p.includes('app')) walk(p, files)
      else walk(p, files) // include app too if needed
    } else if (['.tsx', '.ts'].includes(extname(name)) && !SKIP.has(name)) {
      files.push(p)
    }
  }
  return files
}

function migrate(content, filepath) {
  let c = content

  // Skip if already migrated
  if (c.includes("'use client'") && !c.includes('react-router-dom')) {
    // still may need env fixes
  }

  // Env vars
  c = c.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_')
  c = c.replace(/import\.meta\.env\.NEXT_PUBLIC_/g, 'process.env.NEXT_PUBLIC_')

  // Link: to= -> href=
  c = c.replace(/\bto=\{/g, 'href={')
  c = c.replace(/\bto="/g, 'href="')
  c = c.replace(/\bto='/g, "href='")

  // react-router-dom imports — handle various patterns
  if (c.includes('react-router-dom')) {
    const needsClient = true

    // Replace combined imports
    c = c.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"]/g,
      (match, imports) => {
        const parts = imports.split(',').map((s) => s.trim()).filter(Boolean)
        const nextImports = []
        const lines = []

        for (const part of parts) {
          if (part === 'Link') {
            lines.push("import Link from 'next/link'")
          } else if (part === 'NavLink') {
            lines.push("import { NavLink } from '@/components/NavLink'")
          } else if (part === 'useNavigate') {
            nextImports.push('useRouter')
          } else if (part === 'useLocation') {
            nextImports.push('usePathname')
          } else if (part === 'useParams' || part === 'useSearchParams') {
            nextImports.push(part)
          } else if (part.startsWith('Route') || part.startsWith('Routes')) {
            // skip — handled manually in Admin/Account
          } else {
            nextImports.push(part)
          }
        }

        if (nextImports.length) {
          lines.push(`import { ${[...new Set(nextImports)].join(', ')} } from 'next/navigation'`)
        }
        return lines.join('\n')
      },
    )

    // useNavigate() -> useRouter(); navigate(x) -> router.push(x)
    if (c.includes('useNavigate')) {
      c = c.replace(/\bconst navigate = useNavigate\(\)/g, 'const router = useRouter()')
      c = c.replace(/\bnavigate\(/g, 'router.push(')
    }

    // useLocation -> usePathname
    if (c.includes('useLocation')) {
      c = c.replace(/\bconst location = useLocation\(\)/g, 'const pathname = usePathname()')
      c = c.replace(/\blocation\.pathname/g, 'pathname')
      c = c.replace(/\blocation\.search/g, "typeof window !== 'undefined' ? window.location.search : ''")
    }

    if (needsClient && !c.startsWith("'use client'")) {
      c = "'use client'\n\n" + c
    }
  }

  // Files with hooks but no react-router still need use client
  const hookPattern = /\b(useState|useEffect|useRef|useContext|useCallback|useMemo|useReducer|useId)\b/
  const isContext = filepath.includes('context' + '\\') || filepath.includes('context/')
  const isLibHook = filepath.includes('use') && filepath.includes('lib')
  if (
    (hookPattern.test(c) || isContext) &&
    !c.startsWith("'use client'") &&
    !filepath.includes('lib\\seo') &&
    !filepath.includes('lib/seo') &&
    !filepath.includes('lib\\env') &&
    !filepath.includes('lib/env') &&
    !filepath.includes('supabase\\server') &&
    !filepath.includes('supabase/server') &&
    !filepath.includes('supabase\\middleware') &&
    !filepath.includes('supabase/middleware')
  ) {
    c = "'use client'\n\n" + c
  }

  // Remove useMeta imports and calls — metadata now server-side
  if (c.includes('useMeta')) {
    c = c.replace(/import\s*\{\s*useMeta\s*\}\s*from\s*['"][^'"]+['"]\s*\n?/g, '')
    c = c.replace(/\s*useMeta\(\{[\s\S]*?\}\)\s*\n?/g, '\n')
  }

  // window.location.origin stays as-is for client auth redirects

  return c
}

const files = walk(ROOT)
let changed = 0
for (const f of files) {
  const original = readFileSync(f, 'utf8')
  const migrated = migrate(original, f)
  if (migrated !== original) {
    writeFileSync(f, migrated)
    changed++
    console.log('migrated:', f.replace(ROOT, ''))
  }
}
console.log(`Done. ${changed} files updated.`)
