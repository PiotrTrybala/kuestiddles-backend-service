import { MAILGUN_API_KEY, MAILGUN_DOMAIN } from "@/env";

export async function sendEmail(from: string, to: string, subject: string, messageInHTML: string) {

    const form = new URLSearchParams({
        from,
        to,
        subject,
        html: messageInHTML,
    });

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa(`api:${MAILGUN_API_KEY}`),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
    });

    if (!response.ok) {
        console.error('mailgun email error:', await response.text());
        throw new Error("failed to send email message");
    }

}

export async function sendAccountVerificationEmail(to: string, url: string) {
    try {
        await sendEmail(
            `Kuestiddles <mailgun@${MAILGUN_DOMAIN}>`,
            to,
            "Verify your account",
            `
            <h2>Verify your account</h2>
            <p>Click below to verify:</p>
            <a href="${url}">${url}</a>
        `
        );

    } catch(error) {
        console.error(error);
    }
}

export async function sendAccountResetPasswordEmail(to: string, url: string) {
    try {
        await sendEmail(
            `Kuestiddles <mailgun@${MAILGUN_DOMAIN}>`,
            to,
            `Reset password`,
            `
                <h2>Reset password</h1>
                <p>Click below to change your password</p>
                <a href="${url}">${url}</a>
            
            `
        )
    } catch(error) {
        console.log(error);
    }
}