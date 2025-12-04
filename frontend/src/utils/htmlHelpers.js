export const VOID_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

export const findClosingTagIndex = (str, startIndex, tagName) => {
  if (VOID_TAGS.includes(tagName.toLowerCase())) return startIndex;
  
  let depth = 0;
  const tagRegex = new RegExp(`<(\/?)(${tagName})(\\s|>)`, 'ig');
  tagRegex.lastIndex = startIndex;
  
  let match;
  while ((match = tagRegex.exec(str)) !== null) {
      const isClosing = match[1] === '/';
      if (!isClosing) {
          depth++;
      } else {
          if (depth === 0) {
              const closingTagStart = match.index;
              const closingTagEnd = str.indexOf('>', closingTagStart);
              return closingTagEnd !== -1 ? closingTagEnd + 1 : str.length;
          }
          depth--;
      }
  }
  return -1;
};