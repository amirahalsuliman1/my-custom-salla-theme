/**
 * T-7.01 — the stories feed's two controls.
 *
 * `Customer Stories – Pinterest Style.pdf` draws a row of category chips —
 * «الكل», «هدايا», «عروض», «إكسسوارات», «ميكاب», «صور» — over a full-width brand
 * dropdown reading «Rhode», above the masonry grid. Neither is on either Home
 * artboard, which is why T-7.06 did not improvise them onto its section and why
 * they arrive here.
 *
 * **THE OPTIONS ARE READ OFF THE RENDERED CARDS, BECAUSE NOTHING ELSE KNOWS
 * THEM.** The stories are a collection on the `home.stories` component, bound
 * only while that component renders — a page template cannot reach it. What the
 * page *can* see is what the component produced: every card carries its brand and
 * its tags in `story-tags.twig`'s markup. So the chips are the distinct tags of
 * the stories actually on the page, in the order they first appear, and the brand
 * list is the distinct brands. **A merchant who adds a tag gets a chip for it
 * with no code change**, which is what the customiser-managed design costs and
 * buys.
 *
 * THE BRAND CONTROL IS T-4.17'S DISCLOSURE, NOT A SECOND ONE. `sort-disclosure.js`
 * already owns open/close, the pressed state, the URL parameter and the closing
 * behaviour; it learned `data-sort-param` in T-6.01 so a second page could use
 * its own key. This builds that markup and listens for the event it emits — the
 * fourth consumer of one implementation.
 *
 * FILTERING IS AND (CATEGORY) × (BRAND), which is the only reading that makes two
 * controls worth having. «الكل» and the brand list's own first entry each mean
 * «do not narrow on this axis».
 */
class StoriesFilter {
  static get ALL() {
    return '__all__';
  }

  static boot() {
    const mount = document.querySelector('[data-stories-controls]');
    const grid = document.querySelector('.stories__grid');

    if (!mount || !grid) {
      return;
    }

    const cards = [...grid.querySelectorAll('.story-card')];
    const facets = StoriesFilter.read(cards);

    // One axis with nothing to choose between is not a control. A feed where
    // every story is «ميكاب» gets no chip row rather than a row of one.
    if (facets.tags.length < 2 && facets.brands.length < 2) {
      return;
    }

    mount.appendChild(StoriesFilter.build(facets));

    StoriesFilter.state = { tag: StoriesFilter.ALL, brand: StoriesFilter.ALL };
    StoriesFilter.cards = cards;

    document.addEventListener('click', event => {
      const chip = event.target.closest?.('[data-stories-tag]');

      if (chip) {
        StoriesFilter.state.tag = chip.getAttribute('data-stories-tag');
        StoriesFilter.press(chip);
        StoriesFilter.apply();
      }
    });

    document.addEventListener('sort-disclosure::applied', event => {
      if (event.detail?.param === 'brand') {
        StoriesFilter.state.brand = event.detail.value;
        StoriesFilter.apply();
      }
    });

    StoriesFilter.apply();
  }

  /**
   * The distinct brands and tags, in first-appearance order. The brand is the
   * first chip in `story-tags.twig` and is wrapped in `<bdi>`, which is exactly
   * what distinguishes it from a category — so the markup's own bidi decision
   * doubles as the discriminator, and no second attribute was added to carry it.
   */
  static read(cards) {
    const tags = [];
    const brands = [];

    cards.forEach(card => {
      card.querySelectorAll('.story-card__tag').forEach(tag => {
        const value = tag.textContent.trim();

        if (!value) {
          return;
        }

        const list = tag.querySelector('bdi') ? brands : tags;

        if (!list.includes(value)) {
          list.push(value);
        }
      });
    });

    return { tags, brands };
  }

  static build({ tags, brands }) {
    const fragment = document.createDocumentFragment();

    if (tags.length > 1) {
      const nav = document.createElement('div');

      nav.className = 'stories-filter';
      nav.setAttribute('role', 'group');
      nav.setAttribute('aria-label', salla.lang.get('theme.stories.filter_label'));

      [{ value: StoriesFilter.ALL, label: salla.lang.get('theme.stories.filter_all') }]
        .concat(tags.map(tag => ({ value: tag, label: tag })))
        .forEach(({ value, label }, index) => {
          const chip = document.createElement('button');

          chip.type = 'button';
          chip.className = 'stories-filter__chip';
          chip.setAttribute('data-stories-tag', value);
          // `aria-pressed` rather than a class: the state has to be readable by
          // something other than the eye, and the stylesheet keys off the same
          // attribute so the two cannot drift.
          chip.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
          chip.textContent = label;
          nav.appendChild(chip);
        });

      fragment.appendChild(nav);
    }

    if (brands.length > 1) {
      fragment.appendChild(StoriesFilter.disclosure(brands));
    }

    /**
     * The count, announced. A filter that silently removes two thirds of a grid
     * tells a sighted user what happened through the layout and tells everyone
     * else nothing at all.
     */
    const status = document.createElement('p');

    status.className = 'stories-filter__count';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('data-stories-count', '');
    fragment.appendChild(status);

    return fragment;
  }

  /** T-4.17's markup, built rather than transcribed into a template. */
  static disclosure(brands) {
    const details = document.createElement('details');

    details.className = 'sort-disclosure stories-filter__brands';
    details.setAttribute('data-sort-disclosure', '');
    details.setAttribute('data-sort-param', 'brand');

    const summary = document.createElement('summary');

    summary.className = 'sort-disclosure__summary';
    summary.innerHTML =
      `<span class="sr-only"></span><span class="sort-disclosure__current" data-sort-current></span>` +
      `<i class="sicon-keyboard_arrow_down" aria-hidden="true"></i>`;
    summary.querySelector('.sr-only').textContent = salla.lang.get('theme.stories.brand_label');
    summary.querySelector('[data-sort-current]').textContent = salla.lang.get('theme.stories.brand_all');
    details.appendChild(summary);

    const list = document.createElement('ul');

    list.className = 'sort-disclosure__list';

    [{ value: StoriesFilter.ALL, label: salla.lang.get('theme.stories.brand_all') }]
      .concat(brands.map(brand => ({ value: brand, label: brand })))
      .forEach(({ value, label }, index) => {
        const item = document.createElement('li');
        const option = document.createElement('button');

        option.type = 'button';
        option.className = 'sort-disclosure__option';
        option.setAttribute('data-sort-option', value);
        option.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        option.innerHTML = `<span></span><i class="sicon-check sort-disclosure__check" aria-hidden="true"></i>`;
        option.querySelector('span').textContent = label;
        item.appendChild(option);
        list.appendChild(item);
      });

    details.appendChild(list);
    return details;
  }

  /** Exactly one chip is pressed, which is what makes the state a state. */
  static press(pressed) {
    pressed.parentElement
      ?.querySelectorAll('[data-stories-tag]')
      .forEach(chip => chip.setAttribute('aria-pressed', chip === pressed ? 'true' : 'false'));
  }

  static apply() {
    const { tag, brand } = StoriesFilter.state;
    let shown = 0;

    StoriesFilter.cards.forEach(card => {
      const values = [...card.querySelectorAll('.story-card__tag')];
      const matchesTag =
        tag === StoriesFilter.ALL ||
        values.some(el => !el.querySelector('bdi') && el.textContent.trim() === tag);
      const matchesBrand =
        brand === StoriesFilter.ALL ||
        values.some(el => el.querySelector('bdi') && el.textContent.trim() === brand);

      card.hidden = !(matchesTag && matchesBrand);
      shown += card.hidden ? 0 : 1;
    });

    const count = document.querySelector('[data-stories-count]');

    if (count) {
      count.textContent = salla.lang.get('theme.stories.count', { count: shown });
    }
  }
}

StoriesFilter.state = { tag: StoriesFilter.ALL, brand: StoriesFilter.ALL };
StoriesFilter.cards = [];

salla.onReady(() => StoriesFilter.boot());

export default StoriesFilter;
