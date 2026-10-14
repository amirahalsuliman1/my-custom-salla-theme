/**
 * Two demo-store findings from 2026-10-14.
 *
 * - Home's overlay header is `absolute` at top 0. Without a positioned
 *   `.app-inner` it anchored to the page and sat on top of the bars the
 *   platform mounts before it (`salla-maintenance-alert`).
 * - A hotspot pill ships `hidden` until its product loads, and `.hotspot__pill`
 *   sets `display: flex`, which outranks the user-agent `[hidden]` rule.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const HOTSPOT = fs.readFileSync('src/assets/styles/04-components/hotspot.scss', 'utf8')

test('app-inner is the overlay header\'s containing block', () => {
  assert.match(MASTER, /<div class="app-inner[^"]*\brelative\b/)
})

test('an unfilled hotspot pill stays hidden', () => {
  assert.match(HOTSPOT, /\.hotspot__pill\[hidden\]\s*\{\s*display:\s*none;/)
})
