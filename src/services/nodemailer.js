import ForgotPasswordTemplate from '../templates/ForgotPassword.js'

import nodemailer from 'nodemailer'
import Logger, { Log } from '../lib/Logger.js'

const logger = new Logger()

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    })

    const emailHtml = ForgotPasswordTemplate(options.resetToken)

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: options.email,
      subject: options.subject,
      html: emailHtml,
    }

    const res = await transporter.sendMail(mailOptions)

    if (res.accepted.length > 0) {
      logger.capture(
        `Email sent to: ${options.email}`,
        Log.type.DEBUG,
        Log.source.NODEMAILER,
        Log.severity.DEBUG
      )
    } else {
      throw new Error(
        'Something went wrong with sending the email. Please try again later.'
      )
    }
  } catch (error) {
    logger.capture(
      `Error sending email: ${error.message}`,
      Log.type.ERROR,
      Log.source.NODEMAILER,
      Log.severity.ERROR
    )
  }
}

export { sendEmail }
