import { component$ } from '@builder.io/qwik'
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from '@builder.io/qwik-city'
import { isDev } from '@builder.io/qwik/build'

import { RouterHead } from '@/components/router-head/router-head'
import '@/global.scss'
import 'prism-themes/themes/prism-vsc-dark-plus.min.css'

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <>
            <link
              rel="manifest"
              href={`${import.meta.env.BASE_URL}manifest.json`}
            />
            <script
              defer
              src="https://umami.quiple.dev/script.js"
              data-website-id="c11336e5-f347-4ae5-a289-3f7c9edbe5cd"
            />
          </>
        )}
        <RouterHead />
      </head>
      <body>
        <RouterOutlet />
        {!isDev && <ServiceWorkerRegister />}
      </body>
    </QwikCityProvider>
  )
})
