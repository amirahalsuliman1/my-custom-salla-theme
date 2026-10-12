/**
 * Hotspot position picker — a helper for the merchant, inside the theme editor only.
 *
 * Salla's customiser has no field that reads a click on an image, and the
 * storefront runs in a frame that cannot write into the editor's fields. So a
 * point's position stays two numbers, and this closes the gap from the other
 * side: in the editor preview, clicking anywhere on a hotspot image shows the
 * two numbers for that spot and copies them, ready to paste.
 *
 * The numbers are measured the way the marker is placed — `inset-inline-start`
 * and `inset-block-start` (04-components/hotspot.scss) — so from the right on
 * an RTL page and from the left on an LTR one, and from the top. A value read
 * here and typed into the field puts the marker exactly where the click was.
 *
 * "In the editor" is "inside a frame": the editor previews the store in an
 * iframe, and a storefront is not otherwise framed. Outside a frame this file
 * does nothing, so shoppers never see it.
 */
const inEditorPreview = () => {
  try {
    return window.parent !== window;
  } catch {
    // A cross-origin parent throws on access — which is itself a frame.
    return true;
  }
};

const percent = (part, whole) => Math.min(100, Math.max(0, Math.round((part / whole) * 100)));

function readPosition(figure, event) {
  const rect = figure.getBoundingClientRect();
  // Read from the `dir` attribute, as hotspot.scss's `[dir="ltr"]` rule is.
  const isRtl = figure.closest('[dir]')?.getAttribute('dir') === 'rtl';
  const fromStart = isRtl ? rect.right - event.clientX : event.clientX - rect.left;

  return {
    x: percent(fromStart, rect.width),
    y: percent(event.clientY - rect.top, rect.height),
  };
}

function showChip(figure, { x, y }, copied) {
  figure.querySelector('.hotspot__picker-chip')?.remove();

  const chip = document.createElement('div');
  chip.className = 'hotspot__picker-chip';
  chip.setAttribute('role', 'status');
  chip.style.setProperty('--x', `${x}%`);
  chip.style.setProperty('--y', `${y}%`);
  chip.textContent = salla.lang.get(copied ? 'theme.hotspot.picker_copied' : 'theme.hotspot.picker_position', { x, y });
  figure.appendChild(chip);
}

function bind(root) {
  const figure = root.querySelector('.hotspot__figure');

  if (!figure || figure.dataset.pickerBound) {
    return;
  }

  figure.dataset.pickerBound = 'true';
  root.classList.add('hotspot--picker');

  figure.addEventListener('click', async (event) => {
    // A marker's own click opens its product; leave it alone.
    if (event.target.closest('[data-hotspot-marker]')) {
      return;
    }

    const position = readPosition(figure, event);
    let copied = false;

    try {
      await navigator.clipboard.writeText(`${position.x}, ${position.y}`);
      copied = true;
    } catch {
      // The editor's frame may not grant clipboard access; the numbers are shown either way.
    }

    showChip(figure, position, copied);
  });
}

if (inEditorPreview()) {
  salla.onReady(() =>
    salla.lang.onLoaded(() => document.querySelectorAll('[data-hotspot-root]').forEach(bind)),
  );
}

// An ES module like the other partials (hotspots.js exports its class): with no
// export, Node reads the file as CommonJS, which caches by path and would hand
// every test after the first the module the first one loaded.
export { inEditorPreview, readPosition };
