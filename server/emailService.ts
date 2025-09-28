import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service for My Clinic Portal
 * 
 * Features:
 * - Patient notification emails to doctors when patients are added/updated
 * - Automatic notifications to all doctors with emailNotifications=true
 * - Temporary password emails for new users
 * - Graceful handling when EMAIL_USER/EMAIL_PASS are not configured
 * 
 * Environment Variables Required:
 * - EMAIL_USER: Gmail address for sending emails
 * - EMAIL_PASS: Gmail app password (not regular password)
 * 
 * Usage:
 * - Doctors receive notifications when:
 *   1. New patients are added to the system
 *   2. Existing patients are updated
 * - Only active doctors with emailNotifications=true receive emails
 * - Email failures don't block patient creation/updates
 */

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("Email credentials not set. Email notifications will be disabled.");
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email service not configured. Skipping email:", params.subject);
      return false;
    }

    try {
      await transporter.sendMail({
        to: params.to,
  from: params.from || process.env.EMAIL_USER || 'noreply@clinic.com',
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
      });
      console.log(`Email sent successfully to ${params.to}: ${params.subject}`);
      return true;
    } catch (error) {
      console.error('Gmail SMTP email error:', error);
      return false;
    }
  }

  async sendPatientNotification(
    doctorEmail: string,
    patientName: string,
    action: 'added' | 'updated',
    viewLink: string
  ): Promise<boolean> {
    const subject = `Patient ${action === 'added' ? 'Added' : 'Updated'}: ${patientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">My Clinic Portal Notification</h2>
        <p>Hello Doctor,</p>
        <p>Patient <strong>${patientName}</strong> has been ${action} in the clinic portal.</p>
        <p>
          <a href="${viewLink}" 
             style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Patient Details
          </a>
        </p>
        <p>Best regards,<br>My Clinic Portal Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: doctorEmail,
  from: process.env.EMAIL_USER || 'noreply@clinic.com',
      subject,
      html,
    });
  }

  async sendTemporaryPassword(
    userEmail: string,
    userName: string,
    tempPassword: string
  ): Promise<boolean> {
    const subject = 'Welcome to My Clinic Portal - Your Temporary Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to My Clinic Portal</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 3px;">${tempPassword}</code></p>
        </div>
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
             style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Login to Portal
          </a>
        </p>
        <p>Best regards,<br>My Clinic Portal Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
  from: process.env.EMAIL_USER || 'noreply@clinic.com',
      subject,
      html,
    });
  }
}

export const emailService = EmailService.getInstance();
