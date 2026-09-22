/**
 * Transactional SendGrid helpers for Life Scale.
 * Credentials welcome is for funnel auto-created Cognito users (no auth-gate signup).
 */

function loginBaseUrl(): string {
  const fromEnv = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const stage = process.env.STAGE || process.env.NODE_ENV;
  if (stage === "prod" || stage === "production") {
    return "https://life-scale.com";
  }
  return "https://dev.life-scale.com";
}

export function authGateLoginUrl(): string {
  return `${loginBaseUrl()}/auth-gate`;
}

/** Life Scale cobalt ≈ hsl(218 85% 45%). */
const CTA_BG = "#1170d4";
const LINK_COLOR = "#0b5bb5";

/**
 * Email login credentials after webhook auto-creates a Cognito user.
 * Throws if SendGrid is not configured or the send fails.
 */
export async function sendWelcomePasswordEmail(
  to: string,
  password: string,
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("SendGrid is not configured");
  }

  const loginUrl = authGateLoginUrl();
  const subject = "Your Life Scale Account is Ready";
  const textBody =
    `Welcome to Life Scale!\n\n` +
    `Your account has been created. Here are your login details:\n\n` +
    `Email: ${to}\n` +
    `Password: ${password}\n\n` +
    `Log in at ${loginUrl}\n\n` +
    `You can log in at any time to access your dashboard, reports, and scales.\n\n` +
    `We recommend changing your password in your profile settings after logging in.\n\n` +
    `— The Life Scale Team`;
  const htmlBody =
    `<h2>Welcome to Life Scale!</h2>` +
    `<p>Your account has been created. Here are your login details:</p>` +
    `<p><strong>Email:</strong> ${to}<br/><strong>Password:</strong> ${password}</p>` +
    `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0; border-collapse:collapse;">` +
    `<tr><td align="center" bgcolor="${CTA_BG}" style="border-radius:4px; background:${CTA_BG};">` +
    `<a href="${loginUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; line-height:18px; text-decoration:none;">Log in to Life Scale</a>` +
    `</td></tr></table>` +
    `<p>You can log in at any time at <a href="${loginUrl}" style="color:${LINK_COLOR}; text-decoration:underline;">${loginUrl}</a> to access your dashboard, reports, and scales.</p>` +
    `<p style="color:#888;font-size:13px;">We recommend changing your password in your profile settings after logging in.</p>` +
    `<p>— The Life Scale Team</p>`;

  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(apiKey);
  await sgMail.default.send({
    to,
    from,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
