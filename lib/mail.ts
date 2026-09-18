import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD,
      }
    : undefined,
});
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
export async function sendOutreachMail(input: {
  to: string;
  name?: string | null;
  subject: string;
  bodyHtml: string;
  unsubscribeUrl: string;
}) {
  console.log("[mail] sending outreach", {
    to: input.to,
    subject: input.subject,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpSecure: process.env.SMTP_SECURE,
    smtpUser: process.env.SMTP_USER,
  });

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM or SMTP_USER is not configured.");
  const logoUrl = "https://immortifydigital.com/logo/logo_white.png";

  const html = `
  <div style="max-width: 680px; margin: 0 auto; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
    <div style="background: linear-gradient(135deg, #0b1220 0%, #101827 42%, #1d4ed8 100%); padding: 26px 30px 18px 30px;">
      <a
        href="https://immortifydigital.com" 
        target="_blank"
        style="
          display: inline-block;
          text-decoration: none;
          border: 0;
          outline: none;
        "
      >
        <img src="${logoUrl}" alt="Immortify Digital" style="display: block; width: 230px; height: auto; margin: 0 0 10px 0; border: 0; background: transparent; padding: 8px 0px; border-radius: 10px;" />
      </a>
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; color: #dbeafe;">
        Ecommerce • Web Apps • Growth Systems
      </div>
    </div>

    <div style="padding: 28px 30px 12px 30px; background: #ffffff;">
      <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #111827; font-weight: 700;">
        ${input.name ? `Hi ${escapeHtml(input.name)},` : "Hello,"}
      </p>

      <div style="font-size: 15px; line-height: 1.85; color: #1f2937;">
        ${input.bodyHtml}
      </div>
    </div>

    <div style="padding: 0 30px 20px 30px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%); border-left: 4px solid #1d4ed8; border-radius: 12px; padding: 18px 20px; color: #1e3a8a; font-size: 14px; line-height: 1.7; font-weight: 600;">
        Let’s turn your vision into a digital experience worthy of your brand.
      </div>
    </div>

    <div style="padding: 0 30px 26px 30px; background: #ffffff;">
      <a href="https://immortifydigital.com" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 13px 24px; border-radius: 999px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
        Book a strategy call
      </a>
    </div>

    <div style="padding: 0 30px 28px 30px; background: #ffffff; border-top: 1px solid #e5e7eb;">
      <p style="margin: 20px 0 6px; font-size: 13px; line-height: 1.7; color: #111827; font-weight: 700;">
        Immortify Digital · Memnagar, Ahmedabad, India
      </p>
      <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #475569;">
        contact@immortifydigital.com · +91 79068 73874
      </p>
    </div>
  </div>
`;

/*<p style="margin: 12px 0 0; font-size: 12px; line-height: 1.7; color: #475569;">
  You received this email because you opted in to our updates.
  <a href="${escapeHtml(input.unsubscribeUrl)}" style="color: #1d4ed8; text-decoration: underline;">
    Unsubscribe
  </a>
</p>*/

try {
  const info = await transporter.sendMail({
    from: from.includes("<")
      ? from
      : `"Immortify Digital" <${from}>`,
    to: input.to,
    subject: input.subject,
    html,
  });

  console.log("[mail] sendMail success", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
} catch (error) {
    console.error("[mail] sendMail failed", {
      to: input.to,
      subject: input.subject,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }}