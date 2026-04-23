import { jsPDF } from "jspdf";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export type AgendaOptions = {
  title: string;
  subtitle?: string;
  authorName?: string;
  startMonth: Date; // any day in start month
  endMonth: Date; // any day in end month
  includeWeekends: boolean;
};

// Half letter landscape: 8.5in x 5.5in => 215.9mm x 139.7mm
// (media hoja carta horizontal: una hoja carta 11x8.5" partida en 2)
const PAGE_W = 215.9;
const PAGE_H = 139.7;
const MARGIN_X = 14;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 14;

function drawCoverBackPage(doc: jsPDF, opts: AgendaOptions, isCover: boolean) {
  // outer frame
  doc.setDrawColor(20);
  doc.setLineWidth(0.4);
  doc.rect(8, 8, PAGE_W - 16, PAGE_H - 16);
  doc.setLineWidth(0.15);
  doc.rect(11, 11, PAGE_W - 22, PAGE_H - 22);

  if (isCover) {
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("— Agenda —", PAGE_W / 2, 50, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(28);
    const lines = doc.splitTextToSize(opts.title || "Mi Agenda", PAGE_W - 40);
    doc.text(lines, PAGE_W / 2, 75, { align: "center" });

    if (opts.subtitle) {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(opts.subtitle, PAGE_W / 2, 100, { align: "center" });
    }

    const range = `${format(opts.startMonth, "LLLL yyyy", { locale: es })} — ${format(
      opts.endMonth,
      "LLLL yyyy",
      { locale: es },
    )}`;
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text(range.toUpperCase(), PAGE_W / 2, PAGE_H - 60, { align: "center" });

    if (opts.authorName) {
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(opts.authorName, PAGE_W / 2, PAGE_H - 45, { align: "center" });
    }
  } else {
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text(
      "“Cada día es una página en blanco esperando ser escrita.”",
      PAGE_W / 2,
      PAGE_H / 2,
      { align: "center", maxWidth: PAGE_W - 40 },
    );
  }
}

function drawMonthCover(doc: jsPDF, monthDate: Date) {
  doc.setDrawColor(20);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, 40, PAGE_W - MARGIN_X, 40);
  doc.line(MARGIN_X, PAGE_H - 40, PAGE_W - MARGIN_X, PAGE_H - 40);

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text(format(monthDate, "yyyy"), PAGE_W / 2, 35, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.text(
    format(monthDate, "LLLL", { locale: es }).toUpperCase(),
    PAGE_W / 2,
    PAGE_H / 2,
    { align: "center" },
  );

  // small calendar grid
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });
  const startWeekday = (startOfMonth(monthDate).getDay() + 6) % 7; // Monday=0
  const cellW = (PAGE_W - MARGIN_X * 2) / 7;
  const cellH = 7;
  const gridTop = PAGE_H / 2 + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  ["L", "M", "X", "J", "V", "S", "D"].forEach((d, i) => {
    doc.text(d, MARGIN_X + cellW * i + cellW / 2, gridTop, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  days.forEach((d) => {
    const idx = startWeekday + d.getDate() - 1;
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    doc.text(
      String(d.getDate()),
      MARGIN_X + cellW * col + cellW / 2,
      gridTop + 5 + row * cellH,
      { align: "center" },
    );
  });
}

function drawDayPage(doc: jsPDF, day: Date) {
  // Date box top
  const boxX = MARGIN_X;
  const boxY = MARGIN_TOP;
  const boxW = PAGE_W - MARGIN_X * 2;
  const boxH = 18;

  doc.setDrawColor(20);
  doc.setLineWidth(0.3);
  doc.rect(boxX, boxY, boxW, boxH);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text(
    format(day, "EEEE", { locale: es }).toUpperCase(),
    boxX + 4,
    boxY + 6,
  );

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(
    format(day, "d 'de' LLLL, yyyy", { locale: es }),
    boxX + 4,
    boxY + 14,
  );

  // Day number large on right
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text(format(day, "dd/MM"), boxX + boxW - 4, boxY + 12, {
    align: "right",
  });

  // Lines
  const linesTop = boxY + boxH + 8;
  const linesBottom = PAGE_H - MARGIN_BOTTOM - 8;
  const lineGap = 8;
  doc.setLineWidth(0.15);
  doc.setDrawColor(160);
  for (let y = linesTop; y <= linesBottom; y += lineGap) {
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  }

  // Footer
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    format(day, "EEEE d MMM yyyy", { locale: es }),
    PAGE_W / 2,
    PAGE_H - 6,
    { align: "center" },
  );
  doc.setTextColor(0);
}

export async function generateAgendaPDF(opts: AgendaOptions): Promise<Blob> {
  const doc = new jsPDF({
    unit: "mm",
    format: [PAGE_W, PAGE_H],
    orientation: "landscape",
  });

  // Cover
  drawCoverBackPage(doc, opts, true);

  // Iterate months
  let cursor = startOfMonth(opts.startMonth);
  const end = startOfMonth(opts.endMonth);

  while (cursor <= end) {
    doc.addPage();
    drawMonthCover(doc, cursor);

    const days = eachDayOfInterval({
      start: startOfMonth(cursor),
      end: endOfMonth(cursor),
    });
    for (const day of days) {
      if (!opts.includeWeekends && isWeekend(day)) continue;
      doc.addPage();
      drawDayPage(doc, day);
    }
    cursor = addMonths(cursor, 1);
  }

  // Back cover
  doc.addPage();
  drawCoverBackPage(doc, opts, false);

  return doc.output("blob");
}
