/**
 * T-3.11 — the social pill that rendered the word "undefined".
 *
 * `salla-social` builds each link by string substitution:
 *
 *     socialSlot.replace(/\{icon\}/g, this.iconsList[link.type])
 *
 * `iconsList` holds six entries — instagram, twitter, facebook, youtube,
 * snapchat, tiktok — while `getLinksArray()` returns **every** key in
 * `store.social` except `whatsapp`. `store.social` also carries `pinterest` and
 * `maroof`, and for those `iconsList[type]` is `undefined`, which `String
 * .replace` writes into the markup as the six characters `undefined`. Any store
 * that fills in a Maroof link gets that word sitting in a footer pill.
 *
 * WHY THE FIX IS HERE AND NOT IN THE SLOT TEMPLATE. The substitution happens
 * inside the component, before the theme's markup is ever live, so a
 * `social-item` slot that uses `{icon}` inherits the same string. The slot
 * supplies the shape; only script can see which pills actually received an SVG.
 *
 * WHY A NAME AND NOT A BUNDLED LOGO. B9 forbids shipping a third-party trust
 * mark as a theme image, and Maroof is one. The `sicon-*` font might carry a
 * glyph for either network, but it is served from Salla's CDN and could not be
 * read from this environment — so building on `sicon-maroof` would be an
 * assumption, which CLAUDE.md forbids outright. A translated name is provably
 * correct without either.
 *
 * DETECTION IS STRUCTURAL, NOT TEXTUAL. The test is "did this pill receive an
 * `<svg>`", never "does it say `undefined`". A future SDK that adds a Pinterest
 * icon fixes itself here with no code change, and one that changes the failure
 * string does not break this.
 */

/** Networks whose name the catalogue knows; anything else falls back to its slug. */
function labelFor(network) {
  const key = `theme.social.${network}`;
  const translated = salla.lang.get(key);

  // lang.js returns the key itself when a catalogue has no entry for it.
  return !translated || translated === key ? network : translated;
}

export default function initSocialLinks() {
  const root = document.querySelector('salla-social');
  if (!root) return;

  const repair = () => {
    root.querySelectorAll('.s-social-icon').forEach((icon) => {
      if (icon.querySelector('svg')) return;

      const link = icon.closest('a');
      const network = link?.getAttribute('title') || link?.getAttribute('aria-label') || '';
      if (!network) return;

      const name = labelFor(network);

      icon.textContent = name;
      icon.classList.add('s-social-icon--text');
      link.setAttribute('aria-label', name);
      link.setAttribute('title', name);
    });
  };

  repair();

  // The component re-renders when `salla.lang` finishes loading, which replaces
  // these nodes. Observing the subtree is what survives that second pass.
  new MutationObserver(repair).observe(root, { childList: true, subtree: true });
}
