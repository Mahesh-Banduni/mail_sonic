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

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER is not configured.");
  }

  // -------------------------------------------------------
  // Brand
  // -------------------------------------------------------

  const logoUrl =
    "https://immortifydigital.com/logo/logo_white.png";

  // -------------------------------------------------------
  // Social Media URLs
  // -------------------------------------------------------

  const instagramUrl =
    "https://www.instagram.com/immortifydigital";

  const facebookUrl =
    "https://www.facebook.com/immortifydigital";

  const xUrl =
    "https://x.com/ImortifyDigital";

  // -------------------------------------------------------
  // Self-hosted Social Icons
  //
  // Recommended files:
  //
  // /email-icons/instagram.png
  // /email-icons/facebook.png
  // /email-icons/x.png
  //
  // Each icon should ideally be a white logo on a transparent
  // background.
  // -------------------------------------------------------

  const instagramIcon =
    "https://immortifydigital.com/social/instagram.png";

  const facebookIcon =
    "https://immortifydigital.com/social/facebook.png";

  const xIcon =
    "https://immortifydigital.com/social/x.png";

  // -------------------------------------------------------
  // Email HTML
  // -------------------------------------------------------

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeHtml(input.subject)}</title>

  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }

      .email-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }

      .logo {
        width: 190px !important;
      }
    }
  </style>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: Arial, Helvetica, sans-serif;
  "
>

  <!-- Main Container -->
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      margin: 0;
      padding: 0;
      background: #f8fafc;
      width: 100%;
    "
  >
    <tr>
      <td
        align="center"
        style="
          padding: 20px 10px;
          background: #f8fafc;
        "
      >

        <!-- Email Card -->
        <table
          role="presentation"
          width="680"
          cellspacing="0"
          cellpadding="0"
          border="0"
          class="email-container"
          style="
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-collapse: collapse;
          "
        >

          <!-- ========================================= -->
          <!-- HEADER -->
          <!-- ========================================= -->

          <tr>
            <td
              style="
                padding: 26px 30px 20px 30px;
                background: #0b1220;
                background-image: linear-gradient(
                  135deg,
                  #0b1220 0%,
                  #101827 42%,
                  #1d4ed8 100%
                );
              "
            >

              <a
                href="https://immortifydigital.com"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  text-decoration: none;
                  border: 0;
                  outline: none;
                "
              >
                <img
                  src="${logoUrl}"
                  alt="Immortify Digital"
                  class="logo"
                  width="230"
                  style="
                    display: block;
                    width: 230px;
                    max-width: 100%;
                    height: auto;
                    margin: 0 0 10px 0;
                    border: 0;
                    outline: none;
                    text-decoration: none;
                    background: transparent;
                    padding: 8px 0;
                    border-radius: 10px;
                  "
                />
              </a>

              <div
                style="
                  font-size: 10px;
                  line-height: 16px;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  font-weight: 700;
                  color: #dbeafe;
                "
              >
                Ecommerce • Web Apps • Growth Systems
              </div>

            </td>
          </tr>


          <!-- ========================================= -->
          <!-- MAIN CONTENT -->
          <!-- ========================================= -->

          <tr>
            <td
              class="email-padding"
              style="
                padding: 28px 30px 12px 30px;
                background: #ffffff;
              "
            >

              <p
                style="
                  margin: 0 0 18px 0;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #111827;
                  font-weight: 700;
                "
              >
                ${
                  input.name
                    ? `Hi ${escapeHtml(input.name)},`
                    : "Hello,"
                }
              </p>

              <div
                style="
                  font-size: 15px;
                  line-height: 1.85;
                  color: #1f2937;
                "
              >
                ${input.bodyHtml}
              </div>

            </td>
          </tr>


          <!-- ========================================= -->
          <!-- BRAND MESSAGE -->
          <!-- ========================================= -->

          <tr>
            <td
              class="email-padding"
              style="
                padding: 0 30px 20px 30px;
                background: #ffffff;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width: 100%;
                  border-collapse: separate;
                "
              >
                <tr>
                  <td
                    style="
                      padding: 18px 20px;
                      background: #eef6ff;
                      background-image: linear-gradient(
                        135deg,
                        #eef6ff 0%,
                        #dbeafe 100%
                      );
                      border-left: 4px solid #1d4ed8;
                      border-radius: 12px;
                      color: #1e3a8a;
                      font-size: 14px;
                      line-height: 1.7;
                      font-weight: 600;
                    "
                  >
                    Let’s turn your vision into a digital experience
                    worthy of your brand.
                  </td>
                </tr>
              </table>

            </td>
          </tr>


          <!-- ========================================= -->
          <!-- CTA -->
          <!-- ========================================= -->

          <tr>
            <td
              class="email-padding"
              style="
                padding: 0 30px 28px 30px;
                background: #ffffff;
              "
            >

              <a
                href="https://immortifydigital.com"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  background: #0f172a;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 13px 24px;
                  border-radius: 999px;
                  font-size: 13px;
                  line-height: 18px;
                  font-weight: 700;
                  letter-spacing: 0.5px;
                "
              >
                Book a strategy call
              </a>

            </td>
          </tr>


          <!-- ========================================= -->
          <!-- FOOTER -->
          <!-- ========================================= -->

          <tr>
            <td
              class="email-padding"
              align="center"
              style="
                padding: 24px 30px 30px 30px;
                background: #ffffff;
                border-top: 1px solid #e5e7eb;
              "
            >

              <!-- Company -->
              <p
                style="
                  margin: 0 0 6px 0;
                  font-size: 13px;
                  line-height: 1.7;
                  color: #111827;
                  font-weight: 700;
                "
              >
                Immortify Digital · Memnagar, Ahmedabad, India
              </p>


              <!-- Contact -->
              <p
                style="
                  margin: 0 0 20px 0;
                  font-size: 12px;
                  line-height: 1.7;
                  color: #475569;
                "
              >
                contact@immortifydigital.com · +91 79068 73874
              </p>


              <!-- ===================================== -->
              <!-- SOCIAL MEDIA ICONS -->
              <!-- ===================================== -->

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                align="center"
                style="
                  margin: 0 auto 20px auto;
                  border-collapse: collapse;
                "
              >
                <tr>

                  <!-- Instagram -->
                  <td
                    align="center"
                    valign="middle"
                    style="
                      padding: 0 4px;
                    "
                  >
                    <a
                      href="${instagramUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        width: 38px;
                        height: 38px;
                        background: #0f172a;
                        border-radius: 50%;
                        text-decoration: none;
                      "
                    >
                      <img
                        src="${instagramIcon}"
                        width="18"
                        height="18"
                        alt="Instagram"
                        style="
                          display: block;
                          width: 18px;
                          height: 18px;
                          margin: 10px auto;
                          border: 0;
                          outline: none;
                          text-decoration: none;
                        "
                      />
                    </a>
                  </td>


                  <!-- Facebook -->
                  <td
                    align="center"
                    valign="middle"
                    style="
                      padding: 0 4px;
                    "
                  >
                    <a
                      href="${facebookUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        width: 38px;
                        height: 38px;
                        background: #0f172a;
                        border-radius: 50%;
                        text-decoration: none;
                      "
                    >
                      <img
                        src="${facebookIcon}"
                        width="18"
                        height="18"
                        alt="Facebook"
                        style="
                          display: block;
                          width: 18px;
                          height: 18px;
                          margin: 10px auto;
                          border: 0;
                          outline: none;
                          text-decoration: none;
                        "
                      />
                    </a>
                  </td>


                  <!-- X / Twitter -->
                  <td
                    align="center"
                    valign="middle"
                    style="
                      padding: 0 4px;
                    "
                  >
                    <a
                      href="${xUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        width: 38px;
                        height: 38px;
                        background: #0f172a;
                        border-radius: 50%;
                        text-decoration: none;
                      "
                    >
                      <img
                        src="${xIcon}"
                        width="18"
                        height="18"
                        alt="X"
                        style="
                          display: block;
                          width: 18px;
                          height: 18px;
                          margin: 10px auto;
                          border: 0;
                          outline: none;
                          text-decoration: none;
                        "
                      />
                    </a>
                  </td>

                </tr>
              </table>


              <!-- Social Text -->
              <p
                style="
                  margin: 0 0 14px 0;
                  font-size: 11px;
                  line-height: 1.6;
                  color: #64748b;
                "
              >
                Connect With Us & Let's Grow Together
              </p>


              <!-- Copyright -->
              <p
                style="
                  margin: 0 0 8px 0;
                  font-size: 11px;
                  line-height: 1.6;
                  color: #94a3b8;
                "
              >
                © ${new Date().getFullYear()} Immortify Digital.
                All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  // -------------------------------------------------------
  // Send Email
  // -------------------------------------------------------

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
      error:
        error instanceof Error
          ? error.message
          : String(error),
      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    });

    throw error;
  }
}
