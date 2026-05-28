import PDFDocument from 'pdfkit';

export const generatePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => reject(err));

    // Brand colors matching the ClientHub purple brand identity
    const primaryColor = '#534AB7';
    const textColor = '#2D3748';
    const lightGray = '#E2E8F0';

    // Header Setup
    doc.fontSize(24).fillColor(primaryColor).text(invoice.agencyName || 'ClientHub Portal', 50, 50);
    doc.fontSize(9).fillColor('#718096').text('Direct Agency Services & Management', 50, 78);
    
    doc.fontSize(20).fillColor(primaryColor).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor(textColor).text(`Invoice #: ${invoice._id || 'DRAFT'}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 90, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 105, { align: 'right' });
    }

    // Horizontal Divider
    doc.strokeColor(lightGray).lineWidth(1).moveTo(50, 130).lineTo(550, 130).stroke();

    // Client/Project Details
    doc.fontSize(12).fillColor(primaryColor).text('BILL TO:', 50, 150);
    doc.fontSize(10).fillColor(textColor).text(`Client Ref: ${invoice.clientId?._id || invoice.clientId || 'N/A'}`, 50, 165);
    if (invoice.projectId) {
      doc.text(`Project Ref: ${invoice.projectId?._id || invoice.projectId || 'N/A'}`, 50, 180);
    }

    // Line Items Grid Header
    const tableTop = 220;
    doc.fontSize(10).fillColor(primaryColor);
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });

    doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Line Items Grid Rows
    let y = tableTop + 25;
    doc.fontSize(10).fillColor(textColor);

    const items = invoice.lineItems || [];
    items.forEach((item) => {
      doc.text(item.description, 50, y);
      doc.text(`$${item.amount.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
      y += 20;
    });

    // Divider Line above totals
    doc.strokeColor(lightGray).lineWidth(1).moveTo(50, y + 5).lineTo(550, y + 5).stroke();
    y += 18;

    // Totals Section
    doc.fontSize(11).fillColor(primaryColor);
    doc.text('Total Due:', 350, y);
    doc.fontSize(11).fillColor(textColor).text(`$${(invoice.total || 0).toFixed(2)}`, 450, y, { width: 100, align: 'right' });

    // Footer Note
    doc.fontSize(9).fillColor('#A0AEC0').text('Thank you for partnering with us!', 50, 700, { align: 'center', width: 500 });

    doc.end();
  });
};
