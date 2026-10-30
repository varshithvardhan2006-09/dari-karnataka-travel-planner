/**
 * Turns the printable itinerary into a real A4 PDF file and downloads it.
 *
 * window.print() is ignored by many phone browsers (including the in-app
 * browsers of WhatsApp and Instagram), so the PDF button builds the file here
 * instead. Each element marked data-pdf-block is captured as an image and
 * placed on the page whole, so a stop card is never split across two pages.
 * The libraries are loaded only when the button is used.
 */

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points
const MARGIN = 28;
const GAP = 6;

export async function exportItineraryPdf(root: HTMLElement, filename: string): Promise<void> {
  const [{ jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")]);

  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const contentW = PAGE_W - MARGIN * 2;
  const maxH = PAGE_H - MARGIN * 2;
  const scale = contentW / root.offsetWidth;
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"));

  let y = MARGIN;
  for (const block of blocks) {
    // Margins are dropped on the captured copy: html-to-image keeps them inside
    // the frame, which pushes content down and cuts off the bottom of the block.
    // No backgroundColor option: it would replace the block's own background
    // (the dark day banners turned white). Transparent areas are backed with
    // white below instead, since JPEG has no transparency.
    const captured = await toCanvas(block, { pixelRatio: 2, style: { margin: "0" } });
    const canvas = document.createElement("canvas");
    canvas.width = captured.width;
    canvas.height = captured.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(captured, 0, 0);
    let w = contentW;
    let h = block.offsetHeight * scale;
    // A block taller than a page is shrunk to fit rather than cut.
    if (h > maxH) {
      w = (w * maxH) / h;
      h = maxH;
    }
    if (y + h > PAGE_H - MARGIN && y > MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN, y, w, h);
    y += h + GAP;
  }

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser time to start the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
