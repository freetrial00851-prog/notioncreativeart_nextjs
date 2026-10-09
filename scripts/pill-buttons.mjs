/**
 * Convert action-button rounded-lg/md → rounded-full (pill).
 * Handles multi-line opening tags; skips inputs, thumbnails, containers.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.join(process.cwd(), 'src')

function shouldSkipClass(cls) {
  if (/<input|<select|<textarea/.test(cls)) return true
  if (/overflow-hidden/.test(cls) && /\bw-(9|10|12|14|16|24)\b|w-\[72px\]/.test(cls)) return true
  if (/border-2 border-dashed/.test(cls)) return true
  if (/shadow-lg/.test(cls) && !/font-semibold|py-[23]/.test(cls)) return true
  return false
}

function isButtonTag(tag, cls, fullMatch) {
  if (tag === 'button') return true
  if (tag === 'Link' || tag === 'a') {
    if (/py-[12]\.?[05]?|font-semibold|font-medium|tracking-\[0\.1em\]|inline-flex.*gap/.test(cls)) return true
    if (/px-[456]/.test(cls) && /py-/.test(cls)) return true
  }
  if (/type="submit"/.test(fullMatch)) return true
  return false
}

function pillClass(cls) {
  if (shouldSkipClass(cls)) return cls
  return cls.replace(/\brounded-(lg|md)\b/g, 'rounded-full')
}

function transformContent(content) {
  let out = content

  // Double-quoted className on button / Link / a (may span lines before closing >)
  out = out.replace(
    /<(button|Link|a)(\s[\s\S]*?)className="([^"]*)"([\s\S]*?)>/g,
    (match, tag, before, cls, after) => {
      if (!/\brounded-(lg|md)\b/.test(cls)) return match
      if (!isButtonTag(tag, cls, match)) return match
      const next = pillClass(cls)
      if (next === cls) return match
      return `<${tag}${before}className="${next}"${after}>`
    },
  )

  // Template literal className={`...`}
  out = out.replace(
    /<(button|Link|a)(\s[\s\S]*?)className=\{`([^`]*)`\}([\s\S]*?)>/g,
    (match, tag, before, cls, after) => {
      if (!/\brounded-(lg|md)\b/.test(cls)) return match
      if (!isButtonTag(tag, cls, match)) return match
      const next = pillClass(cls)
      if (next === cls) return match
      return `<${tag}${before}className={\`${next}\`}${after}>`
    },
  )

  // Skeleton button bones
  out = out.replace(
    /<Bone className="([^"]*rounded-lg[^"]*)"/g,
    (match, cls) => {
      if (!/\bh-(8|9|10|11|12|24)\b/.test(cls)) return match
      if (/\bw-(9|12|16|24)\b/.test(cls) && !/w-full/.test(cls)) return match
      return match.replace(/\brounded-lg\b/g, 'rounded-full')
    },
  )

  return out
}

function walk(dir) {
  let changed = 0
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      changed += walk(p)
      continue
    }
    if (!/\.(tsx|ts)$/.test(ent.name)) continue
    const raw = fs.readFileSync(p, 'utf8')
    const next = transformContent(raw)
    if (next !== raw) {
      fs.writeFileSync(p, next)
      console.log('updated', path.relative(process.cwd(), p))
      changed++
    }
  }
  return changed
}

const n = walk(SRC)
console.log(`Done — ${n} file(s) updated.`)
