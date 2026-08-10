const plugin = require('tailwindcss/plugin')

module.exports = {
    important: false,
    content: [
        "src/views/**/*.twig",
        "src/assets/js/**/*.js",
        //todo:: inject it via the plugin or easier way
        'node_modules/@salla.sa/twilight-tailwind-theme/safe-list-css.txt',
    ],
    darkMode: 'class', // or 'media' or 'class'
    theme   : {
        container : {
            center : true,
            // T-2.18 — 16px, measured. Every framed box on every artboard is
            // 361 wide inside a 393 page: a 16px inset on each side. 10px was
            // upstream's.
            padding: '16px',
            screens: {
                '2xl': "1280px"
            }
        },
        /**
         * T-2.02 — the face is always `--font-main`, which master.twig fills
         * from the merchant's choice. `--font-fallback` (01-settings/fonts.scss)
         * follows it in both stacks, because master.twig writes `--font-main` as
         * a single bare family with nothing after it — if the platform's font
         * stylesheet is slow or fails, the browser drops to its own default,
         * which on an Arabic page is often a serif with quite different metrics.
         * That is a layout shift, and this is the mitigation.
         *
         * No family is named here. B1: never pin a font in Tailwind or SCSS.
         */
        fontFamily: {
            sans: [
                'var(--font-main)',
                'var(--font-fallback)',
            ],
            primary: 'var(--font-main), var(--font-fallback)'
        },
        extend    : {
            transitionTimingFunction: {
              'elastic': 'cubic-bezier(0.55, 0, 0.1, 1)',
            },
            gridTemplateColumns: {
                'auto-fill'  : 'repeat(auto-fill, 290px)',
            },
            colors             : {
                'dark'         : '#1D1F1F',
                'darker'       : '#0E0F0F',
                'danger'       : '#AE0A0A',
                'primary-dark' : 'var(--color-primary-dark)',

                // T-2.01 — the merchant's secondary brand colour, from the
                // `secondary_color` theme setting. Named `brand-secondary` and
                // not `secondary` on purpose: `secondary` would also generate
                // `text-secondary`, which already means the neutral body-text
                // grey below. Two different colours behind one class name is a
                // bug waiting for a hurried afternoon.
                'brand-secondary': 'var(--color-brand-secondary)',
            },

            /**
             * T-2.01 — semantic tokens, registered in the specific scales they
             * are meant for rather than in `colors`.
             *
             * Putting `surface-page` in `colors` would generate `text-surface-page`
             * and `border-surface-page` as well, which are meaningless, and
             * putting `subtle` there would produce `border-border-subtle`. Scoping
             * each token to its own scale yields exactly the class names the
             * design language uses — `bg-surface-page`, `text-secondary`,
             * `border-subtle` — and nothing that invites misuse.
             *
             * The CSS custom properties in 01-settings/global.scss remain the
             * source of truth. These are aliases onto them, so a merchant
             * override cascades without a rebuild.
             */
            backgroundColor    : {
                'surface-page': 'var(--surface-page)',
                // T-2.17 — the warm tone, now on the surface that actually
                // carries it in the artboards. See T-2.18 for `.s-block`.
                'surface-section': 'var(--surface-section)',
                'surface-card': 'var(--surface-card)',
                // T-2.19 — the one solid neutral fill the design uses.
                'surface-control': 'var(--surface-control)',
                'accent-soft' : 'var(--accent-soft)',
            },
            textColor          : {
                'secondary': 'var(--text-secondary)',
            },
            borderColor        : {
                // Decorative only — 1.17:1 on the page. Never on a form control.
                'subtle'     : 'var(--border-subtle)',
                // Meaningful boundaries — 5.90:1 on the page against the 3:1
                // 1.4.11 asks for. T-2.17 replaced a derived value with the
                // design's own, and the measurement is the stronger of the two.
                'interactive': 'var(--border-interactive)',
            },
            spacing: {
              '3.75': '15px',
              '7.5' : '30px',
              '58'  : '232px',
              '62'  : '248px',
              '100' : '28rem',
              '116' : '464px',
              '132' : '528px',
              '200' : '800px',
            },
            borderRadius       : {
                // T-2.17 — 16px, measured. The SVG exports put every section
                // panel, the hero frame and the bottom sheet at rx 16; upstream's
                // 22px was the scaffold's and matches nothing in the design.
                'large': '16px',
                'big'  : '40px',
                'tiny' : '3px',
                DEFAULT: '.75rem',
            },
            fontSize           : {
                'icon-lg'   : '33px',
                'xxs'       : '10px',
                'xxxs'      : '8px',
                'title-size': '42px',
                '22px'      : '22px',
            },
            lineHeight         : {
                '12': '3rem',
                '14': '3.5rem',
                '16': '4rem',
                '18': '4.5rem',
                '20': '5rem',
            },
            boxShadow          : {
                /**
                 * T-2.19 — the three shadows the design actually draws, read out
                 * of the SVG filter stacks rather than guessed. `stdDeviation`
                 * is half the CSS blur radius, and the colour is the last
                 * `feColorMatrix` in each stack:
                 *
                 *   dy 2   sd 20  -> 0 2px 40px  rgb(0 0 0 / 10%)   panels, the floating header
                 *   dy 1.5 sd 2   -> 0 1.5px 4px rgb(51 51 51 / 8%) small controls
                 *   dy 4   sd 4   -> 0 4px 8px   rgb(51 51 51 / 4%) raised cards
                 */
                /**
                 * T-2.12 — the toast's, read the same way and worth one note.
                 * The geometry is unanimous across all eight notification
                 * exports (`dy -8`, `stdDeviation 14`); the colour is not — three
                 * files carry three different values. `rgb(51 51 51 / 8%)` is
                 * both the most common and the one `shadow-control` already
                 * uses, so where the design contradicts itself the theme keeps
                 * the value it already has rather than adding a fourth.
                 */
                'toast'   : '0 -8px 28px rgb(51 51 51 / 8%)',
                // T-3.07 — the floating menu's, and the toast's mirror: `dy 8`,
                // `stdDeviation 14`, `0.2 0.2 0.2 @ 6%` in all five «Floating
                // Menu» exports.
                'floating': '0 8px 28px rgb(51 51 51 / 6%)',
                'panel'   : '0 2px 40px rgb(0 0 0 / 10%)',
                'control' : '0 1.5px 4px rgb(51 51 51 / 8%)',
                'raised'  : '0 4px 8px rgb(51 51 51 / 4%)',
                'default' : '5px 10px 30px #2B2D340D;',
                'top'     : '0px 0px 10px #0000001A;',
                'md'      : '5px 10px 99px #2B2D340D',
                'dropdown'      : '0 4px 8px rgba(161, 121, 121, 0.07)',
                'light'   : '0px 4px 15px rgba(1, 1, 1, 0.06)',
                'huge'    : '0px 3px 6px #00000029',
                'progress': '0 5px 15px rgba(92, 213, 196, 0.4)',
                'mobile': 'rgb(0 0 0 / 9%) 0px 2px 1px, rgb(0 0 0 / 9%) 0px 4px 2px, rgb(0 0 0 / 9%) 0px 8px 4px, rgb(0 0 0 / 9%) 0px 16px 18px, rgb(0 0 0 / 9%) -15px 10px 7px, rgb(0 0 0 / 9%) -20px 10px 20px, rgb(0 0 0 / 9%) -20px 10px 20px, rgb(0 0 0 / 9%) -25px 20px 20px',
            },
            width              : {
                '18': '4.5rem',
                '22': '5.5rem',
                '74': '18.5rem',
                '76': '19rem',
                '78': '19.5rem',
            },
            height             : {
                'banner'        : '200px',
                'lg-banner'     : '428px',
                'full-banner'   : '600px',
                '500'           : '500px',
                '460'           : '460px',
            },
            minWidth           : {
                '1/4': '25%',
                '1/2': '50%',
                '3/4': '75%',
            },
            maxWidth           : {
                '1/4': '25%',
                '1/2': '50%',
                '3/4': '75%',
            },
            zIndex             : {
                '1': '1',
                '2': '2',
                '-1': '-1',
            },
            screens            : {
                'xxs': {'min': '380px', 'max': '479px'},
                'xs': '480px',
            },
            backgroundOpacity  : {
                '05': '0.05',
            },
            transitionProperty : {
                'height': 'height'
            },
            keyframes: {
                slideUpFromBottom: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0%)', opacity: '1' },
                },
                slideDownFromBottom: {
                    '0%': { transform: 'translateY(0%)', opacity: '1' },
                    '100%': { transform: 'translateY(100%)', opacity: '0' },
                },
            },
            animation: {
                slideUpFromBottom: 'slideUpFromBottom .6s linear',
                slideDownFromBottom: 'slideDownFromBottom .6s linear',
            },
        },
    },
    // T-2.01 — `corePlugins: { outline: false }` was removed from here. It was a
    // no-op: Tailwind 3 has no core plugin named `outline`, only `outlineStyle`,
    // `outlineWidth`, `outlineOffset` and `outlineColor`, so the key was a
    // leftover from Tailwind 2 and every outline utility was being generated
    // anyway — `.outline-none` is in the built CSS. T-1.08 recorded this line as
    // the cause of the theme's missing focus indicator; it was not. The real
    // cause is `a:focus { outline: none }` in 02-generic/reset.scss, and
    // 02-generic/focus.scss now overrides it.
    plugins: [
      require('@salla.sa/twilight-tailwind-theme'),
      require('@tailwindcss/forms'),
      require('@tailwindcss/line-clamp'),

      /**
       * T-1.04 — bidi isolation primitives.
       *
       * The store is Arabic-first, so the page direction is RTL, but much of the
       * data inside it is not Arabic: brand names, product names, SKUs, order and
       * tracking numbers, emails. Dropping a Latin run into an RTL paragraph
       * without isolating it lets the Unicode bidi algorithm reorder the neutral
       * characters around it — trailing punctuation jumps to the wrong end, and a
       * name like «Nike Air Max 90 (2024)» comes apart. These four utilities are
       * the theme's only sanctioned fix.
       *
       * ALWAYS APPLY THESE INLINE — to a <span> or <bdi> around the run, never to
       * the block that contains it. `unicode-bidi` on a block element re-resolves
       * that block's own `text-align: start`, which silently flips the whole
       * block's alignment to the opposite edge of the page.
       *
       *   .bidi-auto     unknown script — merchant and customer data whose
       *                  language we cannot know: product names, brand names,
       *                  category names, customer names, review bodies. Base
       *                  direction is taken from the first strong character, so
       *                  Arabic data still reads RTL. This is the default choice.
       *   .bidi-isolate  known to match the page direction; needs isolating only
       *                  so adjacent neutrals do not leak across the boundary.
       *   .bidi-ltr      known Latin or numeric technical strings — SKUs, order
       *                  numbers, tracking numbers, emails, URLs.
       *   .bidi-rtl      the mirror case: Arabic held inside the English
       *                  storefront, which src/locales/en.json makes reachable.
       *
       * Upstream ships `.unicode` in 02-generic/common.scss, which is `.bidi-auto`
       * under a name that says nothing. It is left alone because upstream
       * templates use it and shadowing common.scss would buy nothing. New theme
       * code uses the names below.
       *
       * Shadow DOM caveat: `unicode-bidi` does not inherit, so these cannot reach
       * inside a `salla-*` component's shadow root. Where a Salla component
       * renders merchant data itself, isolation has to come from that component's
       * own parts (technique C) instead.
       */
      plugin(({ addUtilities }) => {
        addUtilities({
          '.bidi-auto'   : { 'unicode-bidi': 'plaintext' },
          '.bidi-isolate': { 'unicode-bidi': 'isolate' },
          '.bidi-ltr'    : { direction: 'ltr', 'unicode-bidi': 'isolate' },
          '.bidi-rtl'    : { direction: 'rtl', 'unicode-bidi': 'isolate' },
        })
      }),
    ],
}
