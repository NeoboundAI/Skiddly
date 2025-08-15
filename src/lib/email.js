import nodemailer from "nodemailer";

// It's generally fine, but here are some improvements for production use:
// - Don't log sensitive info
// - Consider using environment variables for all config, not just Gmail
// - Handle transporter errors on creation
// - Use async/await properly

// Create transporter (Gmail example, but could be any SMTP)
const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: "pubgid9021@gmail.com",
    pass: "sanjeev9021",
  },
});

// Optionally verify transporter at startup (optional, but good for debugging)
// transporter.verify().then(() => console.log("Email transporter ready")).catch(console.error);

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: "pubgid9021@gmail.com",
      to,
      subject,
      text,
      html,
    });
    // Avoid logging sensitive info in production
    if (process.env.NODE_ENV !== "production") {
      console.log("Email sent:", info.messageId);
    }
    return info;
  } catch (error) {
    // Log error, but don't leak sensitive info
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

export const generateOTP = () => {
  // Generates a 6-digit numeric OTP as a string
  return Math.floor(100000 + Math.random() * 900000).toString();
};
