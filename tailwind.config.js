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
            padding: '10px',
            screens: {
                '2xl': "1280px"
            }
        },
        fontFamily: {
            sans: [
                'var(--font-main)',
                '-apple-system',
                'BlinkMacSystemFont',
            ],
            primary: "var(--font-main)"
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
                'primary-dark' : 'var(--color-primary-dark)'
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
                'large': '22px',
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
    corePlugins: {
      outline: false,
    },
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
