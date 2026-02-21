const numberToWords = (num) => {
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

const formatCurrency = (value) => (parseFloat(value) || 0).toFixed(2);

const generatePDFTemplate = (product, itemsWithImages) => {
  const discountPercent = parseFloat(product.dis) || 0;
  const includeGst = product.includeGst === true;

  const othersTotal = itemsWithImages.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = othersTotal;
  const netAmount = othersTotal;
  const totalWithoutDiscount = othersTotal / (1 - discountPercent / 100);
  const cgst = includeGst ? (othersTotal * 0.09) : 0;
  const sgst = includeGst ? (othersTotal * 0.09) : 0;
  const totalAmountWithGst = othersTotal + cgst + sgst;
  const roundOff = Math.round(totalAmountWithGst) - totalAmountWithGst;
  const finalAmount = Math.round(totalAmountWithGst);

  const itemRowsHtml = itemsWithImages.map(item => `
    <tr>
      <td class="col-srno text-center">${item.serialNo}</td>
      <td class="col-desc text-left desc-cell">
        <strong>${item.name}</strong>
        ${item.description ? `<br><span style="font-size: 9px; color: #666;">${item.description}</span>` : ''}
      </td>
      <td class="col-sku text-center">${item.code || '-'}</td>
      <td class="col-image img-cell">
        ${item.base64 ? `<img src="${item.base64}" class="item-image" alt="${item.name}">` : ''}
      </td>
      <td class="col-price text-right">${formatCurrency(item.rate)}</td>
      <td class="col-qty text-center">${formatCurrency(item.qty)} PCS</td>
      <td class="col-disc text-right">${formatCurrency(discountPercent)}</td>
      <td class="col-amount text-right">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; color: black; font-size: 10px; line-height: 1.2; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; padding: 10px; }
    .header { border: 2px solid #000; padding: 10px; margin-bottom: 0; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .company-info { flex: 1; }
    .logo-section { width: 80px; margin-right: 15px; }
    .logo-box { width: 70px; height: 70px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; background: #f5f5f5; margin-bottom: 5px; }
    .company-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
    .company-address { font-size: 9px; line-height: 1.3; margin-bottom: 5px; }
    .quotation-title { text-align: center; font-size: 16px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin: 10px 0; }
    .header-info { display: flex; justify-content: space-between; }
    .header-left, .header-right { width: 48%; }
    .info-line { font-size: 9px; margin-bottom: 3px; display: flex; }
    .info-label { font-weight: bold; width: 120px; flex-shrink: 0; }
    .info-value { flex: 1; }
    .items-section { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; }
    .section-header { background: #f0f0f0; padding: 5px 8px; font-weight: bold; font-size: 10px; border-bottom: 1px solid #000; text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
    th { background: #f0f0f0; padding: 6px 4px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 9px; }
    td { padding: 6px 4px; border: 1px solid #000; vertical-align: middle; }
    .col-srno { width: 5%; }
    .col-desc { width: 30%; }
    .col-sku { width: 12%; }
    .col-image { width: 13%; }
    .col-price { width: 10%; }
    .col-qty { width: 10%; }
    .col-disc { width: 10%; }
    .col-amount { width: 10%; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .desc-cell { text-align: left; padding-left: 8px; word-wrap: break-word; }
    .img-cell { padding: 4px; text-align: center; }
    .item-image { width: 60px; height: 60px; object-fit: contain; display: block; margin: 0 auto; }
    .summary-section { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 10px; }
    .summary-table { width: 100%; margin-bottom: 10px; }
    .summary-table td { padding: 4px 8px; border: 1px solid #000; font-size: 9px; }
    .summary-label { font-weight: bold; background: #f0f0f0; width: 30%; }
    .area-label { font-weight: bold; background: #f0f0f0; text-align: center; }
    .net-amount-row { font-weight: bold; }
    .final-amount-label { font-weight: bold; font-size: 11px; text-align: right; padding: 8px; background: #000; color: white; }
    .final-amount-value { font-weight: bold; font-size: 11px; text-align: right; padding: 8px; background: #000; color: white; }
    .terms-section { border: 2px solid #000; padding: 8px 10px; margin-bottom: 0; }
    .terms-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; text-decoration: underline; }
    .terms-list { font-size: 9px; line-height: 1.4; padding-left: 18px; margin: 0; }
    .terms-list li { margin-bottom: 3px; }
    .brands-section { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: center; justify-items: center; }
    .brand-item { display: flex; align-items: center; justify-content: center; text-align: center; }
    .footer { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 20px 10px 8px; text-align: right; font-size: 9px; }
    @media print {
      body { margin: 0; padding: 0; }
      .page { margin: 0; padding: 10mm; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div class="logo-section"><div class="logo-box"><strong>QUANTILE</strong></div></div>
        <div class="company-info">
          <div class="company-name">QUANTILE</div>
          <div class="company-address">JAL CHHAYA ROW HOUSE, SATELLITE ROAD, PUNA, MOTA VARACHHA, Surat, Gujarat - 394101</div>
        </div>
        <div class="header-right">
          <div class="info-line"><span class="info-label">Quotation No:</span><span>${product._id.toString().slice(-8).toUpperCase()}</span></div>
          <div class="info-line"><span class="info-label">Date:</span><span>${new Date(product.date).toLocaleDateString("en-GB")}</span></div>
        </div>
      </div>
      <div class="quotation-title">Quotation</div>
      <div class="header-info">
        <div class="header-left"><strong>Buyer:</strong> ${product.name || 'N/A'}<br>${product.address || ''}</div>
      </div>
    </div>
    <div class="items-section">
      <table>
        <thead><tr><th>SR</th><th>DESCRIPTION</th><th>SKU</th><th>IMAGE</th><th>PRICE</th><th>QTY</th><th>DISC</th><th>AMOUNT</th></tr></thead>
        <tbody>${itemRowsHtml}</tbody>
      </table>
    </div>
    <div class="summary-section">
      <table class="summary-table">
        <tr><td class="summary-label">Final Amount:</td><td class="final-amount-value">${formatCurrency(finalAmount)}</td></tr>
      </table>
      <div><strong>Amount (in words):</strong> ${numberToWords(finalAmount)} Rupees Only</div>
    </div>
    <div class="footer">For <strong>VRAJ DIGITAL TILES</strong><br>Authorized Signatory</div>
  </div>
</body>
</html>`;
};

module.exports = { generatePDFTemplate };
