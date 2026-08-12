const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ThemeWatcher = require('@salla.sa/twilight/watcher.js');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {execFileSync} = require('child_process');

/**
 * T-8.01 — run the stylesheet split after every emit.
 *
 * A webpack plugin rather than a line in `package.json`, so that `pnpm watch`
 * gets the same two sheets a production build does. A developer whose watch
 * build silently skipped the split would be looking at an `app.css` that still
 * held the platform's component CSS, and would debug the wrong file.
 *
 * A failure here fails the build. The script's own guard — the missing marker —
 * is the case that matters: without it, one unsplit 100 KB sheet would ship and
 * nothing would say why.
 */
class SplitCssPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('SplitCssPlugin', (compilation, done) => {
            // ORDER IS LOAD-BEARING. `extract-critical.mjs` reads `app.css`
            // AFTER the split has taken the platform's `s-*` rules out of it.
            // Run the other way round and the critical sheet would be cut from
            // the unsplit file — every `salla-*` rule the fold touches would be
            // inlined and then shipped a second time in the deferred sheet.
            const steps = ['scripts/split-css.mjs', 'scripts/extract-critical.mjs'];
            try {
                for (const step of steps) {
                    const out = execFileSync(process.execPath, [path.resolve(step)], {
                        encoding: 'utf8',
                    });
                    // stderr, not stdout: `webpack --json` writes the stats object
                    // to stdout, and a progress banner in the middle of it makes
                    // the output unparseable.
                    process.stderr.write('\n' + out + '\n');
                }
                done();
            } catch (error) {
                done(new Error('css pipeline failed:\n' + (error.stdout || '') + (error.stderr || error.message)));
            }
        });
    }
}

const asset = file => path.resolve('src/assets', file || '');
const public = file => path.resolve("public", file || '');

module.exports = {
    entry  : {
        // Everything in the `app` array ships in the bundle every page loads.
        // They are array entries rather than imports in `app.js` because that
        // file was, until T-3.06, expensive to touch under the T-1.07 lint
        // ratchet. T-3.06 adopted and cleaned it, so the reason is now weaker —
        // but the array still keeps each partial's lint surface its own, and
        // `toast.js` depends on sharing this chunk with `app.js`'s sweetalert2.
        app     : [asset('styles/app.scss'), asset('js/wishlist.js'), asset('js/app.js'), asset('js/blog.js'), asset('js/partials/bottom-sheet.js'), asset('js/partials/sticky-header.js'), asset('js/partials/announcement.js'), asset('js/partials/otp.js'), asset('js/partials/quantity.js'), asset('js/partials/toast.js'), asset('js/partials/floating-menu.js'), asset('js/partials/quick-view.js'), asset('js/partials/sort-disclosure.js'), asset('js/partials/auth.js'), asset('js/partials/loyalty-popup.js'), asset('js/partials/date-picker.js'), asset('js/partials/accordion.js')],
        /*
         * T-8.03 — `media` is the shared home of the two heavy third-party
         * libraries, and it exists because they were being shipped twice.
         *
         * Measured on 2026-08-11 from a `--json` build: `fslightbox` (30.9 KB
         * raw) and `lite-youtube-embed` (10.4 KB) were in **both** `home.js`
         * and `product.js`, because separate webpack entries do not share
         * modules — 41 KB of the 60 KB total duplication in the build.
         *
         * Both entries `dependOn` it, and `index.twig` and `product/single.twig`
         * load it **before** their own bundle. It is not folded into `app.js`,
         * which every page loads: a customer reading the shipping policy has no
         * lightbox and no video, and moving 41 KB onto every page to save it on
         * two is the wrong direction.
         *
         * `window.fslightbox` is still assigned by the pages themselves rather
         * than here, so upstream markup that reaches for it is untouched.
         */
        media   : [asset('js/vendor/media.js')],
        home    : {import: asset('js/home.js'), dependOn: ['app', 'media']},
        // T-8.03 — NOT `dependOn: 'app'`. These three load in `<head>`, before
        // `app.js` is even parsed, so a shared-module reference into it would
        // be a reference into a bundle that has not run yet.
        'product-card' : asset('js/partials/product-card.js'),
        'main-menu' : asset('js/partials/main-menu.js'),
        'add-product-toast': asset('js/partials/add-product-toast.js'),
        'wishlist-card': {import: asset('js/partials/wishlist-card.js'), dependOn: 'app'},
        'digital-files': {import: asset('js/partials/digital-files.js'), dependOn: 'app'},
        // T-5.08 — its own entry rather than a line in `pages`, which is
        // loyalty.js + brands.js and serves neither of this page's needs.
        notifications: {import: asset('js/partials/notifications.js'), dependOn: 'app'},
        checkout: {import: [asset('js/cart.js'), asset('js/thankyou.js')], dependOn: 'app'},
        pages   : {import: [asset('js/loyalty.js'), asset('js/brands.js')], dependOn: 'app'},
        product : {import: [asset('js/product.js'), asset('js/products.js')], dependOn: ['app', 'media']},
        // T-6.01 joins the existing `order` bundle rather than opening a second
        // one: both pages of the orders area load it, and each class gates itself
        // on the page it belongs to (`BasePage.initiateWhenReady`, and a
        // `[data-orders-list]` check in `order-list.js`).
        // T-6.04: `js/order.js` is gone from this array and from the tree. It held
        // exactly two bindings — `#btn-reorder` and `#confirm-cancel` — both
        // inside `salla-modal`s this theme no longer renders, and both calling
        // their API with no order id, which a list of twenty orders cannot do.
        // T-6.03 and T-6.04 replaced them. An upstream file whose entire contents
        // have been superseded is recorded in OVERRIDES.md rather than kept as an
        // empty class. The entry keeps its name: two templates load `order.js`.
        order   : {import: [asset('js/partials/order-list.js'), asset('js/partials/order-cancel.js'), asset('js/partials/order-reorder.js'), asset('js/partials/order-tracking.js'), asset('js/partials/order-rating.js')], dependOn: 'app'},
        // T-7.01 — the stories feed page. Its own entry rather than `home.js`,
        // which drags lite-youtube, fslightbox and the video carousel onto a page
        // made entirely of photographs. It imports the hotspot and story-modal
        // partials by path, exactly as `home.js` instructed.
        stories : {import: asset('js/stories.js'), dependOn: 'app'},
        testimonials   : {import: asset('js/testimonials.js'), dependOn: 'app'}
    },
    output : {
        path: public(),
        clean: true,
        chunkFilename: "[name].[contenthash].js"
    },
    stats  : {modules: false, assetsSort: "size", assetsSpace: 50},
    module : {
        rules: [
            {
                test   : /\.js$/,
                exclude: [
                    /(node_modules)/,
                    asset('js/twilight.js')
                ],
                use    : {
                    loader : 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                          "@babel/plugin-transform-runtime"
                        ],
                    }
                }
            },
            {
                test: /\.(s(a|c)ss)$/,
                use : [
                    MiniCssExtractPlugin.loader,
                    {loader: "css-loader", options: {url: false}},
                    "postcss-loader",
                    "sass-loader",
                ]
            },
        ],
    },
    plugins: [
        new ThemeWatcher(),
        new MiniCssExtractPlugin(),
        new CopyPlugin({patterns: [{from: asset('images'), to: public('images')}]}),
        new SplitCssPlugin(),
    ],
    optimization: {
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
}
;
