import nodemailer from 'nodemailer';

function getAppName(): string {
  const raw = (process.env.APP_NAME || 'BhabhiKiChai').trim();
  if (raw.toLowerCase() === 'chaipecharcha') return 'Chai Pe Charcha • BhabhiKiChai';
  return raw;
}

function getTransporter() {
  const user = process.env.MAIL_EMAIL?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim();
  const host = process.env.MAIL_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || 465);
  const secure = process.env.MAIL_SECURE !== 'false';

  if (!user || !pass) {
    throw new Error('MAIL_EMAIL or MAIL_PASSWORD is not configured in .env');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function generateFourDigitOtp(): string {
  if (isDevelopmentMode()) {
    return '1234';
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapTapriEmailLayout({
  badgeText,
  heading,
  subHeading,
  bodyHtml,
}: {
  badgeText: string;
  heading: string;
  subHeading: string;
  bodyHtml: string;
}): string {
  const appName = escapeHtml(getAppName());
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FBE5CC;font-family:'Segoe UI',Arial,sans-serif;color:#2B211B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FBE5CC;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#FFF9ED;border:3px solid #8B502C;border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(59,27,13,0.14);">
          <!-- Top Dark Roast Header -->
          <tr>
            <td style="background-color:#3B1B0D;padding:24px 24px 20px;text-align:center;border-bottom:3px solid #F4B52E;">
              <div style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#522915;border:1px solid #F4B52E;color:#F4B52E;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">
                ${escapeHtml(badgeText)}
              </div>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;color:#FFF4DF;">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:#E6C9A2;">
                ${escapeHtml(subHeading)}
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF2E4;padding:16px 24px;border-top:1px solid #E8DAC2;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#3B1B0D;">
                ☕ ${appName}
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#734A29;">
                Daily Chai Duty • Group Expenses • Tapri Notifications
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendNewUserAdminNotification({
  name,
  email,
  createdAt,
}: {
  name: string;
  email: string;
  createdAt?: Date | string;
}) {
  const senderEmail = process.env.MAIL_EMAIL?.trim();
  if (!senderEmail) {
    throw new Error('MAIL_EMAIL is not configured in .env');
  }

  const transporter = getTransporter();
  const formattedTime = new Date(createdAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = wrapTapriEmailLayout({
    badgeText: '🎉 New Customer Alert',
    heading: 'Naya User Register Hua Hai!',
    subHeading: 'BhabhiKiChai par ek naya member join hua hai',
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3B1B0D;">
        Namaste Admin, aapki Tapri par ek naya customer account create hua hai:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF2E4;border:1.5px solid #DFC39B;border-radius:16px;margin-bottom:16px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:13px;color:#734A29;">
              <strong style="color:#3B1B0D;">👤 Name:</strong> ${escapeHtml(name)}
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#734A29;">
              <strong style="color:#3B1B0D;">📧 Email:</strong> ${escapeHtml(email)}
            </p>
            <p style="margin:0;font-size:13px;color:#734A29;">
              <strong style="color:#3B1B0D;">🕒 Registered At:</strong> ${escapeHtml(formattedTime)} (IST)
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:#734A29;text-align:center;">
        Aap Admin Panel me jaakar sabhi registered customers dekh sakte hain.
      </p>
    `,
  });

  await transporter.sendMail({
    from: `"${getAppName()}" <${senderEmail}>`,
    to: senderEmail,
    subject: `☕ Naya User Register Hua: ${name}`,
    html,
  });
}

export async function sendOtpEmail({
  to,
  name,
  otp,
  isResend = false,
}: {
  to: string;
  name: string;
  otp: string;
  isResend?: boolean;
}) {
  if (isDevelopmentMode()) {
    console.log(`[DEV MODE] Skipping OTP email to ${to}. Use OTP: ${otp}`);
    return;
  }

  const senderEmail = process.env.MAIL_EMAIL?.trim();
  if (!senderEmail) {
    throw new Error('MAIL_EMAIL is not configured in .env');
  }

  const transporter = getTransporter();
  const digits = otp.split('');

  const otpBoxesHtml = digits
    .map(
      (d) => `
      <td style="padding:0 5px;">
        <div style="width:46px;height:54px;line-height:54px;text-align:center;background-color:#FFF9ED;border:2px solid #8C4610;border-radius:14px;font-size:26px;font-weight:900;color:#3B1B0D;font-family:monospace;">
          ${escapeHtml(d)}
        </div>
      </td>`
    )
    .join('');

  const html = wrapTapriEmailLayout({
    badgeText: isResend ? '🔁 Resend Login OTP' : '🔐 Tapri Login Verification',
    heading: isResend ? 'Aapka Naya Login OTP' : 'Chai Pe Charcha Login OTP',
    subHeading: isResend
      ? 'Aapki request par naya 4-digit OTP bheja gaya hai'
      : 'Apne account me login karne ke liye niche diya OTP use karein',
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#3B1B0D;">
        Namaste <strong>${escapeHtml(name || 'Chai Lover')}</strong> ☕,
      </p>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#6E492D;">
        ${
          isResend
            ? 'Aapne OTP resend karne ki request ki thi. Yeh raha aapka naya 4-digit verification code:'
            : 'Apne BhabhiKiChai account me login complete karne ke liye yeh 4-digit OTP enter karein:'
        }
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF2E4;border:2px dashed #D8A96A;border-radius:18px;padding:18px 12px;margin-bottom:18px;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                ${otpBoxesHtml}
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:11px;font-weight:700;color:#8C4610;">
              ⏳ Yeh OTP 10 minutes tak valid hai
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:12px;line-height:1.5;color:#734A29;text-align:center;">
        Agar aapne yeh login request nahi ki hai, toh is email ko ignore karein aur kisi ke saath OTP share na karein.
      </p>
    `,
  });

  await transporter.sendMail({
    from: `"${getAppName()}" <${senderEmail}>`,
    to,
    subject: `${isResend ? '🔁 Naya Login OTP' : '🔐 Login OTP'}: ${otp} — BhabhiKiChai`,
    html,
  });
}
