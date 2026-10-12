// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
        // Keep logical properties as written. preset-env otherwise rewrites
        // `inset-inline-start` to `left`, `margin-inline-end` to `margin-right`
        // and so on — fixed to LTR — so on this RTL-first store every rule meant
        // to follow the page direction (the switch knob, the hotspot markers,
        // the floating buttons' corners) was mirrored the wrong way. Every
        // browser the theme supports handles logical properties natively.
        'logical-properties-and-values': false,
        'float-clear-logical-values': false,
        'logical-overflow': false,
        'logical-overscroll-behavior': false,
        'logical-resize': false,
        'logical-viewport-units': false,
      },
    },
  }
}
