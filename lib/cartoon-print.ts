export const PRINT_SIZES = [
  { id: "fine", label: "Fine-detail print", width: 3.4, height: 5.1 },
  { id: "classic", label: "Classic print", width: 4, height: 6 },
  { id: "medium", label: "Medium print", width: 5, height: 7.5 },
  { id: "large", label: "Large review print", width: 6, height: 9 },
] as const;
export const PRINT_PAPERS = [
  { id: "letter", label: "US Letter", width: 8.5, height: 11 },
  { id: "a4", label: "A4", width: 210 / 25.4, height: 297 / 25.4 },
] as const;
export type PrintSizeId = (typeof PRINT_SIZES)[number]["id"];
export type PrintPaperId = (typeof PRINT_PAPERS)[number]["id"];
export function printMetrics(pixelWidth: number, pixelHeight: number, sizeId: PrintSizeId, paperId: PrintPaperId) {
  const size = PRINT_SIZES.find(s => s.id === sizeId);
  const paper = PRINT_PAPERS.find(p => p.id === paperId);
  if (!size || !paper || !Number.isFinite(pixelWidth) || !Number.isFinite(pixelHeight) || pixelWidth <= 0 || pixelHeight <= 0) throw new Error("Invalid print configuration");
  const scale = Math.min(size.width / pixelWidth, size.height / pixelHeight);
  const width = pixelWidth * scale, height = pixelHeight * scale;
  if (width > paper.width - 1 || height > paper.height - 1) throw new Error("Artwork exceeds the safe print area");
  return { size, paper, width, height, ppi: Math.round(1 / scale) };
}
