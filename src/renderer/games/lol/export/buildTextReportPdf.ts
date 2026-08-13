import { jsPDF } from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import { t } from '../../../core/i18n';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import {
  accountSummaryTable,
  championsTable,
  chromasTable,
  emotesTable,
  lootTable,
  profileIconsTable,
  rankedTable,
  skinsTable,
  wardSkinsTable,
  type PdfTable,
} from './pdfSections';
import { exportSectionLabel } from './exportSections';
import type { ReportData } from './reportData';

// Text/table content only — no addImage anywhere in this file. That's what
// keeps the file small and every word of it real, selectable, searchable
// text rather than a picture of text.
const PAGE_MARGIN = 40;
const HEADER_Y = 24;
const CONTENT_TOP = 70;
const FOOTER_MARGIN = 30;

function formatGeneratedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// jspdf-autotable stamps the finished table's geometry onto the document
// instance itself (verified against the installed dist bundle) rather than
// returning it from autoTable() — jsPDF's own types don't know about this
// plugin-added field, hence the cast.
function getFinalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

function addHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(text, PAGE_MARGIN, y);
  return y + 14;
}

function drawTable(doc: jsPDF, table: PdfTable, startY: number, options: Partial<UserOptions> = {}): number {
  if (table.body.length === 0) return startY;

  autoTable(doc, {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: CONTENT_TOP, bottom: FOOTER_MARGIN + 10 },
    head: table.head.length ? [table.head] : undefined,
    body: table.body,
    theme: table.head.length ? 'striped' : 'plain',
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 30, 30] },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    columnStyles: table.head.length ? {} : { 0: { fontStyle: 'bold', cellWidth: 140 } },
    ...options,
  });

  return getFinalY(doc, startY) + 24;
}

/**
 * Account summary, rank info, and a table per collection category — no
 * screenshots, so file size stays small and every field is real text a
 * reader (or a search) can find. Running header + page numbers are stamped
 * in a final pass over every page, once the total page count is known,
 * rather than per-table hooks — simpler than coordinating that across many
 * separate autoTable() calls.
 */
export function buildTextReportPdf(
  summary: AccountSummary,
  ranked: RankedSummary,
  data: ReportData,
  generatedAt: Date,
): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(t('export.textReportTitle'), PAGE_MARGIN, CONTENT_TOP - 15);

  let y = CONTENT_TOP + 10;
  y = addHeading(doc, t('export.sectionAccountSummary'), y);
  y = drawTable(doc, accountSummaryTable(summary), y);

  y = addHeading(doc, t('export.sectionRanked'), y);
  drawTable(doc, rankedTable(ranked), y);

  const categories: Array<{ id: 'champions' | 'skins' | 'chromas' | 'wardSkins' | 'emotes' | 'profileIcons' | 'loot'; table: PdfTable }> = [
    { id: 'champions', table: championsTable(data.champions) },
    { id: 'skins', table: skinsTable(data.skins) },
    { id: 'chromas', table: chromasTable(data.chromas) },
    { id: 'wardSkins', table: wardSkinsTable(data.wardSkins) },
    { id: 'emotes', table: emotesTable(data.emotes) },
    { id: 'profileIcons', table: profileIconsTable(data.profileIcons) },
    { id: 'loot', table: lootTable(data.loot) },
  ];

  for (const { id, table } of categories) {
    if (table.body.length === 0) continue;
    // Fresh page per category so a long previous table never leaves this
    // heading orphaned at the bottom of a page with its table starting on
    // the next one.
    doc.addPage();
    const heading = `${exportSectionLabel(id)} (${table.body.length.toLocaleString('en-US')})`;
    const headingY = addHeading(doc, heading, CONTENT_TOP);
    drawTable(doc, table, headingY);
  }

  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Oracle Lens — ${summary.summonerName} — ${summary.region}`, PAGE_MARGIN, HEADER_Y);
    doc.text(formatGeneratedDate(generatedAt), pageWidth - PAGE_MARGIN, HEADER_Y, { align: 'right' });

    doc.text(
      `${t('export.page')} ${page} ${t('export.of')} ${totalPages}`,
      pageWidth / 2,
      pageHeight - FOOTER_MARGIN + 14,
      { align: 'center' },
    );
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
