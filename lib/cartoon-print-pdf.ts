import { printMetrics, type PrintSizeId, type PrintPaperId } from "./cartoon-print";

export async function cartoonPrintPDF(bytes: Uint8Array, title: string, pixelWidth: number, pixelHeight: number, size: PrintSizeId, paper: PrintPaperId) {
  const { PDFDocument, PrintScaling } = await import("pdf-lib");
  const metrics = printMetrics(pixelWidth, pixelHeight, size, paper);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`The Swinging Door - ${title}`);
  pdf.setAuthor("AI Dream Builders LLC");
  pdf.setSubject(`${metrics.width} x ${metrics.height} inches; ${metrics.ppi} effective PPI; native ${pixelWidth} x ${pixelHeight} pixels. No resampling.`);
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const page = pdf.addPage([metrics.paper.width * 72, metrics.paper.height * 72]);
  const image = await pdf.embedPng(bytes);
  if (image.width !== pixelWidth || image.height !== pixelHeight) throw new Error("The source image dimensions changed");
  page.drawImage(image, { x: (metrics.paper.width - metrics.width) * 36, y: (metrics.paper.height - metrics.height) * 36, width: metrics.width * 72, height: metrics.height * 72 });
  return pdf.save();
}
