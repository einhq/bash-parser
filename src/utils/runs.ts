/**
 * Where the next character `special` matches is in `text`, from `from` on, or
 * the text's length when there is none. `special` is a global regex of one
 * character class: a scanner copies everything before it in one slice rather
 * than a character at a time, which over a value of millions of characters is
 * the difference between milliseconds and seconds.
 */
export const nextSpecial = (text: string, from: number, special: RegExp): number => {
  special.lastIndex = from;
  return special.exec(text)?.index ?? text.length;
};

/** A global regex matching any one of `chars`. */
export const anyOf = (chars: string): RegExp => new RegExp(`[${chars.replace(/[\\\]^-]/g, '\\$&')}]`, 'g');
