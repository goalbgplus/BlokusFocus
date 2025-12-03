/**
 * DEPRECATED: Prototype Block Blast Animation
 * This module has been superseded by the lightweight Spectra line-clear effects.
 * Left as a safe stub to avoid runtime/import errors if referenced.
 */
export function clearRowWithAnimation(...args) {
  console.warn('[blockBlastAnimation] Deprecated clearRowWithAnimation called with args:', args);
  // If a callback was provided as 3rd arg, call it to keep game flow intact
  const maybeCb = args[2];
  if (typeof maybeCb === 'function') {
    try { maybeCb(); } catch (_) {}
  }
}
