import "lite-youtube-embed";
import BasePage from "./base-page";
import Lightbox from "fslightbox";
window.fslightbox = Lightbox;

class Home extends BasePage {
    onReady() {
        this.initFeaturedTabs();
        this.initHeroAutoplay();
        this.initCarouselIndicators();
    }

    /**
     * T-4.03 — the carousel scroll indicator.
     *
     * This READS the scroll position and never writes it. The scrolling itself is
     * `overflow-x` plus `scroll-snap` in CSS, which is what "native scroll-snap,
     * not a JS carousel library" means — remove this method and the carousel
     * still works, it simply loses a decorative read-out.
     *
     * Two CSS custom properties carry everything: how much of the row is visible,
     * and how far along it the reader is. The stylesheet turns those into a thumb
     * of the right width in the right place, so no geometry is computed here.
     *
     * `Math.abs` on `scrollLeft` is the RTL correction and is not optional: in a
     * right-to-left container browsers report the scroll offset as zero at the
     * start and increasingly NEGATIVE as it advances, so the raw value would drive
     * the thumb off the wrong end of the track.
     *
     * The list fetches its products after this runs, so the size is recomputed on
     * the platform's own `products.fetched` event rather than guessed at with a
     * timeout.
     */
    initCarouselIndicators() {
        const carousels = document.querySelectorAll('.product-carousel');

        if (!carousels.length) {
            return;
        }

        const update = carousel => {
            const track = carousel.querySelector('.s-products-list-wrapper');
            const indicator = carousel.querySelector('[data-carousel-indicator]');

            if (!track || !indicator) {
                return;
            }

            const scrollable = track.scrollWidth - track.clientWidth;

            // Nothing to scroll means nothing to report.
            indicator.hidden = scrollable <= 1;

            if (indicator.hidden) {
                return;
            }

            indicator.style.setProperty('--carousel-visible', track.clientWidth / track.scrollWidth);
            indicator.style.setProperty('--carousel-progress', Math.abs(track.scrollLeft) / scrollable);
        };

        const bind = carousel => {
            const track = carousel.querySelector('.s-products-list-wrapper');

            if (!track || track.dataset.carouselBound) {
                return;
            }

            track.dataset.carouselBound = 'true';
            track.addEventListener('scroll', () => update(carousel), { passive: true });
            update(carousel);
        };

        const refresh = () => carousels.forEach(carousel => bind(carousel));

        refresh();
        salla.event.on('salla-products-list::products.fetched', refresh);
        window.addEventListener('resize', () => carousels.forEach(update), { passive: true });
    }

    /**
     * T-4.05 — hero autoplay: stopped under reduced motion, and stoppable by hand.
     *
     * WCAG 2.2.2 is Level A: content that moves for more than five seconds needs
     * a way to pause it. Autoplay is off by default in the customiser, so most
     * stores never reach this code; when a merchant turns it on, the template
     * renders the toggle and this wires it.
     *
     * The swiper instance is read off the `.swiper` element rather than from
     * `salla-slider`. `el.swiper` is Swiper's own documented property, so this
     * survives SDK versions that reshuffle the component's internals — which is
     * what the override policy asks for. If it is ever absent the toggle hides
     * itself rather than sitting there inert.
     *
     * `prefers-reduced-motion` is read live, not once: the theme's token-layer
     * clamp cannot reach a JS timer, and a user who changes the system setting
     * mid-session should not have to reload.
     */
    initHeroAutoplay() {
        const toggle = document.querySelector('[data-hero-autoplay]');

        if (!toggle) {
            return;
        }

        const hero = toggle.closest('.hero');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const setPaused = paused => {
            const swiper = hero?.querySelector('.swiper')?.swiper;

            if (!swiper?.autoplay) {
                toggle.hidden = true;
                return;
            }

            if (paused) {
                swiper.autoplay.stop();
            } else {
                swiper.autoplay.start();
            }

            toggle.hidden = false;
            toggle.setAttribute('aria-pressed', String(paused));
            toggle.setAttribute('aria-label', salla.lang.get(paused ? 'theme.hero.play_autoplay' : 'theme.hero.pause_autoplay'));

            const icon = toggle.querySelector('i');
            icon?.classList.toggle('sicon-pause', !paused);
            icon?.classList.toggle('sicon-play', paused);
        };

        toggle.addEventListener('click', () => setPaused(toggle.getAttribute('aria-pressed') !== 'true'));
        reduceMotion.addEventListener('change', event => setPaused(event.matches));

        // The slider builds its swiper after this script runs, so wait for the
        // element rather than racing it.
        salla.lang.onLoaded(() => setTimeout(() => setPaused(reduceMotion.matches), 0));
    }

    /**
     * used in views/components/home/featured-products-style*.twig
     */
    initFeaturedTabs() {
        app.all('.tab-trigger', el => {
            el.addEventListener('click', ({ currentTarget: btn }) => {
                const id = btn.dataset.componentId;
                // btn.setAttribute('fill', 'solid');
                app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'is-active opacity-0 translate-y-3', 'inactive', tab => tab.id === btn.dataset.target)
                    .toggleClassIf(`#${id} .tab-trigger`, 'is-active', 'inactive', tabBtn => tabBtn === btn);

                // fadeIn active tabe
                setTimeout(() => app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'opacity-100 translate-y-0', 'opacity-0 translate-y-3', tab => tab.id === btn.dataset.target), 100);
            })
        });
        document.querySelectorAll('.s-block-tabs').forEach(block => block.classList.add('tabs-initialized'));
    }
}

Home.initiateWhenReady(['index']);