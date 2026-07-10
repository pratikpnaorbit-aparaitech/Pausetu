const nodemailer = require('nodemailer');
const https = require('https');

// Native HTTP Helpers
function getJson(url, headers) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      method: 'GET',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(parsedData.message || `HTTP Error ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyStr = JSON.stringify(body);
    const options = {
      method: 'POST',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(parsedData.message || `HTTP Error ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(bodyStr);
    req.end();
  });
}

class BrevoHTTPTransport {
  constructor(options) {
    this.name = 'BrevoHTTP';
    this.version = '1.0.0';
    this.apiKey = options.apiKey;
  }

  send(mail, callback) {
    const envelope = mail.data;
    const toAddresses = Array.isArray(envelope.to) ? envelope.to : [envelope.to];
    const to = toAddresses.map(addr => {
      if (typeof addr === 'string') {
        return { email: addr };
      }
      return { name: addr.name, email: addr.address };
    });

    let fName = emailConfig.fromName;
    let fEmail = emailConfig.fromEmail;
    if (envelope.from) {
      const match = envelope.from.match(/^"?(.*?)"?\s*<(.*?)>$/);
      if (match) {
        fName = match[1];
        fEmail = match[2];
      } else {
        fEmail = envelope.from;
      }
    }

    const payload = {
      sender: { name: fName, email: fEmail },
      to: to,
      subject: envelope.subject,
      htmlContent: envelope.html,
      textContent: envelope.text
    };

    postJson('https://api.brevo.com/v3/smtp/email', { 'api-key': this.apiKey }, payload)
      .then(data => {
        callback(null, { messageId: data.messageId });
      })
      .catch(err => {
        callback(err);
      });
  }

  verify(callback) {
    const promise = getJson('https://api.brevo.com/v3/account', { 'api-key': this.apiKey });

    if (typeof callback === 'function') {
      promise
        .then(() => callback(null, true))
        .catch(err => callback(err));
    } else {
      return promise.then(() => true);
    }
  }
}

const emailConfig = {
  appName: process.env.APP_NAME || 'PashuSetu',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.MAIL_FROM_EMAIL || '',
  fromEmail: process.env.MAIL_FROM_EMAIL || process.env.BREVO_SMTP_USER || 'no-reply@pashusetu.com',
  fromName: process.env.MAIL_FROM_NAME || 'PashuSetu',
  smtp: {
    host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587),
    user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '',
    pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || process.env.SMTP_PASS || '',
  }
};

const isSmtpConfigured = Boolean(
  emailConfig.smtp.user && emailConfig.smtp.pass
);

const smtpTransporter = isSmtpConfigured
  ? nodemailer.createTransport(new BrevoHTTPTransport({ apiKey: emailConfig.smtp.pass }))
  : null;

if (smtpTransporter) {
  smtpTransporter.verify((error, success) => {
    if (error) {
      console.error('[SMTP Error] Connection verification failed:', error.message);
    } else {
      console.log('SMTP Connected Successfully');
    }
  });
}

module.exports = {
  emailConfig,
  isSmtpConfigured,
  smtpTransporter
};
