const puppeteer = require('puppeteer');
const Product = require('../models/Product');
const { generatePDFTemplate } = require('../utils/pdfTemplate');
const axios = require('axios');

// Helper to convert image URL to base64 in backend
const getBase64 = async (url) => {
    if (!url) return '';
    try {
        console.log(`[PDF] Fetching image: ${url}`);
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 8000 // Slightly shorter timeout
        });
        const contentType = response.headers['content-type'] || 'image/png';
        const buffer = Buffer.from(response.data, 'binary');
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.warn(`[PDF] Failed to fetch image ${url}:`, error.message);
        return ''; // Return empty so PDF still generates without this image
    }
};

exports.downloadQuotationPDF = async (req, res) => {
    console.log('[PDF] --- Starting PDF Generation ---');
    try {
        const { id } = req.params;
        console.log('Fetching product ID:', id);
        const product = await Product.findById(id).populate('items.item');

        if (!product) {
            console.error('[PDF] Product not found in DB for ID:', id);
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        console.log('[PDF] Product found:', product.name, '| Price Type:', product.value);

        // Process items and images
        console.log('Processing items:', product.items?.length || 0);
        const itemsWithImages = await Promise.all(
            (product.items || []).map(async (entry, index) => {
                const item = entry.item;
                if (!item) {
                    return { serialNo: index + 1, name: 'Unknown Item', rate: 0, qty: entry.quantity, amount: 0, base64: '' };
                }
                const rate = parseFloat(product.value === 'nrp' ? (item.nrp || 0) : (item.mrp || 0)) || 0;
                const qty = parseFloat(entry.quantity || 1) || 0;
                const amount = rate * qty;

                let base64 = '';
                if (item.image) {
                    console.log(`Fetching image for item ${index + 1}:`, item.image);
                    base64 = await getBase64(item.image);
                }

                return {
                    serialNo: index + 1,
                    name: item.name || 'N/A',
                    description: item.description || '',
                    code: item._id ? item._id.toString().slice(-8).toUpperCase() : 'N/A',
                    rate,
                    qty,
                    amount,
                    base64
                };
            })
        );

        console.log('Generating HTML template...');
        const html = generatePDFTemplate(product, itemsWithImages);
        console.log('HTML generated, length:', html.length);

        if (!html || html.length < 100) {
            throw new Error('Generated HTML is too short or empty');
        }

        let browser;
        try {
            console.log('[PDF] Launching browser...');
            // Reference Puppeteer docs: use --no-sandbox if running in constrained environment
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });

            console.log('Creating new page...');
            const page = await browser.newPage();

            console.log('Setting page content...');
            // Puppeteer docs recommend waitUtil: 'networkidle0' for pages with dynamic content
            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            console.log('Generating PDF buffer...');
            let pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });

            // Ensure we have a Node.js Buffer (Puppeteer might return Uint8Array)
            pdfBuffer = Buffer.from(pdfBuffer);

            console.log('[PDF] PDF generated, buffer size:', pdfBuffer.length);

            if (!pdfBuffer || pdfBuffer.length < 100) {
                throw new Error('Puppeteer generated an invalid or empty PDF buffer');
            }

            // Verify PDF magic number
            const magicNumber = pdfBuffer.toString('utf8', 0, 4);
            if (magicNumber !== '%PDF') {
                console.error('[PDF] Invalid PDF magic number:', magicNumber);
                throw new Error('Generated content is not a valid PDF');
            }

            const sanitizedName = (product.name || 'Customer').replace(/[^a-z0-9]/gi, '_');
            const filename = `Quotation_${sanitizedName}.pdf`;

            console.log('[PDF] Sending PDF response. Size:', pdfBuffer.length);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length
            });

            res.send(pdfBuffer);
            console.log('[PDF] --- PDF Generation Success ---');
        } catch (puppeteerError) {
            console.error('Puppeteer Error:', puppeteerError);
            throw puppeteerError;
        } finally {
            if (browser) {
                console.log('Closing browser...');
                await browser.close();
            }
        }

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
        }
    }
};
