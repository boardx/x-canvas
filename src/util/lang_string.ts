/**
 * Capitalizes a string
 * @param {String} string String to capitalize
 * @param {Boolean} [firstLetterOnly] If true only first letter is capitalized
 * and other letters stay untouched, if false first letter is capitalized
 * and other letters are converted to lowercase.
 * @return {String} Capitalized version of a string
 */
export const capitalize = (string: string, firstLetterOnly = false): string =>
  `${string.charAt(0).toUpperCase()}${firstLetterOnly ? string.slice(1) : string.slice(1).toLowerCase()
  }`;

/**
 * Escapes XML in a string
 * @param {String} string String to escape
 * @return {String} Escaped version of a string
 */
export const escapeXml = (string: string): string =>
  string
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Divide a string in the user perceived single units
 * @param {String} textstring String to escape
 * @return {Array} array containing the graphemes
 */
export const graphemeSplit = (textstring: string): string[] => {
  const graphemes = [];
  const words = textstring.split(/\b/);
  for (let i = 0; i < words.length; i++) {
    // 检查单词是否全为拉丁字母，长度不大于13，且没有四个或更多的连续相同的字母
    if (/^[a-zA-Z]+$/.test(words[i]) && words[i].length <= 13 && !(/(\w)\1{3,}/.test(words[i]))) {
      graphemes.push(words[i]);
    } else {
      for (let j = 0; j < words[i].length; j++) {
        graphemes.push(words[i][j]);
      }
    }
  }
  return graphemes;
};

// taken from mdn in the charAt doc page.
const getWholeChar = (str: string, i: number): string | boolean => {
  const code = str.charCodeAt(i);
  if (isNaN(code)) {
    return ''; // Position not found
  }
  if (code < 0xd800 || code > 0xdfff) {
    return str.charAt(i);
  }

  // High surrogate (could change last hex to 0xDB7F to treat high private
  // surrogates as single characters)
  if (0xd800 <= code && code <= 0xdbff) {
    if (str.length <= i + 1) {
      throw 'High surrogate without following low surrogate';
    }
    const next = str.charCodeAt(i + 1);
    if (0xdc00 > next || next > 0xdfff) {
      throw 'High surrogate without following low surrogate';
    }
    return str.charAt(i) + str.charAt(i + 1);
  }
  // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
  if (i === 0) {
    throw 'Low surrogate without preceding high surrogate';
  }
  const prev = str.charCodeAt(i - 1);

  // (could change last hex to 0xDB7F to treat high private
  // surrogates as single characters)
  if (0xd800 > prev || prev > 0xdbff) {
    throw 'Low surrogate without preceding high surrogate';
  }
  // We can pass over low surrogates now as the second component
  // in a pair which we have already processed
  return false;
};
