const numberToWords = (num) => {
  num = parseFloat(num);
  if (isNaN(num) || !isFinite(num)) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const helper = (n) => {
    if (isNaN(n) || n < 0) return '';
    if (n < 1000) return convertLessThanThousand(n);
    if (n < 100000) {
      return convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand' +
        (n % 1000 !== 0 ? ' ' + convertLessThanThousand(n % 1000) : '');
    }
    if (n < 10000000) {
      return convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh' +
        (n % 100000 !== 0 ? ' ' + helper(n % 100000) : '');
    }
    return convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore' +
      (n % 10000000 !== 0 ? ' ' + helper(n % 10000000) : '');
  };

  return helper(num);
};

const formatCurrency = (value) => (parseFloat(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const generatePDFTemplate = (product, itemsWithImages) => {
  const discountPercent = parseFloat(product.dis) || 0;
  const includeGst = product.includeGst === true;

  const itemsSubtotal = itemsWithImages.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = (itemsSubtotal * discountPercent) / 100;
  const afterDiscount = itemsSubtotal - discountAmount;

  const cgst = includeGst ? (afterDiscount * 0.09) : 0;
  const sgst = includeGst ? (afterDiscount * 0.09) : 0;
  const totalWithGst = afterDiscount + cgst + sgst;

  const finalAmount = Math.round(totalWithGst);
  const roundOff = finalAmount - totalWithGst;

  const itemRowsHtml = itemsWithImages.map(item => `
    <tr>
      <td class="col-srno text-center">${item.serialNo}</td>
      <td class="col-desc text-left desc-cell">
        <div class="item-name">${item.name}</div>
        ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
      </td>
      <td class="col-sku text-center">${item.code || '-'}</td>
      <td class="col-image img-cell">
        ${item.base64 ? `<img src="${item.base64}" class="item-image" alt="${item.name}">` : ''}
      </td>
      <td class="col-price text-right">${formatCurrency(item.rate)}</td>
      <td class="col-qty text-center">${item.qty} PCS</td>
      <td class="col-amount text-right">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: white; color: #1a1a1a; font-size: 10px; line-height: 1.4; }
    .page { width: 100%; max-width: 210mm; margin: 0 auto; background: white; }
    
    .header-container { border: 1.5px solid #000; margin-bottom: 15px; }
    .header-top { display: flex; border-bottom: 1.5px solid #000; }
    .logo-section { width: 120px; border-right: 1.5px solid #000; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .logo-text { font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    
    .company-info { flex: 1; padding: 15px; }
    .company-name { font-size: 22px; font-weight: 900; color: #000; margin-bottom: 4px; }
    .company-address { font-size: 9px; color: #444; max-width: 300px; font-style: italic; }
    
    .quotation-meta { width: 220px; border-left: 1.5px solid #000; padding: 15px; }
    .meta-item { display: flex; margin-bottom: 6px; }
    .meta-label { font-weight: 800; width: 90px; text-transform: uppercase; font-size: 9px; color: #555; }
    .meta-value { font-weight: 700; color: #000; }
    
    .title-bar { background: #000; color: white; text-align: center; padding: 8px 0; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; }
    
    .buyer-info { display: flex; border-bottom: 1.5px solid #000; }
    .buyer-details { flex: 1; padding: 12px 15px; border-right: 1.5px solid #000; }
    .buyer-label { font-[black] uppercase text-zinc-500 tracking-widest text-[8px] mb-2 block; color: #666; font-weight: 800; font-size: 8px; border-bottom: 1px solid #eee; padding-bottom: 2px; margin-bottom: 4px; }
    .buyer-name { font-size: 13px; font-weight: 900; color: #000; text-transform: uppercase; }
    .buyer-address { font-size: 9px; color: #333; margin-top: 4px; font-style: italic; }
    
    .prepared-details { width: 220px; padding: 12px 15px; }
    .prepared-name { font-size: 11px; font-weight: 700; color: #000; }

    .items-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 15px; }
    .items-table th { background: #f4f4f4; border: 1px solid #000; padding: 8px 5px; font-size: 9px; font-weight: 900; text-transform: uppercase; }
    .items-table td { border: 1px solid #000; padding: 8px 6px; vertical-align: middle; }
    
    .col-srno { width: 35px; text-align: center; }
    .col-desc { width: auto; }
    .col-sku { width: 80px; text-align: center; }
    .col-image { width: 70px; text-align: center; }
    .col-price { width: 85px; text-align: right; }
    .col-qty { width: 60px; text-align: center; }
    .col-amount { width: 90px; text-align: right; }
    
    .item-name { font-weight: 700; font-size: 10px; margin-bottom: 2px; }
    .item-desc { font-size: 8px; color: #666; font-style: italic; }
    .item-image { width: 50px; height: 50px; object-fit: contain; }
    
    .bottom-section { display: flex; gap: 15px; }
    .notes-area { flex: 1; border: 1.5px solid #000; padding: 12px; }
    .notes-title { font-weight: 900; font-size: 9px; text-decoration: underline; margin-bottom: 8px; text-transform: uppercase; }
    .notes-list { list-style: none; font-size: 8.5px; color: #444; }
    .notes-list li { margin-bottom: 4px; position: relative; padding-left: 12px; }
    .notes-list li:before { content: "•"; position: absolute; left: 0; font-weight: bold; }
    
    .summary-area { width: 280px; border: 1.5px solid #000; }
    .summary-row { display: flex; border-bottom: 1px solid #eee; padding: 6px 10px; justify-content: space-between; align-items: center; }
    .summary-row:last-of-type { border-bottom: none; }
    .summary-label { font-weight: 700; font-size: 8.5px; color: #555; text-transform: uppercase; }
    .summary-value { font-weight: 700; font-size: 10px; color: #000; }
    
    .grand-total-row { background: #000; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center; }
    .grand-total-label { font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .grand-total-value { font-size: 15px; font-weight: 900; }
    
    .words-section { background: #f9f9f9; padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 9px; }
    .words-label { font-weight: 800; text-transform: uppercase; color: #666; font-size: 8px; margin-bottom: 2px; display: block; }
    .words-value { font-weight: 700; color: #000; font-style: italic; }
    
    .signature-section { margin-top: 25px; display: flex; justify-content: flex-end; }
    .sign-box { text-align: center; width: 200px; }
    .sign-label { font-size: 9px; font-weight: 800; margin-bottom: 40px; text-transform: uppercase; }
    .sign-name { font-size: 10px; font-weight: 900; border-top: 1.5px solid #000; padding-top: 5px; }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-container">
      <div class="header-top">
        <div class="logo-section">
          <div class="logo-text">QUANTILE</div>
        </div>
        <div class="company-info">
          <div class="company-name">QUANTILE</div>
          <div class="company-address">JAL CHHAYA ROW HOUSE, SATELLITE ROAD, PUNA, MOTA VARACHHA, Surat, Gujarat - 394101</div>
        </div>
        <div class="quotation-meta">
          <div class="meta-item">
            <span class="meta-label">Quotation #:</span>
            <span class="meta-value">${product._id.toString().slice(-12).toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${new Date(product.date).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Validity:</span>
            <span class="meta-value">15 Days</span>
          </div>
        </div>
      </div>
      
      <div class="title-bar">QUOTATION DOCUMENT</div>
      
      <div class="buyer-info">
        <div class="buyer-details">
          <span class="buyer-label">Bill To / Deliver To</span>
          <div class="buyer-name">${product.name || 'VALUED CUSTOMER'}</div>
          <div class="buyer-address">${product.address || 'SURAT, GUJARAT'}</div>
          <div style="margin-top: 5px; font-size: 9px; font-weight: 700;">TEL: ${product.number || '-'}</div>
        </div>
        <div class="prepared-details">
          <span class="buyer-label">Prepared By</span>
          <div class="prepared-name">${product.createdByUsername || 'ADMINISTRATOR'}</div>
          <div style="font-size: 8px; color: #555; margin-top: 2px;">SALES DEPARTMENT</div>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-srno">SR</th>
          <th class="col-desc">ITEM DESCRIPTION</th>
          <th class="col-sku">SKU / CODE</th>
          <th class="col-image">IMAGE</th>
          <th class="col-price">RATE (₹)</th>
          <th class="col-qty">QTY</th>
          <th class="col-amount">TOTAL (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div class="bottom-section">
      <div class="notes-area">
        <div class="notes-title">Terms and Conditions</div>
        <ul class="notes-list">
          <li>Goods once sold will not be taken back or exchanged.</li>
          <li>We are not responsible for any damage during transit.</li>
          <li>Subject to Surat Jurisdiction only.</li>
          <li>Please check the products and quantity at the time of delivery.</li>
        </ul>
      </div>
      
      <div class="summary-area">
        <div class="summary-row">
          <span class="summary-label">Gross Subtotal (Excl. Tax)</span>
          <span class="summary-value">₹${formatCurrency(itemsSubtotal)}</span>
        </div>
        
        ${discountPercent > 0 ? `
        <div class="summary-row" style="color: #c2410c;">
          <span class="summary-label">Discount Applied (${discountPercent}%)</span>
          <span class="summary-value">-₹${formatCurrency(discountAmount)}</span>
        </div>
        ` : ''}
        
        <div class="summary-row">
          <span class="summary-label">Taxable Value</span>
          <span class="summary-value">₹${formatCurrency(afterDiscount)}</span>
        </div>

        <div class="summary-row">
          <span class="summary-label">GST 18% (${includeGst ? 'INCL' : 'EXCL'})</span>
          <span class="summary-value">₹${formatCurrency(cgst + sgst)}</span>
        </div>

        <div class="summary-row" style="border-top: 1.5px solid #eee;">
          <span class="summary-label">Round Off</span>
          <span class="summary-value">${roundOff >= 0 ? '+' : ''}${formatCurrency(roundOff)}</span>
        </div>

        <div class="words-section">
          <span class="words-label">Amount in Words</span>
          <div class="words-value">${numberToWords(finalAmount)} Rupees Only</div>
        </div>

        <div class="grand-total-row">
          <span class="grand-total-label">Grand Total</span>
          <span class="grand-total-value">₹${formatCurrency(finalAmount)}</span>
        </div>
      </div>
    </div>

    <div class="signature-section">
      <div class="sign-box">
        <div class="sign-label">FOR QUANTILE</div>
        <div class="sign-name">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { generatePDFTemplate };
