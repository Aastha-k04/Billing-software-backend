const puppeteer = require('puppeteer');
const Product = require('../models/Product');
const { generatePDFTemplate } = require('../utils/pdfTemplate');
const axios = require('axios');

// Helper to convert image URL to base64 in backend
const getBase64 = async (url) => {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000 // 10s timeout for image fetch
        });
        const buffer = Buffer.from(response.data, 'binary');
        const contentType = response.headers['content-type'];
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error('Error fetching image for PDF:', url, error.message);
        return '';
    }
};

exports.downloadQuotationPDF = async (req, res) => {
    console.log('--- Starting PDF Generation ---');
    try {
        const { id } = req.params;
        console.log('Fetching product ID:', id);
        const product = await Product.findById(id).populate('items.item');

        if (!product) {
            console.error('Product not found in DB');
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        console.log('Product found:', product.name);

        // Process items and images
        console.log('Processing items:', product.items?.length || 0);
        const itemsWithImages = await Promise.all(
            (product.items || []).map(async (entry, index) => {
                const item = entry.item;
                if (!item) {
                    return { serialNo: index + 1, name: 'Unknown Item', rate: 0, qty: entry.quantity, amount: 0, base64: '' };
                }
                const rate = product.value === 'nrp' ? (item.nrp || 0) : (item.mrp || 0);
                const qty = entry.quantity || 1;
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
            console.log('Launching browser...');
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });

            console.log('Creating new page...');
            const page = await browser.newPage();

            console.log('Setting page content...');
            await page.setContent(html, {
                waitUntil: 'load',
                timeout: 30000
            });

            console.log('Generating PDF buffer...');
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });

            console.log('PDF generated, buffer size:', pdfBuffer.length);

            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error('Puppeteer generated an empty PDF buffer');
            }

            const sanitizedName = (product.name || 'Customer').replace(/[^a-z0-9]/gi, '_');
            const filename = `Quotation_${sanitizedName}.pdf`;

            console.log('Sending PDF response...');
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length
            });

            res.send(pdfBuffer);
            console.log('--- PDF Generation Success ---');
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
