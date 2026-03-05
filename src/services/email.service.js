const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error(" Email service error:", error.message);
  } else {
    console.log(" Email service ready");
  }
});

/**
 * Generate beautiful HTML email for monthly carbon report
 */
const generateReportHTML = (business, reportData) => {
  const { month, year, totalCO2, byScope, byCategory, scoreData } = reportData;

  const monthName = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Score color based on performance
  const scoreColor =
    scoreData.score >= 75
      ? "#22c55e"
      : scoreData.score >= 50
        ? "#f59e0b"
        : scoreData.score >= 25
          ? "#f97316"
          : "#ef4444";

  // Build category rows
  const categoryRows = Object.entries(byCategory)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(
      ([name, data]) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${name}</td>
        <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:center;">
          <span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:12px;font-size:12px;">
            Scope ${data.scope}
          </span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:right;">
          ${data.total.toFixed(2)} kg CO₂
        </td>
        <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:right;">
          ${data.percentage}%
        </td>
      </tr>
    `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Carbon Report - ${monthName}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#065f46,#059669);padding:40px 20px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;"> Carbon Footprint Report</h1>
        <p style="color:#a7f3d0;margin:8px 0 0;">${business.name} — ${monthName}</p>
      </div>

      <div style="max-width:600px;margin:0 auto;padding:20px;">

        <!-- Score Card -->
        <div style="background:white;border-radius:12px;padding:30px;margin:20px 0;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <p style="color:#64748b;margin:0 0 10px;font-size:14px;">CARBON INTENSITY SCORE</p>
          <div style="font-size:72px;font-weight:bold;color:${scoreColor};">
            ${scoreData.score}
          </div>
          <div style="display:inline-block;background:${scoreColor};color:white;padding:4px 16px;border-radius:20px;font-size:14px;margin:8px 0;">
            ${scoreData.performanceLabel}
          </div>
          <p style="color:#64748b;margin:12px 0 0;font-size:14px;">
            ${scoreData.interpretation}
          </p>
        </div>

        <!-- Total Emissions -->
        <div style="background:white;border-radius:12px;padding:24px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color:#1e293b;margin:0 0 20px;font-size:18px;">📊 Emissions Summary</h2>
          <div style="display:flex;gap:12px;justify-content:space-between;">

            <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:bold;color:#166534;">
                ${totalCO2.toFixed(2)}
              </div>
              <div style="font-size:12px;color:#166534;margin-top:4px;">Total kg CO₂</div>
            </div>

            <div style="flex:1;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:bold;color:#92400e;">
                ${byScope.scope1.toFixed(2)}
              </div>
              <div style="font-size:12px;color:#92400e;margin-top:4px;">Scope 1 (Direct)</div>
            </div>

            <div style="flex:1;background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:bold;color:#1e40af;">
                ${byScope.scope2.toFixed(2)}
              </div>
              <div style="font-size:12px;color:#1e40af;margin-top:4px;">Scope 2 (Energy)</div>
            </div>

            <div style="flex:1;background:#fdf4ff;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:bold;color:#6b21a8;">
                ${byScope.scope3.toFixed(2)}
              </div>
              <div style="font-size:12px;color:#6b21a8;margin-top:4px;">Scope 3 (Value Chain)</div>
            </div>

          </div>
        </div>

        <!-- Benchmark Comparison -->
        <div style="background:white;border-radius:12px;padding:24px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;">🏭 Industry Benchmark</h2>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;">Your emissions</span>
              <span style="font-weight:bold;color:#1e293b;">${totalCO2.toFixed(2)} kg CO₂</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#64748b;">Industry average (${business.industry})</span>
              <span style="font-weight:bold;color:#1e293b;">${scoreData.benchmarkCO2} kg CO₂</span>
            </div>
            <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
              <div style="background:${scoreColor};height:100%;width:${Math.min(scoreData.percentageVsBenchmark, 100)}%;"></div>
            </div>
            <p style="color:#64748b;font-size:13px;margin:10px 0 0;">
              You are at <strong>${scoreData.percentageVsBenchmark}%</strong> of your industry average
            </p>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div style="background:white;border-radius:12px;padding:24px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;">📋 Category Breakdown</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px;text-align:left;color:#64748b;font-size:13px;">Category</th>
                <th style="padding:10px;text-align:center;color:#64748b;font-size:13px;">Scope</th>
                <th style="padding:10px;text-align:right;color:#64748b;font-size:13px;">CO₂</th>
                <th style="padding:10px;text-align:right;color:#64748b;font-size:13px;">Share</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">
          <p>Generated by Carbon Footprint Tracker API</p>
          <p>Emission factors sourced from IPCC 2023, EPA 2023, GHG Protocol 2023</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Send monthly carbon report email
 */
const sendMonthlyReport = async ({ to, business, reportData }) => {
  const monthName = new Date(
    reportData.year,
    reportData.month - 1,
  ).toLocaleString("default", { month: "long", year: "numeric" });

  const html = generateReportHTML(business, reportData);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `${business.name} — Carbon Report for ${monthName}`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(` Email sent to ${to}: ${info.messageId}`);
  return info;
};

/**
 * Send a simple notification email
 */
const sendNotification = async ({ to, subject, message }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#065f46;"> Carbon Tracker Notification</h2>
        <p>${message}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;">Carbon Footprint Tracker API</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = { sendMonthlyReport, sendNotification };
