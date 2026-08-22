import { ContentPage } from '../components/ContentPage'

export function Contact() {
  return (
    <ContentPage eyebrow="SUPPORT" title="Contact">
      <p>Questions about a pattern, an order, or something else — I read every message myself and I'm happy to help.</p>
      <p>
        Email:{' '}
        <a href="mailto:engg.muhammadsufyan@gmail.com" className="text-ink underline underline-offset-4">
          engg.muhammadsufyan@gmail.com
        </a>
      </p>
      <p>I typically reply within 1–2 days.</p>
    </ContentPage>
  )
}
