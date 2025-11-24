import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatSpanishDate } from '@/lib/date-utils';
import { Meaning, GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/lib/definitions';

interface RedactedWord {
  lemma: string;
  root?: string | null;
  letter: string;
  meanings?: Meaning[];
  notes?: Array<{
    note: string | null;
  }> | null;
}

/**
 * Generate a PDF report of redacted words with their editorial comments
 */
export async function generateRedactedWordsPDF(redactedWords: RedactedWord[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Fonts
  const fontTitle = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontText = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Margins and layout
  const marginLeft = 60;
  const marginRight = 60;
  const marginTop = 50;
  const marginBottom = 60;
  const lineHeight = 16;
  const contentWidth = width - marginLeft - marginRight;

  // Helper para dividir texto largo en líneas
  const wrapText = (text: string, maxChars: number): string[] => {
    const lines: string[] = [];
    let current = text;

    while (current.length > maxChars) {
      const cutAt = current.lastIndexOf(' ', maxChars);
      const idx = cutAt > 0 ? cutAt : maxChars;
      lines.push(current.slice(0, idx));
      current = current.slice(idx).trimStart();
    }

    if (current.length > 0) lines.push(current);
    return lines;
  };

  let y = height - marginTop;

  // Current date string
  const dateStr = formatSpanishDate();

  const drawHeader = () => {
    // Title
    const title = 'REPORTE DE PALABRAS REDACTADAS';
    const titleSize = 16;
    const titleWidth = fontTitle.widthOfTextAtSize(title, titleSize);
    const titleX = marginLeft + (contentWidth - titleWidth) / 2;

    page.drawText(title, {
      x: titleX,
      y,
      size: titleSize,
      font: fontTitle,
      color: rgb(0, 0, 0),
    });

    y -= 22;

    // Subtitle with date
    const subtitle = `Al ${dateStr}`;
    const subtitleSize = 11;
    const subtitleWidth = fontText.widthOfTextAtSize(subtitle, subtitleSize);
    const subtitleX = marginLeft + (contentWidth - subtitleWidth) / 2;

    page.drawText(subtitle, {
      x: subtitleX,
      y,
      size: subtitleSize,
      font: fontText,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 20;
  };

  const drawFooter = (pageNumber: number) => {
    const footerY = marginBottom - 20;

    // Page number centered in the footer
    const pageLabel = `— ${pageNumber} —`;
    const pageLabelWidth = fontText.widthOfTextAtSize(pageLabel, 9);
    const pageLabelX = marginLeft + (contentWidth - pageLabelWidth) / 2;

    page.drawText(pageLabel, {
      x: pageLabelX,
      y: footerY,
      size: 9,
      font: fontText,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Top line above the footer
    page.drawLine({
      start: { x: marginLeft, y },
      end: { x: width - marginRight, y },
      thickness: 0.3,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 18;
  };

  let pageNumber = 1;
  drawHeader();
  drawFooter(pageNumber);

  // Helper to ensure enough space on the page, else add new page
  const ensureSpace = (neededLines: number) => {
    if (y - neededLines * lineHeight < marginBottom + 30) {
      page = pdfDoc.addPage();
      y = height - marginTop;
      pageNumber += 1;
      drawHeader();
      drawFooter(pageNumber);
    }
  };

  // Case with no redacted words
  if (redactedWords.length === 0) {
    ensureSpace(3);
    y -= 20;
    page.drawText('No se encontraron palabras en estado redactada.', {
      x: marginLeft,
      y,
      size: 12,
      font: fontItalic,
      color: rgb(0.3, 0.3, 0.3),
    });

    return pdfDoc.save();
  }

  // Subtitle with count
  y -= 2;
  page.drawText(`Total de palabras: ${redactedWords.length}`, {
    x: marginLeft,
    y,
    size: 10,
    font: fontText,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 30;

  // Numbered list of words + comments
  let index = 1;

  for (const word of redactedWords) {
    ensureSpace(5);

    // Number + lemma
    const heading = `${index}. ${word.lemma.toUpperCase()}`;
    page.drawText(heading, {
      x: marginLeft,
      y,
      size: 13,
      font: fontTitle,
      color: rgb(0, 0, 0),
    });

    y -= lineHeight + 4;

    // Root if different from lemma
    if (word.root && word.root !== word.lemma) {
      ensureSpace(1);
      page.drawText(`Raíz: ${word.root}`, {
        x: marginLeft + 15,
        y,
        size: 9,
        font: fontText,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= lineHeight;
    }

    if (word.meanings && word.meanings.length > 0) {
      for (const meaning of word.meanings) {
        ensureSpace(6);

        // Definition number
        page.drawText(`Definición ${meaning.number}:`, {
          x: marginLeft + 15,
          y,
          size: 11,
          font: fontTitle,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;

        // Origin
        if (meaning.origin) {
          ensureSpace(1);
          page.drawText(`Origen: ${meaning.origin}`, {
            x: marginLeft + 25,
            y,
            size: 9,
            font: fontText,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= lineHeight - 2;
        }

        // Categories
        if (meaning.categories && meaning.categories.length > 0) {
          ensureSpace(2);
          const cats = meaning.categories.map((c) => GRAMMATICAL_CATEGORIES[c] || c).join(', ');
          const catLines = wrapText(`Categorías: ${cats}`, 80);

          for (const line of catLines) {
            ensureSpace(1);
            page.drawText(line, {
              x: marginLeft + 25,
              y,
              size: 9,
              font: fontText,
              color: rgb(0.3, 0.3, 0.3),
            });
            y -= lineHeight - 2;
          }
        }

        // Meaning text (con etiqueta)
        ensureSpace(3);
        const meaningLines = wrapText(meaning.meaning, 75);
        for (let i = 0; i < meaningLines.length; i++) {
          ensureSpace(1);
          const line = meaningLines[i];
          page.drawText(line, {
            x: marginLeft + 25,
            y,
            size: 10,
            font: fontText,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        }

        // Styles
        if (meaning.styles && meaning.styles.length > 0) {
          ensureSpace(1);
          const styles = meaning.styles.map((s) => USAGE_STYLES[s] || s).join(', ');
          page.drawText(`Estilos: ${styles}`, {
            x: marginLeft + 25,
            y,
            size: 9,
            font: fontText,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= lineHeight - 2;
        }

        // Observation
        if (meaning.observation) {
          ensureSpace(2);
          page.drawText('Observación:', {
            x: marginLeft + 25,
            y,
            size: 9,
            font: fontTitle,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= lineHeight - 2;

          const obsLines = wrapText(meaning.observation, 75);
          for (const line of obsLines) {
            ensureSpace(1);
            page.drawText(line, {
              x: marginLeft + 30,
              y,
              size: 9,
              font: fontItalic,
              color: rgb(0.2, 0.2, 0.4),
            });
            y -= lineHeight - 2;
          }
        }

        // Remission (se mueve después de observación)
        if (meaning.remission) {
          ensureSpace(1);
          page.drawText(`Ver: ${meaning.remission}`, {
            x: marginLeft + 25,
            y,
            size: 9,
            font: fontItalic,
            color: rgb(0, 0, 0.5),
          });
          y -= lineHeight - 2;
        }

        // Examples
        if (meaning.examples && meaning.examples.length > 0) {
          ensureSpace(2);
          page.drawText(`Ejemplos (${meaning.examples.length}):`, {
            x: marginLeft + 25,
            y,
            size: 9,
            font: fontTitle,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= lineHeight;

          for (const ex of meaning.examples) {
            ensureSpace(4);

            // Example text
            const exLines = wrapText(ex.value, 72);
            for (const line of exLines) {
              ensureSpace(1);
              page.drawText(`"${line}"`, {
                x: marginLeft + 30,
                y,
                size: 9,
                font: fontItalic,
                color: rgb(0.15, 0.15, 0.15),
              });
              y -= lineHeight - 3;
            }

            // Example metadata
            const metadata: string[] = [];
            if (ex.author) metadata.push(`Autor: ${ex.author}`);
            if (ex.title) metadata.push(`Título: ${ex.title}`);
            if (ex.source) metadata.push(`Fuente: ${ex.source}`);
            if (ex.date) metadata.push(`Fecha: ${ex.date}`);
            if (ex.page) metadata.push(`Pág: ${ex.page}`);

            if (metadata.length > 0) {
              ensureSpace(1);
              const metaText = metadata.join(' | ');
              const metaLines = wrapText(metaText, 70);

              for (const line of metaLines) {
                ensureSpace(1);
                page.drawText(line, {
                  x: marginLeft + 35,
                  y,
                  size: 7,
                  font: fontText,
                  color: rgb(0.5, 0.5, 0.5),
                });
                y -= lineHeight - 4;
              }
            }

            y -= 4; // Space between examples
          }
        }

        y -= 8; // Space between definitions
      }
    } else {
      ensureSpace(1);
      page.drawText('Sin definiciones.', {
        x: marginLeft + 15,
        y,
        size: 10,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= lineHeight;
    }

    // Editorial notes
    if (word.notes && word.notes.length > 0) {
      ensureSpace(2);
      page.drawText('Comentarios editoriales:', {
        x: marginLeft + 15,
        y,
        size: 10,
        font: fontTitle,
        color: rgb(0.2, 0.2, 0.2),
      });

      y -= lineHeight;

      // List each note
      for (const note of word.notes) {
        const noteText = note.note ?? '';
        const maxCharsPerLine = 75;
        const lines = wrapText(noteText, maxCharsPerLine);

        // Draw each line with bullet points
        for (let i = 0; i < lines.length; i++) {
          ensureSpace(1);
          const prefix = i === 0 ? '• ' : '  ';
          page.drawText(prefix + lines[i], {
            x: marginLeft + 25,
            y,
            size: 10,
            font: fontText,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= lineHeight - 2;
        }

        y -= 6;
      }
    } else {
      ensureSpace(2);
      page.drawText('Comentarios editoriales:', {
        x: marginLeft + 15,
        y,
        size: 10,
        font: fontTitle,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;

      page.drawText('Sin comentarios.', {
        x: marginLeft + 25,
        y,
        size: 10,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= lineHeight;
    }

    y -= 10; // Space before next word
    index += 1;
  }

  return pdfDoc.save();
}
