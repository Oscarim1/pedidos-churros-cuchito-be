// src/utils/pdfGenerator.js

import PDFDocument from 'pdfkit';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Divide un texto en líneas que quepan en maxWidth
 */
function splitTextToLines(doc, text, maxWidth) {
  const words = (text || '').split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (doc.widthOfString(testLine) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Genera un PDF tipo ticket 58 mm (164×600 pt) con layout idéntico a jsPDF,
 * pero formatea precios sin decimales.
 */
export async function generateOrderPDF({ order, items, title }) {
  return new Promise((resolve, reject) => {
    const ticketWidth   = 164;   // 58 mm en puntos
    const ticketHeight  = 600;
    const margin        = 10;
    const contentWidth  = ticketWidth - margin * 2;

    const doc = new PDFDocument({
      size: [ticketWidth, ticketHeight],
      margin: 0,
      autoFirstPage: false
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.addPage();
    let y = 10;

    // --- Logo centrado ---
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      doc.image(logoPath, margin, y, {
        width: contentWidth,
        height: 25
      });
    } catch (e) { /* ignora si falla */ }
    y += 35;

    // --- Encabezados ---
    doc.font('Courier').fontSize(14)
       .text(`PEDIDO #${order.order_number}`, margin, y, { width: contentWidth, align: 'center' });
    y += 20;

    doc.fontSize(14)
       .text(title, margin, y, { width: contentWidth, align: 'center' });
    y += 20;

    // --- Fecha ---
    const fecha = format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es });
    doc.fontSize(10)
       .text(`Fecha: ${fecha}`, margin, y, { width: contentWidth, align: 'center' });
    y += 15;

    // --- Separador ---
    doc.text('*'.repeat(20), margin, y, { width: contentWidth, align: 'center' });
    y += 15;

    // --- Ítems ---
    doc.fontSize(10);
    const maxDescWidth = contentWidth - 40;

    for (const item of items) {
      const itemText = `${item.quantity}x ${item.products.name}`;
      const lines = splitTextToLines(doc, itemText, maxDescWidth);
      const startY = y;

      for (const line of lines) {
        if (y > ticketHeight - 30) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, margin, y);
        y += 12;
      }

      // Precio sin decimales, align right
      const priceText = `$${Number(item.price).toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`;
      doc.text(priceText, margin, startY, {
        width: contentWidth,
        align: 'right'
      });

      y += 8;
    }

    // --- Línea final y agradecimiento ---
    doc.moveTo(margin, y).lineTo(ticketWidth - margin, y).stroke();
    y += 6;
    doc.fontSize(10)
       .text('¡Gracias por tu compra!', margin, y, { width: contentWidth, align: 'center' });

    doc.end();
  });
}
