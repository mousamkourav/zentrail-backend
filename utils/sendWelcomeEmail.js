// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// const sendWelcomeEmail = async (to, panel) => {
//   const panelName = capitalize(panel);

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject: `Welcome to Our ${panelName} Newsletter!`,
//     html: `
//       <div style="font-family: Arial; padding: 20px;">
//         <h2>Welcome to ${panelName}!</h2>
//         <p>Thank you for subscribing to our <strong>${panelName}</strong> newsletter.</p>
//         <p>You’ll now receive the latest updates and news from us.</p>
//       </div>
//     `
//   };

//   return transporter.sendMail(mailOptions);
// };

// module.exports = sendWelcomeEmail;


// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");

// const {
//   EMAIL_USER,
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
//   GOOGLE_REFRESH_TOKEN,
// } = process.env;

// const oAuth2Client = new google.auth.OAuth2(
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
 
// );

// oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// async function sendWelcomeEmail(to, panel) {
//   try {
//     const accessTokenResponse = await oAuth2Client.getAccessToken();
//     const accessToken = accessTokenResponse?.token || accessTokenResponse;

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         type: "OAuth2",
//         user: EMAIL_USER,
//         clientId: GOOGLE_CLIENT_ID,
//         clientSecret: GOOGLE_CLIENT_SECRET,
//         refreshToken: GOOGLE_REFRESH_TOKEN,
//         accessToken,
//       },
//     });

//     const panelName = capitalize(panel);

//     const mailOptions = {
//       from: `Your App <${EMAIL_USER}>`,
//       to,
//       subject: `Welcome to Our ${panelName} Newsletter!`,
//       html: `
//         <div style="font-family: Arial; padding: 20px;">
//           <h2>Welcome to ${panelName}!</h2>
//           <p>Thank you for subscribing to our <strong>${panelName}</strong> newsletter.</p>
//           <p>You’ll now receive the latest updates and news from us.</p>
//         </div>
//       `,
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log("Email sent:", result.messageId);
//     return result;
//   } catch (error) {
//     console.error("Error sending welcome email:", error);
//     throw error;
//   }
// }

// module.exports = sendWelcomeEmail;
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const {
  EMAIL_USER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
 
);

oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });


const panelConfig = {
  travel: {
    name: "Zentrail",
    website: "https://www.zentrail.in/",
  },
  event: {
    name: "Poornam Events",
    website: "https://www.poornamevents.com/",
  },
  vyomedge_uk: {
    name: "VyomEdge UK",
    website: "https://admin.vyomedge.com",
  },
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

async function sendWelcomeEmail(to, panel) {
  try {
   
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || accessTokenResponse;

   
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken,
      },
    });

   
    const panelInfo = panelConfig[panel] || {
      name: capitalize(panel),
      website: "https://admin.vyomedge.com",
    };

    const mailOptions = {
      from: `${panelInfo.name} <${EMAIL_USER}>`,
      to,
      subject: `🎉 Welcome to ${panelInfo.name}!`,
      html: `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #0d47a1; padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to ${panelInfo.name}</h1>
          </div>

          <div style="padding: 30px; color: #333;">
            <h2 style="margin-top: 0;">Hello 👋</h2>
            <p>Thank you for subscribing to <strong>${panelInfo.name}</strong>'s newsletter.</p>
            <p>You're now part of our exclusive community where we share the latest updates, special offers, and insights straight from our team.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${panelInfo.website}" style="background-color: #0d47a1; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Visit Website</a>
            </div>

            <p>If you have any questions, feel free to reply to this email — we’re always here to help.</p>
            <p>Warm regards,<br>The ${panelInfo.name} Team</p>
          </div>

          <div style="background-color: #f5f5f5; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} ${panelInfo.name}. All rights reserved.<br>
            <a href="${panelInfo.website}/unsubscribe" style="color: #888;">Unsubscribe</a>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log("✅ Email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    throw error;
  }
}

module.exports = sendWelcomeEmail;
