const nodemailer = require('nodemailer')

// Create transporter based on env variables
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    })
  }
  return transporter
}

/**
 * Send an email notification.
 * @param {Object} options - { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const t = getTransporter()
    const from = process.env.SMTP_FROM || 'Buylence <notifications@buylence.com>'

    if (t) {
      const info = await t.sendMail({ from, to, subject, html, text })
      console.log(`✉️ Email sent to ${to}: ${subject} (ID: ${info.messageId})`)
      return { success: true, messageId: info.messageId }
    } else {
      // Mock / fallback mode for development
      console.log(`[EMAIL SERVICE LOG] To: ${to} | Subject: ${subject}`)
      console.log(`[EMAIL BODY]: ${text || html?.replace(/<[^>]+>/g, '')}`)
      return { success: true, mocked: true }
    }
  } catch (err) {
    console.error('❌ Failed to send email:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Send Order Status Update Email
 */
async function sendOrderStatusEmail(to, orderNumber, statusMessage, detailsLink) {
  const subject = `Order #${orderNumber} Update - Buylence`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A; max-width: 600px; margin: 0 auto; border: 1px solid #E4DDD3; border-radius: 8px;">
      <h2 style="color: #BE6B1A; margin-top: 0;">Buylence Order Update</h2>
      <p>Hello,</p>
      <p>Your order <strong>#${orderNumber}</strong> status has been updated:</p>
      <div style="background-color: #F7F4EF; padding: 16px; borderRadius: 6px; margin: 16px 0; font-weight: bold;">
        ${statusMessage}
      </div>
      <p>Track your order or view details below:</p>
      <a href="${detailsLink || 'http://localhost:5173/orders'}" style="display: inline-block; background-color: #BE6B1A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #E4DDD3;" />
      <p style="font-size: 12px; color: #888;">Buylence — Campus marketplace for OAU students.</p>
    </div>
  `
  return sendEmail({ to, subject, html, text: `Order #${orderNumber}: ${statusMessage}` })
}

/**
 * Send Preference Confirmation Email
 */
async function sendPreferencesUpdatedEmail(to, preferences) {
  const subject = `Notification Preferences Updated - Buylence`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A; max-width: 600px; margin: 0 auto; border: 1px solid #E4DDD3; border-radius: 8px;">
      <h2 style="color: #BE6B1A; margin-top: 0;">Notification Settings Saved</h2>
      <p>Your notification preferences have been successfully updated:</p>
      <ul>
        <li><strong>Order Updates:</strong> ${preferences.orderUpdates ? 'Enabled' : 'Disabled'}</li>
        <li><strong>Flash Deals:</strong> ${preferences.flashDeals ? 'Enabled' : 'Disabled'}</li>
        <li><strong>Vendor Messages:</strong> ${preferences.vendorMessages ? 'Enabled' : 'Disabled'}</li>
        <li><strong>Weekly Digest:</strong> ${preferences.weeklyDigest ? 'Enabled' : 'Disabled'}</li>
        <li><strong>Marketing Emails:</strong> ${preferences.marketingEmails ? 'Enabled' : 'Disabled'}</li>
      </ul>
      <p style="font-size: 12px; color: #888;">If you did not make this change, please log in to your Buylence account to review your settings.</p>
    </div>
  `
  return sendEmail({ to, subject, html, text: 'Your notification preferences on Buylence have been updated.' })
}

module.exports = {
  sendEmail,
  sendOrderStatusEmail,
  sendPreferencesUpdatedEmail,
}
