/**
 * T-7.01 — the bundle the stories feed page loads.
 *
 * `home.js` says why this file exists rather than a second copy of anything:
 * «When T-7.07 needs hotspots on a page this bundle does not cover, it imports
 * THIS module — it does not write a second one», and «T-7.01 must import it from
 * whichever bundle serves the stories page rather than copying it». This is that
 * bundle, and it imports the two modules by path.
 *
 * IT IS NOT `home.js`. That bundle pulls `lite-youtube-embed`, `fslightbox` and
 * the video carousel — three dependencies a page of photographs has no use for,
 * on a page whose whole content is images. Loading it here would have been the
 * cheaper line of code and the more expensive page.
 */
import './partials/hotspots';
import './partials/story-modal';
import './partials/stories-filter';
