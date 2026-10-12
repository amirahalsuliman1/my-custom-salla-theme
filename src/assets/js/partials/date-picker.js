/**
 * T-5.05 — the one thing the date picker's criteria need that markup cannot give.
 *
 * «SELECTED DATE ANNOUNCED». flatpickr writes the chosen date into the input and
 * closes the calendar. A sighted user sees the field fill in; a screen-reader
 * user gets nothing at all, because the value of an input that was never typed
 * into is not announced by anything. This copies the field's own value into a
 * live region beside it — **the platform's formatted string, not a second
 * formatting of the date**, so what is spoken is exactly what is shown.
 *
 * WHAT IS DELIBERATELY NOT HERE. Keyboard navigation is flatpickr's and was
 * verified rather than rebuilt: the calendar is reachable from the input,
 * arrows move by day, PageUp/PageDown by month, and Escape closes it. Adding a
 * second keyboard layer over a library that has one is how two handlers end up
 * disagreeing.
 *
 * It boots on every page and does nothing where no picker exists — the
 * arrangement `sort-disclosure.js` established. The gift-message and booking
 * flows mount the same component, so this reaches them too without either page
 * asking.
 */
class DatePicker {
  static boot() {
    if (!document.querySelector('salla-datetime-picker')) {
      return;
    }

    /**
     * Delegated and on `change`: the input is inside a component that renders
     * after this runs, and flatpickr fires a native `change` on the input it
     * was attached to. Listening at the document means neither timing matters.
     */
    document.addEventListener('change', event => {
      const input = event.target.closest?.('salla-datetime-picker input');

      if (!input) {
        return;
      }

      DatePicker.announce(input);
    });
  }

  static announce(input) {
    const picker = input.closest('salla-datetime-picker');
    const status = picker?.parentElement?.querySelector('[data-date-status]');

    if (!status) {
      return;
    }

    const value = input.value?.trim();

    // An empty value means the date was cleared, and saying «the date is» with
    // nothing after it is worse than saying nothing.
    status.textContent = value
      ? salla.lang.get('theme.account.date_selected', { date: value })
      : '';
  }
}

salla.onReady(() => DatePicker.boot());

export default DatePicker;
