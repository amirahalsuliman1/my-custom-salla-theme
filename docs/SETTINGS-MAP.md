# Settings map — Twig to React (R-03, 2026-11-04)

Every theme-level setting of the Twig `twilight.json`, and where it goes in the React theme (`almas-react`). Theme-wide settings were added in R-03. A setting that belongs to one component is added in that component's task, so no setting ships before something reads it. **Engine** means the React starter already declares it and the engine or a stock component reads it.

## Added in R-03 (read by `ThemeTokens`)

| Twig id | React id | Notes |
|---|---|---|
| — | `accent_color` | New (R-02). Empty: the store's primary colour. |
| `secondary_color` | `secondary_color` | → `--color-brand-secondary` |
| `color_page_background` | same | → `--surface-page` |
| `color_text_primary` | same | → `--main-text-color` |
| `color_header_background` / `color_header_text` | same | → `--surface-header` / `--text-header`; consumed from R-04 |
| `color_footer_background` / `color_footer_text` | same | → `--surface-footer` / `--text-footer`; consumed from R-04 |
| `color_icons` | same | → `--color-icon`; consumed from R-04 |
| `button_style` | same | → `--button-radius`; consumed by buttons from R-04 |
| `page_gutter` | same | → `--page-gutter`, clamped 0–48 |
| `store_background_image` | same | → `--store-bg-image`, http(s) URLs only |
| `dark_mode` | `color_mode` | Replaced: adds «حسب إعداد المتجر», the default, which follows the store's own dark flag. |
| `dark_color_page` | same | dark `--surface-page` |
| `dark_color_surface` | `dark_color_section` + `dark_color_card` | Split, so cards stay a step lighter than sections in dark mode. |
| `dark_color_text` | same | dark ink, header and footer text |
| `dark_background_image` | same | dark `--store-bg-image` |

## Dropped

| Twig id | Why |
|---|---|
| `color_button_background`, `color_button_text` | Replaced by `accent_color`; the text on the accent is chosen for contrast. |
| `logo_light` | The header no longer turns transparent over the hero (R-07), so there is no light logo to show. |

## Engine (already in the React starter)

`header_is_sticky`, `vertical_fixed_products`, `squar_photo_bg_image_size`, `footer_is_dark`, `product_show_breadcrumbs`, `product_index_show_breadcrumbs`, `enable_add_product_toast`, `notify_when_available_in_card`, `sticky_add_to_cart`, `show_tags`, `slider_background_size`, `imageZoom`.

## Added with their component

| Twig ids | Task |
|---|---|
| `logo_main`, `dark_logo`, `header_logo_height` | R-04a header (added) |
| `dark_mode_toggle` | R-04b (added) |
| `footer_logo_height` | R-04c footer (added) |

| `announcement_enabled`, `announcement_text`, `announcement_url`, `announcement_bg`, `announcement_text_color`, `announcement_sticky`, `announcement_dismissible`, `header_band_text` | R-04b (added) |
| `announcement_bottom_enabled` | R-04c footer (added) |
| `gradient_color_start`, `gradient_color_end`, `gradient_on_buttons`, `gradient_on_quantity`, `gradient_on_bars` | R-09 (added; buttons = card add, hero CTA, «تسوّق») |
| `instant_delivery_tag` | R-05 card |
| `photos_slider_title` | R-10 product and photo rows |
| `stories_page_id` | R-13 stories |
| `related_products_count`, `recently_viewed_enabled`, `recently_viewed_count`, `pdp_*` (7), `size_guide_*` (4) | R-19 product page |
| `offer_banner`, `listing_*` (7), `category_stories_enabled` | R-20 listing |
| `cart_banner_*` (3), `order_cancellation_policy_url` | R-21 cart and account |
| `whatsapp_fab_*` (5), `back_to_top_*` (2), `discount_popup_*` (7), `low_stock_threshold`, `enable_animations` | R-22 extras |
