import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email send.");
    return { success: false, message: "Email service not configured" };
  }

  try {
    const response = await resend.emails.send({
      from: "Cupid <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email" };
  }
};
