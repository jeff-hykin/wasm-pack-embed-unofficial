let output = `// https://esm.sh/gh/jeff-hykin/good-js@f5e1ea7/denonext/source/flattened/convert_base64_string_to_uint8_array.development.mjs
var _base64NumericCodes = [
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  255,
  62,
  255,
  255,
  255,
  63,
  52,
  53,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  255,
  255,
  255,
  0,
  255,
  255,
  255,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  255,
  255,
  255,
  255,
  255,
  255,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51
];
function _getBase64Code(charCode) {
  if (charCode >= _base64NumericCodes.length) {
    throw new Error("Unable to parse base64 string.");
  }
  const code = _base64NumericCodes[charCode];
  if (code === 255) {
    throw new Error("Unable to parse base64 string.");
  }
  return code;
}
var convertBase64StringToUint8Array = Uint8Array.fromBase64 || function(str) {
  if (str.length % 4 !== 0) {
    throw new Error("Unable to parse base64 string.");
  }
  const index = str.indexOf("=");
  if (index !== -1 && index < str.length - 2) {
    throw new Error("Unable to parse base64 string.");
  }
  let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0, n = str.length, result = new Uint8Array(3 * (n / 4)), buffer;
  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
    buffer = _getBase64Code(str.charCodeAt(i)) << 18 | _getBase64Code(str.charCodeAt(i + 1)) << 12 | _getBase64Code(str.charCodeAt(i + 2)) << 6 | _getBase64Code(str.charCodeAt(i + 3));
    result[j] = buffer >> 16;
    result[j + 1] = buffer >> 8 & 255;
    result[j + 2] = buffer & 255;
  }
  return result.subarray(0, result.length - missingOctets);
};
export {
  convertBase64StringToUint8Array
};
`
export default output