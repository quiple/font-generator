import { component$ } from '@builder.io/qwik'

interface ExternalLink {
  text: string
  href: string
  class?: string
  content?: any
}

export default component$<ExternalLink>((props) => {
  return (
    <a
      href={props.href}
      class={!props.content && 'new ' + props.class}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${props.text} (새 탭에서 열림)`}>
      {props.content ? props.content : props.text}
    </a>
  )
})
