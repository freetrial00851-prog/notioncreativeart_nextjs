import { ContentPage } from '../components/ContentPage'

export function Contact() {
  return (
    <ContentPage eyebrow="SUPPORT" title="Contact">
      <p>Questions about a pattern, an order, or something else — I read every message myself and I'm happy to help.</p>
      <p>
        Email:{' '}
        <a href="mailto:patterns@notioncreativeart.com" className="text-ink underline underline-offset-4">
          patterns@notioncreativeart.com
        </a>
      </p>
      <p>I typically reply within 1–2 days.</p>
    </ContentPage>
  )
}
