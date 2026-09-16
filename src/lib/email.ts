interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export function getAppUrl(req: Request): string {
  return (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("ელფოსტის სერვისი კონფიგურირებული არ არის");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("Email provider error", response.status, details);
    throw new Error("ელფოსტის გაგზავნა ვერ მოხერხდა");
  }
}

export function actionEmailHtml(title: string, description: string, link: string, button: string): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#182033;max-width:600px;margin:auto">
      <h2>${title}</h2>
      <p>${description}</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#C9A24B;color:#182033;text-decoration:none;border-radius:8px">${button}</a></p>
      <p style="font-size:12px;color:#667085">თუ ეს მოთხოვნა თქვენ არ გაგიკეთებიათ, უბრალოდ უგულებელყავით ეს წერილი.</p>
    </div>`;
}
