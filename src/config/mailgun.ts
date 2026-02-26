
export async function sendMessage(from: string, to: string, subject: string, html: string) {
    const domain = process.env.MAILGUN_DOMAIN!;
    const apiKey = process.env.MAILGUN_API_KEY!;

    const form = new URLSearchParams({ from, to, subject, html });

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
            'Authorization': "Basic " + btoa(`api:${apiKey}`),
            'Content-Type': "application/x-www-form-urlencoded",
        },
        body: form.toString(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Mailgun error:", error);
        throw new Error("Failed to send email message");
    }
};

export async function sendVerificationEmail(to: string, verificationUrl: string) {
    const domain = process.env.MAILGUN_DOMAIN!;
    try {
        await sendMessage(
            `Kuestiddles <mailgun@${domain}>`,
            to,
            "Verify your account",
            `
            <h2>Verify your account</h2>
            <p>Click below to verify:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
        `
        );
    } catch(error) {
        console.log("Failed to send verification email");
    }
};

export async function sendResetPasswordEmail(to: string, resetURL: string) {
    const domain = process.env.MAILGUN_DOMAIN!;

    try {
        await sendMessage(
            `Kuestiddles <mailgun@${domain}>`,
            to,
            `Reset password`,
            `
                <h2>Reset password</h1>
                <p>Click below to change your password</p>
                <a href="${resetURL}">${resetURL}</a>
            
            `
        )
    } catch(error) {
        console.log("Failed to send reset password email");
    }
}