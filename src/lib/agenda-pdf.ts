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

const QUOTES = [
  "Cada día es una nueva oportunidad para empezar de nuevo.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "No cuentes los días, haz que los días cuenten.",
  "Cree en ti mismo y todo será posible.",
  "Las grandes cosas nunca vienen de la zona de confort.",
  "Hazlo con pasión o no lo hagas.",
  "Tu única competencia eres tú mismo de ayer.",
  "La disciplina es el puente entre las metas y los logros.",
  "Pequeños pasos cada día llevan a grandes cambios.",
  "Sé la energía que quieres atraer.",
  "El futuro pertenece a quienes creen en sus sueños.",
  "Convierte tus heridas en sabiduría.",
  "Si puedes soñarlo, puedes lograrlo.",
  "La constancia vence lo que la dicha no alcanza.",
  "Hoy es un buen día para hacerlo mejor.",
  "Florece donde te toque crecer.",
  "Los límites están solo en tu mente.",
  "Confía en el proceso.",
  "Lo que haces hoy puede mejorar todos tus mañanas.",
  "El esfuerzo de hoy es el éxito de mañana.",
];

function pickQuote(day: Date) {
  const seed =
    day.getFullYear() * 1000 + day.getMonth() * 50 + day.getDate();
  return QUOTES[seed % QUOTES.length];
}

function drawMiniCalendar(
  doc: jsPDF,
  monthDate: Date,
  highlightDay: Date,
  x: number,
  y: number,
  w: number,
) {
  const cellW = w / 7;
  const cellH = 4.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(80);
  ["L", "M", "X", "J", "V", "S", "D"].forEach((d, i) => {
    doc.text(d, x + cellW * i + cellW / 2, y, { align: "center" });
  });

  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });
  const startWeekday = (startOfMonth(monthDate).getDay() + 6) % 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  days.forEach((d) => {
    const idx = startWeekday + d.getDate() - 1;
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    const cx = x + cellW * col + cellW / 2;
    const cy = y + 3 + (row + 1) * cellH;

    const isToday =
      d.getDate() === highlightDay.getDate() &&
      d.getMonth() === highlightDay.getMonth();

    if (isToday) {
      doc.setFillColor(20, 20, 20);
      doc.circle(cx, cy - 1.4, 1.8, "F");
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(60);
      doc.setFont("helvetica", "normal");
    }
    doc.text(String(d.getDate()), cx, cy, { align: "center" });
  });
  doc.setTextColor(0);
}

function drawDayHalf(doc: jsPDF, day: Date, x: number, w: number) {
  const topY = 8;
  const headerH = 26;

  // Mini calendar (top-left of half)
  drawMiniCalendar(doc, day, day, x + 2, topY + 2, 32);

  // Date block (right side of header)
  const dateX = x + 38;
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(
    format(day, "EEEE", { locale: es }).toUpperCase(),
    dateX,
    topY + 6,
  );

  doc.setTextColor(0);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text(
    format(day, "d 'de' LLLL, yyyy", { locale: es }),
    dateX,
    topY + 13,
  );

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(format(day, "dd/MM"), x + w - 4, topY + 10, { align: "right" });

  // Quote
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110);
  const quote = `“${pickQuote(day)}”`;
  const quoteLines = doc.splitTextToSize(quote, w - 8);
  doc.text(quoteLines, x + w / 2, topY + 21, { align: "center" });
  doc.setTextColor(0);

  // Separator under header
  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(x + 2, topY + headerH, x + w - 2, topY + headerH);

  // Lines
  const linesTop = topY + headerH + 6;
  const linesBottom = PAGE_H - MARGIN_BOTTOM - 4;
  const lineGap = 7;
  doc.setLineWidth(0.12);
  doc.setDrawColor(170);
  for (let y = linesTop; y <= linesBottom; y += lineGap) {
    doc.line(x + 2, y, x + w - 2, y);
  }
}

function drawTwoDayPage(doc: jsPDF, dayLeft: Date, dayRight?: Date) {
  const halfW = PAGE_W / 2;

  drawDayHalf(doc, dayLeft, 0, halfW);
  if (dayRight) drawDayHalf(doc, dayRight, halfW, halfW);

  // Center divider
  doc.setDrawColor(60);
  doc.setLineWidth(0.3);
  doc.line(halfW, 6, halfW, PAGE_H - 6);
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
    }).filter((d) => opts.includeWeekends || !isWeekend(d));

    for (let i = 0; i < days.length; i += 2) {
      doc.addPage();
      drawTwoDayPage(doc, days[i], days[i + 1]);
    }
    cursor = addMonths(cursor, 1);
  }

  // Back cover
  doc.addPage();
  drawCoverBackPage(doc, opts, false);

  return doc.output("blob");
}
