<?php
/**
 * T-1.07 (extended 2026-08-10) — Twig syntax check.
 *
 * Run with `pnpm run lint:twig`. CI runs it on every push and PR.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * Nothing in this repo parsed a `.twig` file. `lint:css`, `lint:js` and
 * `lint:locales` cover SCSS, JS and the catalogues; the templates — the actual
 * deliverable of a Twilight theme — went to the platform unread. On 2026-08-10
 * a `{# … #}` comment written inside an `{% include %}` hash shipped in
 * `components/home/stories.twig`, and the only thing that noticed was Salla's
 * own **Twilight CI** app, which reported:
 *
 *     Checker output — The checker could not report `twig_result`
 *     twig_result — null
 *
 * A null and no line number. Nine commits carried that failure before anyone
 * read the check, which is the failure mode a permanently-red check produces:
 * it stops being read. This script makes the same class of error fail here,
 * with a filename and a line, before it can be pushed.
 *
 * ── What it does, and what it deliberately does not ───────────────────────
 *
 * It **lexes** every template with the real `twig/twig` lexer — the same
 * library the platform runs — and reports any file the lexer rejects. It does
 * **not** run a full parse, and that is a limit rather than an oversight.
 *
 * A full parse resolves tags, and this theme uses two Salla tags that are not
 * in Twig's grammar: `{% hook %}` (58 uses) and `{% component %}` (6). Neither
 * has an end tag anywhere in `src/views`, so both are standalone — but writing
 * `TokenParser`s for them means inventing an argument grammar Salla has not
 * published, and a checker that rejects valid templates is worse than no
 * checker: it becomes noise, and noise is exactly what this file is here to
 * end. Lexing needs no grammar, so it invents nothing.
 *
 * Caught: unclosed `{%`/`{{`/`{#`, a comment inside a tag or an expression,
 * stray delimiters, unterminated strings, bad number and operator forms — the
 * structural errors that make a parser return null.
 *
 * Not caught: mismatched nesting that is individually well-formed
 * (`{% for %}…{% endif %}`), unknown filters and functions, undefined
 * variables. Those need a parse or a render, and a rendered storefront is
 * T-8.06/T-8.09 territory, not a runner's.
 */

$vendor = __DIR__ . '/twig-lint/vendor/autoload.php';
if (!is_file($vendor)) {
    fwrite(STDERR, "twig/twig is not installed.\n  composer install --working-dir=scripts/twig-lint\n");
    exit(2);
}
require $vendor;

use Twig\Environment;
use Twig\Error\SyntaxError;
use Twig\Lexer;
use Twig\Loader\ArrayLoader;
use Twig\Source;

$root = dirname(__DIR__) . '/src/views';
if (!is_dir($root)) {
    fwrite(STDERR, "No such directory: {$root}\n");
    exit(2);
}

$files = [];
$tree = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
);
foreach ($tree as $entry) {
    if ($entry->isFile() && $entry->getExtension() === 'twig') {
        $files[] = $entry->getPathname();
    }
}
sort($files);

if (!$files) {
    fwrite(STDERR, "No .twig files found under {$root} — check the path.\n");
    exit(2);
}

$lexer = new Lexer(new Environment(new ArrayLoader([])));
$failures = 0;
$cwd = dirname(__DIR__) . '/';

foreach ($files as $path) {
    $shown = str_starts_with($path, $cwd) ? substr($path, strlen($cwd)) : $path;
    $source = file_get_contents($path);

    try {
        $lexer->tokenize(new Source($source, $shown));
    } catch (SyntaxError $e) {
        $failures++;
        $line = $e->getTemplateLine();
        fwrite(STDERR, sprintf("%s:%d  %s\n", $shown, $line, $e->getRawMessage()));

        // The lexer reports where it gave up, which is rarely where the mistake
        // was typed. Printing the line makes the difference obvious.
        $lines = explode("\n", $source);
        if ($line > 0 && isset($lines[$line - 1])) {
            fwrite(STDERR, sprintf("    %d | %s\n", $line, rtrim($lines[$line - 1])));
        }
    }
}

if ($failures > 0) {
    fwrite(STDERR, sprintf("\n%d of %d template(s) failed to lex.\n", $failures, count($files)));
    exit(1);
}

printf("%d templates lexed, no syntax errors.\n", count($files));
exit(0);
