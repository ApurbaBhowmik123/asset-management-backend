export const ticketAutoClosedTemplate = (
  ticketId: string | null,
  userName: string | null,
  subject: string | null,
  ticketLink: string | null,
  remarks: string | null
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ticket Closed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    body {
      font-family: "Inter", sans-serif;
      width: 100%;
      margin: 0 auto;
    }
    .info-box {
      background: #F5F6F8;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
      font-size: 11px;
      line-height: 15px;
      margin: 3px 5px 3px 0;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0D6EFD;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>

<body>
  <table width="100%" style="padding: 20px 30px;">
    <tbody>
      <tr>
        <td>
          <!-- Header -->
          <table width="100%" style="margin-bottom: 20px;">
            <tbody>
              <tr>
                <th style="font-size: 11px; font-weight: 500; color: #4E7549; text-align: left;">
                  Ticket ID: ${ticketId || "N/A"}
                </th>
              </tr>
            </tbody>
          </table>

          <!-- Ticket Info -->
          <table width="100%" style="padding: 20px; border: 1px solid #FFE9D3; background-color: #FFE9D3; border-radius: 6px; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 19px; font-weight: 500; color: #171718;">
                  Hello ${userName || "User"},
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; padding-top: 10px; color: #171718;">
                  We want to inform you that your ticket has been <b style="color:#DB3027;">closed automatically</b> after 5 days of inactivity.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 12px; color:#494D58;">
                  <span class="info-box"><b>Subject:</b> ${subject || "N/A"}</span>
                  <span class="info-box"><b>Status:</b> Closed</span>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 12px; color:#8B8B8D;">
                  Remarks: ${remarks || "Ticket automatically closed after 5 days of inactivity"}
                </td>
              </tr>
            
            </tbody>
          </table>

          <!-- Footer -->
          <table width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <tbody>
              <tr>
                <td style="text-align: center; font-size: 11px; color: #666;">
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;
