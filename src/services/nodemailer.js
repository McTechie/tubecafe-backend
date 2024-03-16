import ForgotPassword2FALinkTemplate from '../templates/ForgotPassword2FALink.js'
import nodemailer from 'nodemailer'

import Logger, { Log } from '../lib/Logger.js'

const logger = new Logger()

export const sendEmail = async (mailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    })

    await transporter.sendMail(mailOptions)
  } catch (error) {
    logger.capture(
      `Error sending email: ${error.message}`,
      Log.type.ERROR,
      Log.source.NODEMAILER,
      Log.severity.ERROR
    )
  }
}

export const sendForgotPasswordEmail = async ({ email, resetURL }) => {
  try {
    const emailHtml = ForgotPassword2FALinkTemplate(resetURL)

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'TubeCafe Account | Password Reset Token',
      html: emailHtml,
    }

    await sendEmail(mailOptions)
  } catch (error) {
    logger.capture(
      `Error sending forgot password email: ${error.message}`,
      Log.type.ERROR,
      Log.source.NODEMAILER,
      Log.severity.ERROR
    )
  }
}
