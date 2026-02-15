/**
 * Strips ANSI escape codes from a string.
 * Covers SGR, cursor movement, erase, and other common sequences.
 * Inline implementation to avoid ESM-only strip-ansi v7+ dependency.
 */
const ANSI_REGEX =
  // eslint-disable-next-line no-control-regex
  /[\u001B\u009B][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\u0007|(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~])/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}
