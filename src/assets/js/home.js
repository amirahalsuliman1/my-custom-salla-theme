import "lite-youtube-embed";
import BasePage from "./base-page";
import "./partials/hotspots";
import "./partials/hotspot-picker";
import "./partials/video-carousel";
import Lightbox from "fslightbox";
window.fslightbox = Lightbox;

class Home extends BasePage {
    onReady() {
        this.initFeaturedTabs();
        this.initAutoplayToggles();
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

        // Swiper's pagination is a decorative read-out of a position the slides
        // themselves announce. Naming it gives a screen reader nothing to act on.
        document.querySelectorAll('[data-autoplay-scope] .swiper-pagination')
            .forEach(el => el.setAttribute('aria-hidden', 'true'));

        // The sliders build their swiper after this script runs, so wait for the
        // elements rather than racing them.
        salla.lang.onLoaded(() =>
            setTimeout(() => toggles.forEach(toggle => setPaused(toggle, reduceMotion.matches)), 0));
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