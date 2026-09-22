import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load only the script-scoped env file (matches the plan and keeps secrets out of root `.env`).
dotenv.config({ path: path.join(__dirname, '.env') });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `SENDGRID_API_KEY` in `scripts/.env`.');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const FROM = 'admin@mytrueiq.online';
const TO = 'juan.cambronero@toptal.com';

async function main(): Promise<void> {
  const msg = {
    from: FROM,
    to: TO,
    subject: 'SendGrid test email',
    text: `Hello! This is a test email sent via Twilio SendGrid from the logic-leap-system scripts.`,
    html: `<p>Hello! This is a test email sent via Twilio SendGrid from the logic-leap-system scripts.</p>`,
  };

  const [response] = await sgMail.send(msg);
  // eslint-disable-next-line no-console
  console.log('SendGrid email response status:', response?.statusCode);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to send email via SendGrid:', err);
  process.exit(1);
});

