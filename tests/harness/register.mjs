/**
 * T-1.09 — installs the resolve hook before any test module is loaded.
 *
 * `node --import` runs this in the main thread ahead of the entry point, which
 * is the only point early enough: `module.register` cannot affect a graph that
 * has already been resolved.
 */
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
