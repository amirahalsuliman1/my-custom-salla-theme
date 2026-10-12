/**
 * T-8.03 — the two heavy media libraries, in one place instead of two.
 *
 * A `--json` build on 2026-08-11 showed `fslightbox` (30.9 KB raw) and
 * `lite-youtube-embed` (10.4 KB) sitting in **both** `home.js` and
 * `product.js`. Separate webpack entries do not share modules, so a customer
 * who opened Home and then a product page downloaded both libraries twice.
 * That was 41 KB of the build's 60 KB of duplication, and the largest single
 * item in it.
 *
 * This module is the shared entry both bundles now `dependOn`. It only pulls
 * the libraries in; **it deliberately assigns nothing to `window`.** `home.js`
 * and `product.js` each still do `window.fslightbox = …` themselves, because
 * upstream markup reaches for that global and moving the assignment here would
 * change *when* it appears relative to code that expects it.
 *
 * IT IS NOT IN `app.js`, AND THAT IS THE POINT. Every page loads `app.js`. A
 * customer reading the shipping policy has no lightbox and no video; moving
 * 41 KB onto every page to save it on two is the wrong direction, and it is the
 * same reasoning that kept the stories feed out of the Home bundle in T-7.01.
 *
 * `index.twig` and `product/single.twig` load `media.js` before their own
 * bundle. Both are `defer`, which executes in document order, so the dependency
 * is satisfied by the order the tags appear in.
 */
import 'lite-youtube-embed';
import Fslightbox from 'fslightbox';

export { Fslightbox };
