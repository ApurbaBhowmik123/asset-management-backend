export const ticketAssignedTemplate = (
  ticketId: string | null,
  subject: string | null,
  engineerName: string | null,
  raisedBy: string | null,
  priority: string | null,
  assignmentDate: string | null,
  assignmentTime: string | null,
  remarks: string | null,
  ticketLink: string | null
) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Assigned</title>
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
    .badge {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 11px;
    }
    .priority-high {
      color: #DB3027;
      background-color: #DB30271A;
    }
    .priority-medium {
      color: #F2994A;
      background-color: #F2994A1A;
    }
    .priority-low {
      color: #4E7549;
      background-color: #4E75491A;
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
              <tr>
                <th style="font-size: 15px; font-weight: 500; color: #171718; text-align: left;">
                  Support Engineer Assigned
                </th>
              </tr>
            </tbody>
          </table>

          <!-- Assigned Details -->
          <table width="100%" style="padding: 20px; border: 1px solid #FFE9D3; background-color: #FFE9D3; border-radius: 6px; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 19px; font-weight: 500; color: #171718;">
                  ${engineerName || "N/A"}
                </td>
                <td style="font-size: 12px; text-align: right;">
                  <b>Assigned Date:</b> <span style="color:#0D6EFD; background-color:#F5F6F8; padding: 5px 8px;">
                    ${assignmentDate || "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 11px; color: #DB3027;">
                  <span style="background:#DB30271A; padding:5px 10px; border-radius:4px;">
                    Raised By: ${raisedBy || "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 10px;">
                  <span class="info-box"><b>Time:</b> ${assignmentTime || "N/A"}</span>
                  <span class="info-box"><b>Priority:</b> 
                    <span class="badge priority-${priority ? priority.toLowerCase() : "low"}">
                      ${priority || "N/A"}
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Subject -->
          <table width="100%" style="margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 13px; font-weight: 500; color: #171718;">
                  Dear ${engineerName || "Engineer"},
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; font-weight: 400; color: #171718; padding-top: 5px;">
                  You have been assigned to a new ticket:
                  <br><b>${subject || "N/A"}</b>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Remarks -->
          <table width="100%" style="padding: 20px; border: 1px solid #FFF5F0; background-color: #FFF5F0; border-radius: 6px; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="font-size: 19px; font-weight: 500; color: #171718;">
                  Remarks
                </td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #494D58; padding-top: 10px;">
                  ${remarks || "No remarks provided"}
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
