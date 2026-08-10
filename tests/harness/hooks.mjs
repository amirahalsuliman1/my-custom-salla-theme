/**
 * T-1.09 — the resolve hook, and the single line it draws.
 *
 * **Third-party modules are stubbed; first-party modules are not.** A test that
 * stubs `./partials/quick-view` is not testing anything, so nothing under `src/`
 * is ever redirected — the tests import the shipped files and run the shipped
 * code. What is redirected is the handful of npm packages a page module pulls in
 * for effects a DOM test has no opinion about: a lightbox, a YouTube facade.
 *
 * `fslightbox` and `lite-youtube-embed` are IIFEs that reach for `window` at
 * evaluation time and define custom elements against whichever window is global
 * when they run. Because each test builds a fresh jsdom (see `dom.mjs` for why),
 * they would be re-evaluated against a new window on every import — registering
 * the same element repeatedly and throwing. Stubbing them is not avoidance of a
 * hard problem; it is declining to test someone else's carousel.
 *
 * Registered from `register.mjs`, which `pnpm test` passes to `node --import`.
 */
const NOOP = new URL('./stubs/noop.mjs', import.meta.url).href;

/** Bare specifiers replaced by a do-nothing module. Add with a reason, not silently. */
const STUBBED = {
  // A lightbox. `product.js` assigns it to `window.fslightbox` and the tests
  // here never open one.
  fslightbox: NOOP,
  // Defines <lite-youtube>. T-4.23 owns the facade; nothing in these tests does.
  'lite-youtube-embed': NOOP,
};

/**
 * EXTENSIONLESS RELATIVE IMPORTS. `product.js` writes `import BasePage from
 * './base-page'`, and so does most of `src/`. Webpack resolves that through
 * `resolve.extensions`; Node, correctly, does not — an ES module specifier is a
 * URL and `./base-page` names no file.
 *
 * The extension is added here rather than in the source. The tests exist to run
 * the code the theme ships, and editing twenty imports so a test runner is
 * happier would change the shipped files to suit the harness — the wrong way
 * round. What this does is reproduce the build's own resolution, so a module
 * graph that webpack can bundle is a module graph the tests can load.
 */
async function resolveAsWebpackWould(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) {
      throw error;
    }

    return next(`${specifier}.js`, context);
  }
}

export async function resolve(specifier, context, next) {
  if (Object.hasOwn(STUBBED, specifier)) {
    return { url: STUBBED[specifier], shortCircuit: true };
  }

  return resolveAsWebpackWould(specifier, context, next);
}
