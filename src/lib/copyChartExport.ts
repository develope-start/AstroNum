function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type ExportImage = {
  label: string;
  dataUrl: string;
  width: number;
  height: number;
};

function svgMarkup(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  return new XMLSerializer().serializeToString(clone);
}

function imageFromSvg(markup: string, width: number, height: number) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SVG export failed"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

async function markupToPng(markup: string, label: string, width: number, height: number): Promise<ExportImage> {
  const image = await imageFromSvg(markup, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.fillStyle = "#080418";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return { label, dataUrl: canvas.toDataURL("image/png"), width, height };
}

async function svgToPng(svg: SVGSVGElement, label: string, width = 1200, height = 1200): Promise<ExportImage> {
  return markupToPng(svgMarkup(svg), label, width, height);
}

function elementBalanceSvg(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-export-element]"));
  if (!items.length) return null;
  const width = 1200;
  const rowHeight = 92;
  const height = 104 + items.length * rowHeight;
  const rows = items.map((item, index) => {
    const label = item.dataset.exportElementLabel ?? item.textContent?.trim() ?? "";
    const value = Number(item.dataset.exportElementValue ?? 0);
    const y = 76 + index * rowHeight;
    return `
      <text x="54" y="${y}" fill="#f8fafc" font-size="30" font-weight="700">${escapeHtml(label)}</text>
      <text x="1146" y="${y}" fill="#fcd34d" font-size="30" font-weight="800" text-anchor="end">${value}%</text>
      <rect x="54" y="${y + 17}" width="1092" height="18" rx="9" fill="#1e293b" />
      <rect x="54" y="${y + 17}" width="${Math.max(0, Math.min(100, value)) * 10.92}" height="18" rx="9" fill="#a78bfa" />`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="28" fill="#0f0a24" />
    <text x="54" y="50" fill="#fcd34d" font-size="34" font-weight="800">სტიქიების პროცენტული სინთეზი &amp; ცის ღერძები</text>
    ${rows}
  </svg>`;
}

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const words = value.split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && context.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

async function tableToPng(table: HTMLTableElement, index: number): Promise<ExportImage> {
  const rows = Array.from(table.rows).map((row) => Array.from(row.cells).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? ""));
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const width = Math.min(1800, Math.max(720, columnCount * 220));
  const columnWidth = width / columnCount;
  const lineHeight = 24;
  const horizontalPadding = 18;
  const contextCanvas = document.createElement("canvas");
  const measure = contextCanvas.getContext("2d");
  if (!measure) throw new Error("Canvas is not available");
  measure.font = "16px Arial, sans-serif";
  const preparedRows = rows.map((row) => row.map((cell) => wrapText(measure, cell, columnWidth - horizontalPadding * 2)));
  const rowHeights = preparedRows.map((row) => Math.max(42, Math.max(...row.map((cell) => cell.length), 1) * lineHeight + 18));
  const height = Math.min(12000, rowHeights.reduce((sum, value) => sum + value, 0) + 24);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  let y = 12;
  preparedRows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex] ?? 42;
    context.fillStyle = rowIndex === 0 ? "#e7e9f1" : rowIndex % 2 ? "#ffffff" : "#f5f6fa";
    context.fillRect(0, y, width, rowHeight);
    context.strokeStyle = "#cbd5e1";
    context.strokeRect(0, y, width, rowHeight);
    row.forEach((cell, columnIndex) => {
      const x = columnIndex * columnWidth;
      context.strokeRect(x, y, columnWidth, rowHeight);
      context.fillStyle = rowIndex === 0 ? "#172033" : "#273449";
      context.font = rowIndex === 0 ? "700 15px Arial, sans-serif" : "15px Arial, sans-serif";
      cell.forEach((line, lineIndex) => context.fillText(line, x + horizontalPadding, y + 27 + lineIndex * lineHeight));
    });
    y += rowHeight;
  });
  return { label: `ცხრილი ${index + 1}`, dataUrl: canvas.toDataURL("image/png"), width, height };
}

function appendBlockBreaks(element: HTMLElement) {
  const blockTags = "DIV,P,H1,H2,H3,H4,H5,H6,LI,TR,DETAILS,SUMMARY";
  element.querySelectorAll(blockTags).forEach((node) => node.appendChild(document.createTextNode("\n")));
}

function plainTextFromClone(clone: HTMLElement) {
  appendBlockBreaks(clone);
  return (clone.textContent ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function prepareHtmlClone(root: HTMLElement, images: ExportImage[]) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-copy-exclude], .chart-view-actions, .interpretation-close-button, .combined-chart-table-launch, script, style").forEach((node) => node.remove());
  clone.querySelectorAll("details").forEach((details) => details.setAttribute("open", ""));
  clone.querySelectorAll("button").forEach((button) => {
    const text = button.textContent?.trim() ?? "";
    const replacement = document.createElement("span");
    replacement.textContent = text;
    button.replaceWith(replacement);
  });

  const wheelImage = images.find((image) => image.label === "ზოდიაქალური წრე");
  const wheelSvg = clone.querySelector(".chart-wheel-wrap svg");
  if (wheelImage && wheelSvg) {
    const image = document.createElement("img");
    image.src = wheelImage.dataUrl;
    image.alt = wheelImage.label;
    image.style.cssText = "display:block;width:100%;max-width:720px;height:auto;margin:18px auto;border-radius:16px;";
    wheelSvg.replaceWith(image);
  }

  const elementImage = images.find((image) => image.label === "სტიქიების პროცენტული სინთეზი");
  const elementBlock = clone.querySelector("[data-export-element-balance]");
  if (elementImage && elementBlock) {
    const image = document.createElement("img");
    image.src = elementImage.dataUrl;
    image.alt = elementImage.label;
    image.style.cssText = "display:block;width:100%;max-width:900px;height:auto;margin:18px auto;border-radius:16px;";
    elementBlock.prepend(image);
  }

  const tableImages = images.filter((image) => image.label.startsWith("ცხრილი "));
  clone.querySelectorAll("table").forEach((table, index) => {
    const imageData = tableImages[index];
    if (!imageData) return;
    const image = document.createElement("img");
    image.src = imageData.dataUrl;
    image.alt = imageData.label;
    image.style.cssText = "display:block;width:100%;height:auto;margin:14px 0;border-radius:10px;";
    table.after(image);
  });

  clone.querySelectorAll("svg").forEach((svg) => svg.remove());
  clone.querySelectorAll("*").forEach((node) => {
    const element = node as HTMLElement;
    element.style.fontFamily = "Arial, sans-serif";
    if (/^H[1-6]$/u.test(element.tagName)) {
      element.style.fontWeight = "700";
      element.style.margin = "18px 0 8px";
    }
    if (element.tagName === "TABLE") {
      element.style.cssText += "border-collapse:collapse;width:100%;margin:14px 0;font-size:14px;";
    }
    if (element.tagName === "TH" || element.tagName === "TD") {
      element.style.cssText += "border:1px solid #cbd5e1;padding:7px;text-align:left;vertical-align:top;";
    }
  });
  return clone;
}

async function makeCompositePng(images: ExportImage[]) {
  if (!images.length) return null;
  const width = 1400;
  const gap = 42;
  const scale = width / Math.max(...images.map((image) => image.width));
  const heights = images.map((image) => Math.max(80, Math.round(image.height * Math.min(1, scale))));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = images.reduce((sum, _, index) => sum + heights[index] + gap, gap);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#080418";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let y = gap / 2;
  for (const [index, imageData] of images.entries()) {
    const image = await imageFromSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${imageData.width}" height="${imageData.height}"><image href="${imageData.dataUrl}" width="100%" height="100%" preserveAspectRatio="none" /></svg>`,
      imageData.width,
      imageData.height,
    );
    context.drawImage(image, 0, y, width, heights[index]!);
    y += heights[index]! + gap;
  }
  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function copyChartExport(root: HTMLElement) {
  const wheelSvg = root.querySelector<SVGSVGElement>(".chart-wheel-wrap svg");
  const images: ExportImage[] = [];
  if (wheelSvg) images.push(await svgToPng(wheelSvg, "ზოდიაქალური წრე"));

  const elementMarkup = elementBalanceSvg(root);
  if (elementMarkup) images.push(await markupToPng(elementMarkup, "სტიქიების პროცენტული სინთეზი", 1200, 500));

  const tables = Array.from(root.querySelectorAll<HTMLTableElement>("table"));
  for (const [index, table] of tables.entries()) images.push(await tableToPng(table, index));

  const clone = prepareHtmlClone(root, images);
  const plainText = plainTextFromClone(clone);
  const html = `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;">${clone.innerHTML}</div>`;
  const composite = await makeCompositePng(images);

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const payload: Record<string, Blob> = {
        "text/plain": new Blob([plainText], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      };
      if (composite) payload["image/png"] = composite;
      await navigator.clipboard.write([new ClipboardItem(payload)]);
      return;
    } catch {
      // Some browsers allow text writes but reject a mixed HTML/image item.
    }
  }
  await navigator.clipboard.writeText(plainText);
}
