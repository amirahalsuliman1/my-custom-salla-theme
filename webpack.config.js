const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ThemeWatcher = require('@salla.sa/twilight/watcher.js');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

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
        app     : [asset('styles/app.scss'), asset('js/wishlist.js'), asset('js/app.js'), asset('js/blog.js'), asset('js/partials/bottom-sheet.js'), asset('js/partials/sticky-header.js'), asset('js/partials/otp.js'), asset('js/partials/quantity.js'), asset('js/partials/toast.js'), asset('js/partials/floating-menu.js'), asset('js/partials/quick-view.js'), asset('js/partials/sort-disclosure.js'), asset('js/partials/auth.js'), asset('js/partials/loyalty-popup.js'), asset('js/partials/date-picker.js')],
        home    : asset('js/home.js'),
        'product-card' : asset('js/partials/product-card.js'),
        'main-menu' : asset('js/partials/main-menu.js'),
        'wishlist-card': asset('js/partials/wishlist-card.js'),
        'add-product-toast': asset('js/partials/add-product-toast.js'),
        'digital-files': asset('js/partials/digital-files.js'),
        // T-5.08 — its own entry rather than a line in `pages`, which is
        // loyalty.js + brands.js and serves neither of this page's needs.
        notifications: asset('js/partials/notifications.js'),
        checkout: [asset('js/cart.js'), asset('js/thankyou.js')],
        pages   : [asset('js/loyalty.js'), asset('js/brands.js'),],
        product : [asset('js/product.js'), asset('js/products.js')],
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
        order   : [asset('js/partials/order-list.js'), asset('js/partials/order-cancel.js'), asset('js/partials/order-reorder.js')],
        testimonials   : asset('js/testimonials.js')
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
    ],
    optimization: {
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
}
;
