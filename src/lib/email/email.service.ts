import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import React from "react";
import { TeamApprovalEmail } from "./templates/team-approval";
import { TeamRegistrationEmail } from "./templates/team-registration";
import { TeamRejectionEmail } from "./templates/team-rejection";

// SMTP Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.freesmtpservers.com";
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "25", 10);
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "ensemble@aexp.com";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Ensemble";

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // Port 25 typically doesn't use TLS
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates on free SMTP
  },
});

export async function sendTeamRegistrationEmail(options: {
  to: string;
  teamName: string;
  contactName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, teamName, contactName } = options;

  const subject = `Team Registration Request Received - ${teamName}`;

  try {
    const htmlContent = await render(
      React.createElement(TeamRegistrationEmail, {
        contactName,
        teamName,
      })
    );

    const textContent = `
Team Registration Request Received

Dear ${contactName},

Thank you for submitting your team registration request. We have received your application and it is currently being reviewed.

Registration Details:
- Team Name: ${teamName}
- Submission Date: ${new Date().toLocaleString()}

You will receive another email once your team registration has been approved. If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
The Ensemble Team
    `;

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(
      `[Email] Team registration confirmation sent to ${to}, MessageID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Email] Failed to send team registration email to ${to}:`,
      error
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a simple test email (can be used for debugging)
 */
export async function sendTestEmail(
  to: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject: "SMTP Test - Ensemble",
      text: "This is a test email to verify SMTP configuration is working correctly.",
      html: "<p>This is a test email to verify SMTP configuration is working correctly.</p>",
    });

    console.log(
      `[Email] Test email sent to ${to}, MessageID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Failed to send test email to ${to}:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send an email when a team registration request is approved
 */
export async function sendTeamApprovalEmail(options: {
  to: string;
  teamName: string;
  contactName: string;
  reviewedBy: string;
  comments?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, teamName, contactName, reviewedBy, comments } = options;

  const subject = `✅ Team Registration Approved - ${teamName}`;

  try {
    const htmlContent = await render(
      React.createElement(TeamApprovalEmail, {
        contactName,
        teamName,
        reviewedBy,
        comments,
      })
    );

    const textContent = `
Team Registration Approved - ${teamName}

Dear ${contactName},

Great news! Your team registration request has been approved.

Approved Details:
- Team Name: ${teamName}
- Approved By: ${reviewedBy}
- Approved On: ${new Date().toLocaleString()}
${comments ? `- Comments: ${comments}` : ""}

You can now start using the Ensemble platform with your team.

Best regards,
The Ensemble Team
    `;

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(
      `[Email] Team approval email sent to ${to}, MessageID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Failed to send approval email to ${to}:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send an email when a team registration request is rejected
 */
export async function sendTeamRejectionEmail(options: {
  to: string;
  teamName: string;
  contactName: string;
  reviewedBy: string;
  comments?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, teamName, contactName, reviewedBy, comments } = options;

  const subject = `❌ Team Registration Not Approved - ${teamName}`;

  try {
    const htmlContent = await render(
      React.createElement(TeamRejectionEmail, {
        contactName,
        teamName,
        reviewedBy,
        comments,
      })
    );

    const textContent = `
Team Registration Not Approved - ${teamName}

Dear ${contactName},

Thank you for your interest in Ensemble. Unfortunately, your team registration request has not been approved at this time.

Request Details:
- Team Name: ${teamName}
- Reviewed By: ${reviewedBy}
- Reviewed On: ${new Date().toLocaleString()}
${comments ? `- Reason: ${comments}` : ""}

If you have any questions, please reach out to the administrators.

Best regards,
The Ensemble Team
    `;

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(
      `[Email] Team rejection email sent to ${to}, MessageID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Failed to send rejection email to ${to}:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
