/**
 * Which products are in the cart, and how many — for the product card's
 * in-cart state.
 *
 * `Desktop Products Page-1.svg` draws the Canon card with «− 1 +» where the bag
 * sits, and `Favorites Page - Floating Menu.pdf` draws the same state in the
 * mobile pill: a product already in the cart is stepped, not added again.
 * Built on the owner's ruling of 2026-10-15 («أبنيها»).
 *
 * NOTHING IS RECOMPUTED HERE. The map is the cart Salla returns — its own item
 * ids and quantities — and every change goes back through `salla.cart`'s own
 * actions, which fire the cart events the rest of the theme already listens to.
 *
 * NO CART IS CREATED TO ASK. `getCurrentCartId()` would make one for a visitor
 * who has none, so the cart is read only when the SDK already holds an id
 * (`cart.id` in its storage). A visitor with an empty basket costs no request.
 */
const items = new Map();
const listeners = new Set();
let loading = null;

const notify = () => listeners.forEach(listener => listener());

/** Replace the map with the items of a cart summary, when it carries them. */
function ingest(cart) {
  if (!Array.isArray(cart?.items)) {
    return false;
  }

  items.clear();
  cart.items.forEach(item => {
    items.set(Number(item.product_id), { itemId: item.id, quantity: Number(item.quantity) || 0 });
  });
  notify();

  return true;
}

function fetchCart() {
  const cartId = salla.storage.get('cart.id');

  if (!cartId) {
    return Promise.resolve();
  }

  return salla.cart.api
    .details(cartId, [])
    .then(response => ingest(response?.data?.cart || response?.data))
    .catch(() => {});
}

/** The cart line for a product, or undefined when it is not in the cart. */
export function cartLine(productId) {
  return items.get(Number(productId));
}

/** Called whenever the map changes; returns the unsubscribe function. */
export function onCartLines(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/**
 * Step a product's quantity through Salla. Zero removes the line, as the
 * cart page's bin does at quantity one.
 */
export function stepCartLine(productId, delta) {
  const line = cartLine(productId);

  if (!line) {
    return Promise.resolve();
  }

  const quantity = line.quantity + delta;

  return quantity < 1
    ? salla.cart.deleteItem(line.itemId)
    : salla.cart.updateItem({ id: line.itemId, quantity });
}

/** Read the cart once and follow it from then on. Safe to call repeatedly. */
export function loadCartLines() {
  if (loading) {
    return loading;
  }

  // Each event carries the new cart; when one does not, read it again.
  const follow = response => {
    if (!ingest(response?.data?.cart)) {
      fetchCart();
    }
  };

  salla.cart.event.onItemAdded(follow);
  salla.cart.event.onItemUpdated(follow);
  salla.cart.event.onItemDeleted(follow);

  loading = fetchCart();

  return loading;
}
