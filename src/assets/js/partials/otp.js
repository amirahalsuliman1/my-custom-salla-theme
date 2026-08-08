/**
 * T-2.07 — the verification-code field's behaviour.
 *
 * Four inputs that behave like one. Everything here exists because a segmented
 * code field breaks the assumptions a single field would satisfy for free:
 * typing has to advance, backspace has to retreat, arrows have to move, and a
 * pasted code has to land in four boxes rather than one.
 *
 * WHAT IT DOES NOT DO: validate, submit, or talk to `salla.auth`. The code's
 * meaning belongs to the auth flow in Phase 5; this is the control.
 */
class Otp {
  static boot() {
    document.querySelectorAll('[data-otp]').forEach(row => new Otp(row));
  }

  constructor(row) {
    this.digits = [...row.querySelectorAll('[data-otp-digit]')];
    this.digits.forEach((input, index) => this.bind(input, index));
  }

  bind(input, index) {
    input.addEventListener('input', () => {
      // A phone keyboard can deliver more than one character to a maxlength=1
      // field, and some IMEs deliver the whole code. Treat anything longer than
      // one character as a paste rather than dropping it.
      if (input.value.length > 1) {
        return this.distribute(input.value, index);
      }

      input.value = input.value.replace(/\D/g, '');

      if (input.value) {
        this.focusAt(index + 1);
      }
    });

    input.addEventListener('keydown', event => {
      // Backspace on an EMPTY box steps back and clears the previous one. On a
      // full box it does the ordinary thing, which is why the guard is here:
      // without it, one keystroke would wipe two digits.
      if (event.key === 'Backspace' && !input.value) {
        event.preventDefault();
        this.focusAt(index - 1, true);
        return;
      }

      // The row is `dir="ltr"`, so "previous" is physically left in every
      // locale — the one place in this theme where a physical direction is the
      // correct model rather than a bug.
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.focusAt(index - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.focusAt(index + 1);
      }
    });

    input.addEventListener('paste', event => {
      event.preventDefault();
      this.distribute(event.clipboardData?.getData('text') || '', index);
    });

    // Returning to a half-filled code should land on the first empty box, not
    // wherever the pointer happened to hit.
    input.addEventListener('focus', () => input.select());
  }

  /** Spread a pasted or autofilled code across the segments from `start`. */
  distribute(text, start) {
    const code = String(text).replace(/\D/g, '').split('');

    code.forEach((character, offset) => {
      const target = this.digits[start + offset];

      if (target) {
        target.value = character;
      }
    });

    this.focusAt(Math.min(start + code.length, this.digits.length - 1));
  }

  focusAt(index, clear = false) {
    const target = this.digits[index];

    if (!target) {
      return;
    }

    if (clear) {
      target.value = '';
    }

    target.focus();
  }
}

salla.onReady(() => Otp.boot());

export default Otp;
