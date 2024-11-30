import { $, component$, useSignal, useStyles$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { worker$ } from '@builder.io/qwik-worker'

import Button from '@/components/Button'
import ExternalLink from '@/components/ExternalLink'
import Spinner from '@/media/spinner.svg?jsx'
import {
  $Bitmap,
  $Font,
  type DirectionType,
  type Glyph,
  type GlyphMeta,
} from 'bdfparser'
import fetchline from 'fetchline'

import { fonts } from '../galmuri/data'
import style from '../style.scss?inline'
import hangul from './hangul'
import hanja from './hanja'
import japanese from './japanese'
import kanji from './kanji'
import korean from './korean'
import pageStyle from './style.scss?inline'

interface CanvasContext {
  fillStyle: any
  fillRect: any
}

interface charsets {
  [index: string]: string
}
const charsets: charsets = {
  // Hangul syllables
  set2350: hangul.set2350,
  set2355: hangul.set2355,
  set2780: hangul.set2780,
  set4358: hangul.set4358,
  set11172: hangul.set11172,
  // Kanji
  ks4888: hanja.ks4888,
  unicode4888: hanja.unicode4888,
  jis2965: kanji.jisX0208_level1,
  unicode2965: kanji.unicode2965,
  jis6355: kanji.jisX0208_level1 + kanji.jisX0208_level2,
  unicode6355: kanji.unicode6355,
  // EUC-KR
  euckr: korean.restOfEuckr + hangul.set2350 + hanja.ks4888,
  euckrWoHanja: korean.restOfEuckr + hangul.set2350,
  euckrWoHanja2355: korean.restOfEuckr + hangul.set2355,
  euckrWoHanja2780: korean.restOfEuckr + hangul.set2780,
  euckrWoHanja4358: korean.restOfEuckr + hangul.set4358,
  euckrWoHanja11172: korean.restOfEuckr + hangul.set11172,
  // Shift_JIS
  shiftjis:
    japanese.restOfShiftjis + kanji.jisX0208_level1 + kanji.jisX0208_level2,
  shiftjis_level1: japanese.restOfShiftjis + kanji.jisX0208_level1,
}

const getCharset = (charset: string): string => charsets[charset] || ''

/**
 * Height from baseline to ascent
 */
interface fontSize {
  [index: string]: number
}
const fontSize: fontSize = {
  // Galmuri
  Galmuri14: 14,
  Galmuri11: 11,
  'Galmuri11-Bold': 11,
  'Galmuri11-Condensed': 11,
  Galmuri9: 9,
  Galmuri7: 7,
  GalmuriMono11: 11,
  GalmuriMono9: 9,
  GalmuriMono7: 7,
  // Num Kadoma
  'k6x8-gothic': 7,
  'k6x8-mincho': 7,
  'misaki-gothic': 6,
  'misaki-gothic-2nd': 7,
  'misaki-mincho': 6,
  k8x12: 10,
  k8x12l: 10,
  k8x12s: 10,
  k12x8: 7,
  // Others
  'hbios-sys': 13,
  unifont: 14,
  unifont_jp: 14,
  zpix: 9,
}

const getFontSize = (font: string): number => fontSize[font] || 16

interface fontUrl {
  [index: string]: string
}
const fontUrl: fontUrl = {
  // Galmuri
  Galmuri14: 'npm/galmuri/dist/Galmuri14.bdf',
  Galmuri11: 'npm/galmuri/dist/Galmuri11.bdf',
  'Galmuri11-Bold': 'npm/galmuri/dist/Galmuri11-Bold.bdf',
  'Galmuri11-Condensed': 'npm/galmuri/dist/Galmuri11-Condensed.bdf',
  Galmuri9: 'npm/galmuri/dist/Galmuri9.bdf',
  Galmuri7: 'npm/galmuri/dist/Galmuri7.bdf',
  GalmuriMono11: 'npm/galmuri/dist/GalmuriMono11.bdf',
  GalmuriMono9: 'npm/galmuri/dist/GalmuriMono9.bdf',
  GalmuriMono7: 'npm/galmuri/dist/GalmuriMono7.bdf',
  // Num Kadoma
  'k6x8-gothic': 'gh/quiple/fonts/k6x8/k6x8_gothic.bdf',
  'k6x8-mincho': 'gh/quiple/fonts/k6x8/k6x8_mincho.bdf',
  'misaki-gothic': 'gh/quiple/fonts/misaki/misaki_gothic.bdf',
  'misaki-gothic-2nd': 'gh/quiple/fonts/misaki/misaki_gothic_2nd.bdf',
  'misaki-mincho': 'gh/quiple/fonts/misaki/misaki_mincho.bdf',
  k8x12: 'gh/quiple/fonts/k8x12/k8x12.bdf',
  k8x12l: 'gh/quiple/fonts/k8x12/k8x12L.bdf',
  k8x12s: 'gh/quiple/fonts/k8x12/k8x12S.bdf',
  k12x8: 'gh/quiple/fonts/k12x8/k12x8.bdf',
  // Others
  'hbios-sys': 'gh/quiple/hbios-sys/hbios-sys.bdf',
  unifont: 'gh/quiple/fonts/unifont/unifont.bdf',
  unifont_jp: 'gh/quiple/fonts/unifont/unifont_jp.bdf',
  zpix: 'gh/SolidZORO/zpix-pixel-font/dist/zpix.bdf',
}

const getFontUrl = (font: string): string =>
  `https://cdn.jsdelivr.net/${fontUrl[font]}` || ''

export const drawFont = worker$(
  async (
    fontName: string,
    charset: string,
    options?: {
      linelimit?: number | null
      mode?: -1 | 0 | 1 | null
      direction?: DirectionType | null
      usecurrentglyphspacing?: boolean | null
      missing?: Glyph | GlyphMeta | null
      bb?: [number, number, number, number] | null
    },
  ) => {
    const font = await $Font(fetchline(fontName))
    return font.draw(charset, options)
  },
)

export default component$(() => {
  useStyles$(style)
  useStyles$(pageStyle)
  const fontCurrent = useSignal<string>()
  const charsetCurrent = useSignal<string>('set2350')
  const canvas = useSignal<HTMLCanvasElement>()
  const drawButtonDisabled = useSignal<boolean>(false)
  const copyButtonDisabled = useSignal<boolean>(true)
  const downloadButton = useSignal<HTMLAnchorElement>()

  const drawFontImage = $(
    async (event: SubmitEvent, target: HTMLFormElement) => {
      const formData = new FormData(target),
        font = formData.get('font') as string,
        charset = formData.get('charset') as string,
        xOffset = Number(formData.get('x-offset')),
        yOffset = Number(formData.get('y-offset')),
        tileWidth = Number(formData.get('tile-width')),
        tileHeight = Number(formData.get('tile-height')),
        tileColumn = Number(formData.get('tile-column')),
        foreground = formData.get('foreground') as string,
        background = formData.get('background') as string,
        shadowColor = formData.get('shadow-color') as string,
        shadowPosition = [
          formData.get('shadow-topleft') as string,
          formData.get('shadow-top') as string,
          formData.get('shadow-topright') as string,
          formData.get('shadow-left') as string,
          formData.get('shadow-right') as string,
          formData.get('shadow-bottomleft') as string,
          formData.get('shadow-bottom') as string,
          formData.get('shadow-bottomright') as string,
        ]

      let customFont: File = new File([], '')
      if (fontCurrent.value === 'custom') {
        customFont = formData.get('custom-font') as File

        if (!customFont.size) {
          alert('사용자 지정 폰트를 업로드하세요.')
          return false
        }
      }

      let customCharset = ''
      if (charsetCurrent.value === 'custom') {
        customCharset = formData.get('custom-charset') as string

        if (!customCharset) {
          alert('사용자 지정 문자 집합을 입력하세요.')
          return false
        }
      }

      if (!tileWidth || !tileHeight) {
        alert('타일 크기를 입력하세요.')
        return false
      }
      if (tileWidth <= 0 || tileHeight <= 0) {
        alert('타일 크기에 양숫값을 입력하세요.')
        return false
      }

      if (!tileColumn) {
        alert('열 수를 입력하세요.')
        return false
      }
      if (tileColumn <= 0) {
        alert('열 수에 양숫값을 입력하세요.')
        return false
      }

      if (!foreground) {
        alert('전경색을 입력하세요.')
        return false
      }

      drawButtonDisabled.value = true
      copyButtonDisabled.value = true
      canvas.value!.classList.add('hidden')
      downloadButton.value!.classList.add('disabled')

      const __fontSize = getFontSize(font)

      const position: number[][] = []
      shadowPosition.forEach((e) => {
        if (e) position.push(e.split(' ').map((f) => Number(f)))
      })

      let xOff, yOff
      xOff = xOffset
      yOff = yOffset
      const includesArray = (data: any[], arr: any[]) => {
        return data.some(
          (e) => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)),
        )
      }
      if (
        includesArray(position, [-1, -1]) ||
        includesArray(position, [-1, 0]) ||
        includesArray(position, [-1, 1])
      ) {
        xOff++
      }
      if (
        includesArray(position, [-1, 1]) ||
        includesArray(position, [0, 1]) ||
        includesArray(position, [1, 1])
      ) {
        yOff++
      }

      let __charset = getCharset(charset)
      if (charsetCurrent.value === 'custom') {
        __charset = customCharset
      }

      const cvs = canvas.value!
      cvs.width = tileWidth * tileColumn
      cvs.height = tileHeight * Math.ceil(__charset.length / tileColumn)
      const ctx = cvs.getContext('2d')
      ctx!.reset()
      if (background !== '') {
        ctx!.fillStyle = `#${background}`
        ctx!.fillRect(
          0,
          0,
          tileWidth * tileColumn,
          tileHeight * Math.floor(__charset.length / tileColumn),
        )
        ctx!.fillRect(
          0,
          tileHeight * Math.floor(__charset.length / tileColumn),
          tileWidth * (__charset.length % tileColumn),
          tileHeight * Math.ceil(__charset.length / tileColumn),
        )
      }

      const __font = getFontUrl(font)

      let bitmap = await drawFont(__font, __charset, {
        mode: -1,
        bb: [tileWidth, tileHeight, -xOff, -(tileHeight - __fontSize) + yOff],
        linelimit: tileWidth * tileColumn,
      })
      if (position.length > 0 && shadowColor) {
        position.forEach((e) => {
          const bitmapTemp = $Bitmap(bitmap.bindata)
          bitmapTemp.shadow(...e)
          bitmapTemp.draw2canvas(ctx as CanvasContext, {
            '0': null,
            '1': `#${foreground}`,
            '2': `#${shadowColor}`,
          })
        })
      } else {
        bitmap = $Bitmap(bitmap.bindata)
        bitmap.draw2canvas(ctx as CanvasContext, {
          '0': null,
          '1': `#${foreground}`,
          '2': `#${shadowColor}`,
        })
      }

      canvas.value!.classList.remove('hidden')
      downloadButton.value!.classList.remove('disabled')
      downloadButton.value!.href = canvas.value!.toDataURL()
      downloadButton.value!.download = `${font}_${tileWidth}x${tileHeight}`
      drawButtonDisabled.value = false
      copyButtonDisabled.value = false
    },
  )

  const overrideColor = $((event: any, target: HTMLInputElement) => {
    target.value = target.value.replaceAll(/[^\dabcdefABCDEF]/g, '')
  })
  const overrideNumber = $((event: any, target: HTMLInputElement) => {
    target.value = target.value.replaceAll(/\D/g, '')
  })
  const overrideNumberMinus = $((event: any, target: HTMLInputElement) => {
    target.value = target.value.replaceAll(/[^\d-]/g, '')
  })

  return (
    <main class="container mx-auto flex flex-col-reverse lg:flex-row items-start gap-[20px] p-[20px]">
      <aside class="sticky top-[20px] flex lg:w-[24rem] flex-col gap-[20px]">
        <form
          class="flex flex-col gap-[10px]"
          preventdefault:submit
          onSubmit$={drawFontImage}>
          <div class="form">
            <div class="form-row">
              <label class="left" for="font">
                폰트
              </label>
              <div class="right">
                <select
                  id="font"
                  name="font"
                  onChange$={(event, target) => {
                    fontCurrent.value = target.value
                  }}>
                  <optgroup label="Galmuri">
                    {fonts.map((font) => (
                      <option
                        key={`option_${font.name.replaceAll(' ', '-')}`}
                        value={font.name.replaceAll(' ', '-')}
                        selected={font.name === 'Galmuri11' ? true : false}
                        label={`${font.name} (${font.size}px)`}
                      />
                    ))}
                  </optgroup>
                  <optgroup label="Num Kadoma">
                    <option value="k6x8-gothic" label="k6x8 Gothic (8px)" />
                    <option value="k6x8-mincho" label="k6x8 Mincho (8px)" />
                    <option value="misaki-gothic" label="Misaki Gothic (8px)" />
                    <option
                      value="misaki-gothic-2nd"
                      label="Misaki Gothic 2nd (8px)"
                    />
                    <option value="misaki-mincho" label="Misaki Mincho (8px)" />
                    <option value="k8x12" label="k8x12 (12px)" />
                    <option value="k8x12l" label="k8x12L (12px)" />
                    <option value="k8x12s" label="k8x12S (12px)" />
                    <option value="k12x8" label="k12x8 (8px)" />
                  </optgroup>
                  <optgroup label="기타">
                    <option value="hbios-sys" label="HBIOS-SYS (16px)" />
                    <option value="unifont" label="Unifont (16px)" />
                    <option value="unifont_jp" label="Unifont JP (16px)" />
                    <option value="zpix" label="Zpix (12px)" />
                  </optgroup>
                  {/* <option value="custom">사용자 지정 폰트 업로드</option> */}
                </select>
              </div>
            </div>
            {fontCurrent.value === 'custom' && (
              <div class="form-row col">
                <label class="left" for="custom-font">
                  사용자 지정 폰트 (.bdf)
                </label>
                <div class="right">
                  <input
                    type="file"
                    id="custom-font"
                    name="custom-font"
                    accept=".bdf"
                  />
                </div>
              </div>
            )}
            <div class="form-row">
              <label class="left" for="charset">
                문자 집합
              </label>
              <div class="right">
                <select
                  name="charset"
                  id="charset"
                  onChange$={(event, target) => {
                    charsetCurrent.value = target.value
                  }}>
                  <optgroup label="한글 음절">
                    <option value="set2350" selected>
                      2350자
                    </option>
                    <option value="set2355" label="2355자" />
                    <option value="set2780" label="2780자" />
                    <option value="set4358" label="4358자" />
                    <option value="set11172" label="11172자" />
                  </optgroup>
                  <optgroup label="한자">
                    <option value="ks4888" label="KS 순서 4888자" />
                    <option value="unicode4888" label="Unicode 순서 4888자" />
                    <option value="jis2965" label="JIS 순서 2965자" />
                    <option value="unicode2965" label="Unicode 순서 2965자" />
                    <option value="jis6355" label="JIS 순서 6355자" />
                    <option value="unicode6355" label="Unicode 순서 6355자" />
                  </optgroup>
                  <optgroup label="EUC-KR">
                    <option value="euckr" label="EUC-KR" />
                    <option value="euckrWoHanja" label="한자 제외" />
                    <option
                      value="euckrWoHanja2355"
                      label="한자 제외, 한글 2355자"
                    />
                    <option
                      value="euckrWoHanja2780"
                      label="한자 제외, 한글 2780자"
                    />
                    <option
                      value="euckrWoHanja4358"
                      label="한자 제외, 한글 4358자"
                    />
                    <option
                      value="euckrWoHanja11172"
                      label="한자 제외, 한글 11172자"
                    />
                  </optgroup>
                  <optgroup label="Shift_JIS">
                    <option value="shiftjis" label="Shift_JIS" />
                    <option
                      value="shiftjis_level1"
                      label="제1수준 한자만 포함"
                    />
                  </optgroup>
                  <optgroup>
                    <option value="custom" label="사용자 지정 문자 집합 입력" />
                  </optgroup>
                </select>
              </div>
            </div>
            {charsetCurrent.value !== 'custom' && (
              <div class="form-row col">
                <label class="left" for="charset-preview">
                  문자 집합 미리보기
                </label>
                <div class="right">
                  <textarea
                    id="charset-preview"
                    class="w-full min-h-20 break-all"
                    value={getCharset(charsetCurrent.value)}
                    lang={
                      [
                        'jis2965',
                        'jis6355',
                        'unicode2965',
                        'unicode6355',
                        'shiftjis',
                        'shiftjis_level1',
                      ].some((charset) =>
                        charsetCurrent.value.startsWith(charset),
                      )
                        ? 'ja'
                        : 'ko'
                    }
                    onClick$={(event, target) => target.select()}
                    readOnly
                  />
                </div>
              </div>
            )}
            {charsetCurrent.value === 'custom' && (
              <div class="form-row col">
                <label class="left" for="custom-charset">
                  사용자 지정 문자 집합
                </label>
                <div class="right">
                  <textarea
                    id="custom-charset"
                    name="custom-charset"
                    class="w-full min-h-20"
                    placeholder="사용자 지정 문자 집합을 입력하세요."
                  />
                </div>
              </div>
            )}
            <div class="form-row">
              <label class="left" for="x-offset">
                오프셋
              </label>
              <div class="right !flex-col">
                <div>
                  x:
                  <input
                    id="x-offset"
                    name="x-offset"
                    class="tabular-nums text-right"
                    type="number"
                    value="0"
                    onKeyDown$={overrideNumberMinus}
                    onKeyPress$={overrideNumberMinus}
                    onKeyUp$={overrideNumberMinus}
                    onBlur$={overrideNumberMinus}
                  />
                  px
                </div>
                <div>
                  y:
                  <input
                    id="y-offset"
                    name="y-offset"
                    class="tabular-nums text-right"
                    type="number"
                    value="0"
                    onKeyDown$={overrideNumberMinus}
                    onKeyPress$={overrideNumberMinus}
                    onKeyUp$={overrideNumberMinus}
                    onBlur$={overrideNumberMinus}
                  />
                  px
                </div>
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="tile-width">
                타일 크기
              </label>
              <div class="right !flex-col">
                <div>
                  너비:
                  <input
                    id="tile-width"
                    name="tile-width"
                    class="tabular-nums text-right"
                    type="number"
                    value="16"
                    min="1"
                    onKeyDown$={overrideNumber}
                    onKeyPress$={overrideNumber}
                    onKeyUp$={overrideNumber}
                    onBlur$={overrideNumber}
                  />
                  px
                </div>
                <div>
                  높이:
                  <input
                    id="tile-height"
                    name="tile-height"
                    class="tabular-nums text-right"
                    type="number"
                    value="16"
                    min="1"
                    onKeyDown$={overrideNumber}
                    onKeyPress$={overrideNumber}
                    onKeyUp$={overrideNumber}
                    onBlur$={overrideNumber}
                  />
                  px
                </div>
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="tile-column">
                열 수
              </label>
              <div class="right">
                <input
                  id="tile-column"
                  name="tile-column"
                  class="tabular-nums text-right"
                  type="number"
                  value="64"
                  min="1"
                  onKeyDown$={overrideNumber}
                  onKeyPress$={overrideNumber}
                  onKeyUp$={overrideNumber}
                  onBlur$={overrideNumber}
                />
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="foreground">
                전경색
              </label>
              <div class="right !flex-col">
                <div>
                  #
                  <input
                    id="foreground"
                    name="foreground"
                    class="tabular-nums"
                    type="text"
                    spellcheck={false}
                    value="63cf63"
                    onKeyDown$={overrideColor}
                    onKeyPress$={overrideColor}
                    onKeyUp$={overrideColor}
                    onBlur$={overrideColor}
                  />
                </div>
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="background">
                <abbr title="비워 두면 투명을 사용합니다.">배경색</abbr>
              </label>
              <div class="right !flex-col">
                <div>
                  #
                  <input
                    id="background"
                    name="background"
                    class="tabular-nums"
                    type="text"
                    spellcheck={false}
                    value="000000"
                    onKeyDown$={overrideColor}
                    onKeyPress$={overrideColor}
                    onKeyUp$={overrideColor}
                    onBlur$={overrideColor}
                  />
                </div>
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="shadow-color">
                그림자 색
              </label>
              <div class="right !flex-col">
                <div>
                  #
                  <input
                    id="shadow-color"
                    name="shadow-color"
                    class="tabular-nums"
                    type="text"
                    spellcheck={false}
                    value="3933ff"
                    onKeyDown$={overrideColor}
                    onKeyPress$={overrideColor}
                    onKeyUp$={overrideColor}
                    onBlur$={overrideColor}
                  />
                </div>
              </div>
            </div>
            <div class="form-row">
              <label class="left" for="shadow-bottomright">
                그림자 위치
              </label>
              <div class="right">
                <div class="!grid grid-cols-3 !gap-0">
                  <input
                    type="checkbox"
                    name="shadow-topleft"
                    value="-1 1"
                    id="shadow-topleft"
                  />
                  <input
                    type="checkbox"
                    name="shadow-top"
                    value="0 1"
                    id="shadow-top"
                  />
                  <input
                    type="checkbox"
                    name="shadow-topright"
                    value="1 1"
                    id="shadow-topright"
                  />
                  <input
                    type="checkbox"
                    name="shadow-left"
                    value="-1 0"
                    id="shadow-left"
                  />
                  <input type="checkbox" disabled />
                  <input
                    type="checkbox"
                    name="shadow-right"
                    value="1 0"
                    id="shadow-right"
                  />
                  <input
                    type="checkbox"
                    name="shadow-bottomleft"
                    value="-1 -1"
                    id="shadow-bottomleft"
                  />
                  <input
                    type="checkbox"
                    name="shadow-bottom"
                    value="0 -1"
                    id="shadow-bottom"
                  />
                  <input
                    type="checkbox"
                    name="shadow-bottomright"
                    value="1 -1"
                    id="shadow-bottomright"
                  />
                </div>
              </div>
            </div>
          </div>
          <Button
            umami="비트맵 폰트 이미지 만들기"
            disabled={drawButtonDisabled.value}
            loading={drawButtonDisabled.value}
            type="submit"
            primary
            big>
            {drawButtonDisabled.value ? '만드는 중…' : '만들기'}
          </Button>
          <div class="flex gap-[10px]">
            <Button
              type="button"
              disabled={copyButtonDisabled.value}
              umami="비트맵 폰트 이미지 복사"
              onClick$={(event, target) =>
                canvas.value!.toBlob((blob) => {
                  navigator.clipboard
                    .write([new ClipboardItem({ 'image/png': blob! })])
                    .then(
                      () => {
                        target.innerHTML = '복사됨!'
                        setTimeout(() => {
                          target.innerHTML = '복사하기'
                        }, 3000)
                      },
                      () => {
                        alert('이미지를 복사하지 못했습니다.')
                      },
                    )
                })
              }
              flex1
              big>
              복사하기
            </Button>
            <a
              data-umami-event="비트맵 폰트 이미지 다운로드"
              ref={downloadButton}
              href="#"
              download
              class="button big disabled flex-1">
              다운로드
            </a>
          </div>
        </form>
        <article class="prose prose-sm prose-zinc max-w-full">
          <h2>문자 집합</h2>
          <ul>
            <li>
              한글 음절
              <ul>
                <li>
                  2350자:{' '}
                  <ExternalLink
                    text="KS X 1001"
                    href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT"
                  />
                  의 모든 한글 음절.
                </li>
                <li>
                  2355자: KS X 1001의 모든 한글 음절에{' '}
                  <abbr title="KS X 1001에 포함된 뢨, 썅, 쏀, 쓩, 쭁을 입력하기 위한 보충 문자.">
                    뢔, 쌰, 쎼, 쓔, 쬬
                  </abbr>{' '}
                  5자가 추가된 집합.
                </li>
                <li>
                  2780자:{' '}
                  <ExternalLink
                    text="Adobe-KR-0"
                    href="https://github.com/adobe-type-tools/Adobe-KR"
                  />
                  의 모든 한글 음절. KS X 1001의 2350자를 포함합니다.
                </li>
                <li>
                  4358자: Adobe-KR-0과 Adobe-KR-1의 모든 한글 음절. KS X 1001,{' '}
                  <ExternalLink
                    text="KS X 1002"
                    href="https://en.wikipedia.org/wiki/KS_X_1002"
                  />
                  ,{' '}
                  <ExternalLink
                    text="KPS 9566"
                    href="https://www.unicode.org/L2/L2018/18011-info-kps9566-2011.pdf"
                  />
                  ,{' '}
                  <ExternalLink
                    text="GB/T 12052"
                    href="https://ccjktype.fonts.adobe.com/wp-content/uploads/2014/12/gb12052-uni.txt"
                  />
                  의 모든 한글 음절을 포함합니다.
                </li>
                <li>11172자: 현대 한글의 모든 음절.</li>
              </ul>
            </li>
            <li>
              한자
              <ul>
                <li>
                  KS 4888자:{' '}
                  <ExternalLink
                    text="KS X 1001"
                    href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT"
                  />
                  의 모든 한자.
                </li>
                <li>
                  JIS 2965자:{' '}
                  <ExternalLink
                    text="JIS X 0208"
                    href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/JIS0208.TXT"
                  />
                  의 제1수준 한자.
                </li>
                <li>
                  JIS 6355자: JIS X 0208의 제1수준과 제2수준을 합한 모든 한자.
                </li>
              </ul>
            </li>
            <li>
              EUC-KR
              <ul>
                <li>
                  EUC-KR: KS X 1001과 KS X 1003을 포함하는 문자 집합. 라틴
                  문자와 기호, 한자 등을 포함합니다.
                </li>
                <li>한자 제외: EUC-KR에서 한자를 제외한 문자 집합.</li>
              </ul>
            </li>
            <li>
              Shift_JIS
              <ul>
                <li>
                  Shift_JIS:{' '}
                  <ExternalLink
                    text="JIS X 0201"
                    href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/JIS0201.TXT"
                  />
                  과 JIS X 0208을 포함하는 문자 집합. 라틴 문자와 기호 등을
                  포함합니다.
                </li>
                <li>
                  제1수준 한자만 포함: Shift_JIS에서 JIS X 0208의 제2수준 한자
                  3390자를 제외한 문자 집합.
                </li>
              </ul>
            </li>
          </ul>
          <p>
            &copy; 2024 Lee Minseo. 각 폰트는 해당 소유자 및 사용 허가자의 상표
            및 저작권 자산입니다.
          </p>
        </article>
      </aside>
      <div class="flex flex-1 items-center justify-center self-stretch bg-zinc-50 min-h-40 rounded-md">
        <canvas id="preview" class="hidden max-w-full" ref={canvas} />
        {drawButtonDisabled.value ? (
          <Spinner height="2em" class="stroke-current" />
        ) : (
          <span class="canvas-placeholder m-4">
            폰트 이미지를 만들려면 조건을 설정하고 만들기 버튼을 누르세요.
          </span>
        )}
      </div>
    </main>
  )
})

export const head: DocumentHead = {
  title: '비트맵 폰트 이미지 생성기',
  meta: [
    {
      name: 'description',
      content: 'BDF 폰트를 사용하여 폰트 이미지를 만드는 도구.',
    },
    {
      property: 'og:title',
      content: '비트맵 폰트 이미지 생성기',
    },
    {
      property: 'og:description',
      content: 'BDF 폰트를 사용하여 폰트 이미지를 만드는 도구.',
    },
  ],
  links: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/images/q.svg',
    },
    {
      rel: 'mask-icon',
      type: 'image/svg+xml',
      href: '/images/q.svg',
    },
    {
      rel: 'apple-touch-icon',
      type: 'image/svg+xml',
      href: '/images/q.png',
    },
  ],
}
