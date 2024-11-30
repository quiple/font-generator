import type { ButtonHTMLAttributes } from '@builder.io/qwik'
import { Slot, component$ } from '@builder.io/qwik'

import Spinner from '@/media/spinner.svg?jsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  big?: boolean
  flex1?: boolean
  loading?: boolean
  primary?: boolean
  umami?: string
}

export default component$<ButtonProps>((props) => {
  return (
    <button
      type={props.type}
      disabled={props.disabled}
      onClick$={props.onClick$}
      data-umami-event={props.umami}
      class={[
        'cursor-pointer',
        'flex',
        'flex-wrap',
        'gap-2',
        'items-center',
        'justify-center',
        'rounded-[5px]',
        'transition',
        props.flex1 && 'flex-1',
        props.big ? 'p-[6px_7px]' : 'p-[3px_7px]',
        props.disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        props.disabled
          ? [
              'bg-[rgba(255,255,255,.5)]',
              'shadow-[0_.5px_2.5px_rgba(0,0,0,.15),0_0_0_.5px_rgba(0,0,0,.03)]',
              'text-[var(--text-tertiary)]',
            ]
          : props.primary
            ? [
                'bg-[linear-gradient(180deg,rgba(255,255,255,.17)_0,transparent_100%)]',
                'bg-[var(--accents-blue)]',
                'shadow-[0_1px_2.5px_rgba(0,122,255,.24),0_0_0_.5px_rgba(0,122,255,.12)]',
                'text-white',
              ]
            : [
                'bg-white',
                'shadow-[0_.5px_2.5px_rgba(0,0,0,.3),0_0_0_.5px_rgba(0,0,0,.05)]',
              ],
      ]}>
      {props.loading && <Spinner height="1em" class="stroke-current" />}
      <Slot />
    </button>
  )
})
