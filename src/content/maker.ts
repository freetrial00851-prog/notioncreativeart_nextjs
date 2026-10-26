/**
 * The "Meet the maker" block on the home page. It stays hidden until `headline` and `story` are filled in with
 * real text from the owner (no placeholders are ever shown to visitors).
 *
 *  photo:    a picture URL or a path in /public (for example '/maker.webp'); optional
 *  headline: one line, for example "Hi, I'm ... and I write every pattern myself."
 *  story:    two or three sentences in the owner's own voice
 *  stats:    optional real numbers, for example [{ n: '150', l: 'Patterns designed' }]
 */
export const MAKER: {
  photo: string | null
  headline: string
  story: string
  stats: { n: string; l: string }[]
} = {
  photo: null,
  headline: '',
  story: '',
  stats: [],
}
