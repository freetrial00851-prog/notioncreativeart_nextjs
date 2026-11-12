/**
 * Pulls the "AT A GLANCE" block out of a product description so it can be shown as a facts table
 * (skill level, finished size, yarn, hook, terms) and added to the Product structured data.
 *
 * The block looks like this inside the description text:
 *
 *   AT A GLANCE
 *   • Skill level: intermediate
 *   • Finished size: about 22-26 cm (9-10 in)
 *   • Written pattern, no video
 *
 * Bullets with a "Label: value" shape become rows. Bullets without one become "Good to know" rows.
 * Descriptions without the block are returned unchanged with no facts.
 */

export type PatternFact = { label: string; value: string }

const HEADING = 'AT A GLANCE'

export function splitPatternFacts(description: string | null | undefined): {
  facts: PatternFact[]
  body: string
} {
  const text = description ?? ''
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.trim() === HEADING)
  if (start === -1) return { facts: [], body: text }

  const facts: PatternFact[] = []
  let end = start + 1
  while (end < lines.length) {
    const line = lines[end].trim()
    if (!/^[•\-*]\s+\S/.test(line)) break
    const content = line.replace(/^[•\-*]\s+/, '')
    const m = content.match(/^([^:]{2,40}):\s+(.+)$/)
    facts.push(m ? { label: m[1].trim(), value: m[2].trim() } : { label: 'Good to know', value: content })
    end += 1
  }
  if (facts.length === 0) return { facts: [], body: text }

  // Drop the heading, the bullets and the blank line that followed them.
  while (end < lines.length && lines[end].trim() === '') end += 1
  const body = [...lines.slice(0, start), ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return { facts, body }
}
