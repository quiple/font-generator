import { component$, useStyles$ } from '@builder.io/qwik'
import { Link } from '@builder.io/qwik-city'

import style from './style.scss?inline'

export default component$(() => {
  useStyles$(style)

  return (
    <main class="container mx-auto p-[20px]">
      <article class="prose prose-zinc max-w-full">
        <p>페이지가 없습니다.</p>
        <ul>
          <li>
            <Link href="/">메인 페이지로</Link>
          </li>
        </ul>
      </article>
    </main>
  )
})
