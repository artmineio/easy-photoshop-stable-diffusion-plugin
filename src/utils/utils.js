/**
 * Helper used for boolean attributes, e.g. `selected={trueOrUndefined(isSelected)}`
 * Falsy value should be `undefined` so that React knows not to emit the attribute. See Adobe documentation:
 * https://developer.adobe.com/xd/uxp/uxp/reference-spectrum/overview/using%20with%20react/#boolean-attributes
 */
export const trueOrUndefined = (value) => value ? true : undefined;

export const getRandomRequestId = () => Math.random().toString(36).slice(-10)

export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
