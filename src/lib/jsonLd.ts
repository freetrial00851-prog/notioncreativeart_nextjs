/**
 * Serialise structured data for an inline <script type="application/ld+json">.
 * Plain JSON.stringify leaves "</script>" intact, so text from reviews or product copy could
 * close the tag and inject markup. Escaping "<" (and the two JS line separators) keeps the
 * JSON identical for parsers but inert for the HTML parser.
 */
const LINE_SEPARATORS = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g')

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEPARATORS, (c) => '\\u' + c.charCodeAt(0).toString(16))
}
