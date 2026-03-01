const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendQuotationNotification = async (email, username, quotationId) => {
    try {
        const mailOptions = {
            from: `"Quantile Billing" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Quotation has been generated!",
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">QUANTILE BILLING</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">Quotation Notification</p>
          </div>
          <div style="padding: 32px 24px; background: #ffffff;">
            <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Hello ${username},</h2>
            <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
              Your quotation <strong style="color: #f59e0b;">#${quotationId}</strong> has been generated as per your request.
            </p>
            <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 24px;">
              Please review the quotation at your earliest convenience. If any problem occurs, kindly contact the admin immediately.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer-quotations" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245,158,11,0.3);">
                Review Your Quotation
              </a>
            </div>
          </div>
          <div style="padding: 20px 24px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for choosing Quantile Billing.</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #d1d5db;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Quotation notification email sent to ${email}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};
