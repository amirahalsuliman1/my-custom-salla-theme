import BasePage from "./base-page";
import "./partials/hotspots";
import "./partials/hotspot-picker";
import "./partials/video-carousel";
import "./partials/story-modal";
import "./partials/highlights";
// T-8.03 — the media libraries come from the shared media bundle, which
// pages/index.twig loads first, rather than being bundled into home.js again.
import { Fslightbox as Lightbox } from "./vendor/media";
window.fslightbox = Lightbox;

class Home extends BasePage {
    onReady() {
        this.initFeaturedTabs();
        this.initAutoplayToggles();
        this.initCarouselIndicators();
        this.initSwiperIndicators();
        this.initSegmentedIndicators();
    }

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
            indicator.dataset.carouselReady = 'true';
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
     * T-4.03's indicator under the swiper carousels — video and «تنسيقات جاهزة
     * من أملاس» (home audit, 2026-10-15).
     *
     * The same two properties as above, read from the swiper rather than from a
     * scroll position: how much of the row is in view, and how far along it the
     * reader is. The visible share is swiper's own scrollbar arithmetic — the
     * container over the slides' run, less the centring offset — so a centred
     * carousel of three reports the third-width thumb both artboards draw.
     * `swiper.progress` already runs from the inline start in RTL, and the thumb
     * is placed with `inset-inline-start`, so no direction correction is needed.
     *
     * The swiper is built by `salla-slider` after this runs, so each one is bound
     * on its `afterInit` as well as now, whichever comes first.
     */
    initSwiperIndicators() {
        const indicators = document.querySelectorAll('[data-carousel-indicator="swiper"]');

        if (!indicators.length) {
            return;
        }

        const update = (indicator, swiper) => {
            const { params, snapGrid = [] } = swiper;
            const run = swiper.virtualSize + (params.slidesOffsetBefore || 0)
                - (params.centeredSlides ? snapGrid[0] || 0 : 0);
            const visible = run > 0 ? Math.min(swiper.size / run, 1) : 1;
            const idle = visible >= 0.999 || swiper.isLocked;

            indicator.toggleAttribute('data-carousel-idle', idle);
            indicator.style.setProperty('--carousel-visible', visible);
            indicator.style.setProperty('--carousel-progress', Math.min(Math.max(swiper.progress || 0, 0), 1));
            indicator.dataset.carouselReady = 'true';
        };

        const bind = (indicator, swiper) => {
            if (!swiper || indicator.dataset.carouselBound) {
                return;
            }

            indicator.dataset.carouselBound = 'true';
            swiper.on('progress resize update breakpoint slidesLengthChange', () => update(indicator, swiper));
            update(indicator, swiper);
        };

        const sliderOf = indicator => indicator.parentElement?.querySelector('salla-slider');

        indicators.forEach(indicator => bind(indicator, sliderOf(indicator)?.querySelector('.swiper')?.swiper));

        document.addEventListener('afterInit', event => {
            const indicator = [...indicators].find(candidate => sliderOf(candidate) === event.target);

            if (indicator) {
                bind(indicator, event.detail || event.target.querySelector('.swiper')?.swiper);
            }
        });
    }

    /**
     * The segmented variant — the Home lookbook's product column from 768px
     * (`Desktop Home Page - After.svg`: two segments under the tumbler, four
     * under the lip case, the one in view dark).
     *
     * One segment per product that resolved: hotspots.js removes a pill whose
     * product no longer exists, so the count is read from the track and rebuilt
     * when it changes, never from the settings. One card is in view at a time, so
     * the card in view is the scroll progress rounded to the nearest card. The
     * `Math.abs` is T-4.03's RTL correction: an RTL track scrolls negative.
     */
    initSegmentedIndicators() {
        document.querySelectorAll('[data-carousel-indicator="segments"]').forEach(indicator => {
            const track = indicator.parentElement?.querySelector('[data-carousel-track]');

            if (!track) {
                return;
            }

            const update = () => {
                const cards = [...track.children].filter(card => !card.hidden);

                indicator.hidden = cards.length < 2;

                if (indicator.hidden) {
                    return;
                }

                if (indicator.children.length !== cards.length) {
                    indicator.replaceChildren(...cards.map(() => {
                        const segment = document.createElement('span');

                        segment.className = 'product-carousel__segment';
                        return segment;
                    }));
                }

                const scrollable = track.scrollWidth - track.clientWidth;
                const progress = scrollable > 1 ? Math.abs(track.scrollLeft) / scrollable : 0;
                const current = Math.round(progress * (cards.length - 1));

                [...indicator.children].forEach((segment, index) =>
                    segment.toggleAttribute('data-active', index === current));
            };

            track.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update, { passive: true });
            new MutationObserver(update).observe(track, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['hidden'],
            });
            update();
        });
    }

    initAutoplayToggles() {
        const toggles = document.querySelectorAll('[data-autoplay-toggle]');

        if (!toggles.length) {
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const setPaused = (toggle, paused) => {
            const scope = toggle.closest('[data-autoplay-scope]');
            const swiper = scope?.querySelector('.swiper')?.swiper;

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
            toggle.setAttribute('aria-label', salla.lang.get(paused ? 'theme.common.play_autoplay' : 'theme.common.pause_autoplay'));

            const icon = toggle.querySelector('i');
            icon?.classList.toggle('sicon-pause', !paused);
            icon?.classList.toggle('sicon-play', paused);
        };

        toggles.forEach(toggle => {
            toggle.addEventListener('click', () =>
                setPaused(toggle, toggle.getAttribute('aria-pressed') !== 'true'));
            reduceMotion.addEventListener('change', event => setPaused(toggle, event.matches));
        });

        // The sliders build their swiper after this script runs, so wait for the
        // elements rather than racing them.
        salla.lang.onLoaded(() =>
            setTimeout(() => toggles.forEach(toggle => setPaused(toggle,
                reduceMotion.matches || document.body.classList.contains('motion-off'))), 0));
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