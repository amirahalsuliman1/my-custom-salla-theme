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
        app     : [asset('styles/app.scss'), asset('js/wishlist.js'), asset('js/app.js'), asset('js/blog.js'), asset('js/partials/bottom-sheet.js'), asset('js/partials/sticky-header.js'), asset('js/partials/otp.js'), asset('js/partials/quantity.js'), asset('js/partials/toast.js'), asset('js/partials/floating-menu.js'), asset('js/partials/quick-view.js'), asset('js/partials/sort-disclosure.js'), asset('js/partials/auth.js')],
        home    : asset('js/home.js'),
        'product-card' : asset('js/partials/product-card.js'),
        'main-menu' : asset('js/partials/main-menu.js'),
        'wishlist-card': asset('js/partials/wishlist-card.js'),
        'add-product-toast': asset('js/partials/add-product-toast.js'),
        'digital-files': asset('js/partials/digital-files.js'),
        checkout: [asset('js/cart.js'), asset('js/thankyou.js')],
        pages   : [asset('js/loyalty.js'), asset('js/brands.js'),],
        product : [asset('js/product.js'), asset('js/products.js')],
        order   : asset('js/order.js'),
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
