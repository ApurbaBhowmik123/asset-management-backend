export const ticketClosedTemplate = (
  ticketId: string | null,
  subject: string | null,
  recipientName: string | null,
  closerName: string | null,
  closerEmail: string | null,
  closeDate: string | null,
  closeTime: string | null,
  review: string | null,
  ratings: number | null
) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    .closed-box {
      background: #FEF3F2;
      border: 1px solid #FECDCA;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 13px;
      color: #B42318;
    }
    .ratings-box {
      background: #FFFAEB;
      border: 1px solid #FEDF89;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 13px;
      color: #B54708;
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
                <th style="font-size: 11px; font-weight: 500; color: #B42318; text-align: left;">
                  Ticket ID: ${ticketId || "N/A"}
                </th>
              </tr>
            </tbody>
          </table>

          <!-- Closure Details -->
          <table width="100%" style="padding: 20px; border: 1px solid #FEF3F2; background-color: #FEF3F2; border-radius: 6px; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 19px; font-weight: 500; color: #171718;">
                  ${recipientName || "N/A"}
                </td>
                <td style="font-size: 12px; text-align: right;">
                  <b>Closed Date:</b> <span style="color:#0D6EFD; background-color:#F5F6F8; padding: 5px 8px;">
                    ${closeDate || "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 11px; color: #B42318;">
                  <span style="background:#FEF3F2; padding:5px 10px; border-radius:4px;">
                    Closed By: ${closerName || "N/A"} (${closerEmail || "N/A"})
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 10px;">
                  <span class="info-box"><b>Subject:</b> ${subject || "N/A"}</span>
                  <span class="info-box"><b>Closed Time:</b> ${closeTime || "N/A"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Ratings -->
          <table width="100%" style="margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 13px; font-weight: 500; color: #171718;">
                  Ratings
                </td>
              </tr>
              <tr>
                <td>
                  <div class="ratings-box">
                    ${ratings ? `${ratings}/5` : "No ratings provided"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Review -->
          <table width="100%" style="margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 13px; font-weight: 500; color: #171718;">
                  Review
                </td>
              </tr>
              <tr>
                <td>
                  <div class="closed-box">
                    ${review || "No review provided"}
                  </div>
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
