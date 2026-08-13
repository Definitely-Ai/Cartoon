// Plate numerals: editions rendered as roman numerals ("Pl. VI"), the folio
// voice of a collected volume. Editions arrive validated as positive
// integers from the data layer.

const NUMERALS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function plateNumeral(edition: number): string {
  let n = Math.max(1, Math.floor(edition));
  let out = "";
  for (const [value, glyph] of NUMERALS) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return out;
}
