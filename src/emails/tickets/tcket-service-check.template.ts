export const serviceCheckCompletedTemplate = (
  ticketId: string | null,
  userName: string | null,
  subject: string | null,
  ticketLink: string | null,
  employeeCode: string | null,
  userEmail: string | null,
  completionDate: string | null,
  completionTime: string | null,
  assets: Array<{
    name: string;
    serial1: string;
    serial2: string;
    repairCost: number | null;
    isEWaste: boolean;
    remarks: string | null;
  }> | null
) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Check Completed</title>
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
        .status-completed {
            color: #4E7549;
            background-color: #4E75491A;
        }
        .status-ewaste {
            color: #DB3027;
            background-color: #DB30271A;
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

                <!-- User Details -->
                <table width="100%" style="padding: 20px; border: 1px solid #ECFDF3; background-color: #ECFDF3; border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="font-size: 19px; font-weight: 500; color: #171718;">
                                ${userName || "N/A"}
                            </td>
                            <td style="font-size: 12px; text-align: right;">
                                <b>Completion Date:</b> <span style="color:#0D6EFD; background-color:#F5F6F8; padding: 5px 8px;">${
                                  completionDate || "N/A"
                                }</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="font-size: 11px; color: #027A48;">
                                <span style="background:#027A481A; padding:5px 10px; border-radius:4px;">Employee Code: ${
                                  employeeCode || "N/A"
                                }</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding-top: 10px;">
                                <span class="info-box"><b>Email:</b> ${
                                  userEmail || "N/A"
                                }</span>
                                <span class="info-box"><b>Completion Time:</b> ${
                                  completionTime || "N/A"
                                }</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Message -->
                <table width="100%" style="margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="font-size: 13px; font-weight: 500; color: #171718;">
                                Dear ${userName || "User"},
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size: 13px; font-weight: 400; color: #171718; padding-top: 5px;">
                                ${subject || "The service check for your ticket has been completed successfully."}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Service Details -->
                <table width="100%" style="padding: 20px; border: 1px solid #F0F9FF; background-color: #F0F9FF; border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td colspan="2" style="font-size: 19px; font-weight: 500; color: #171718;">
                                Service Details
                            </td>
                        </tr>
                        
                        ${assets && assets.length > 0 ? assets.map(asset => `
                        <tr>
                            <td style="font-size: 12px; color: #8B8B8D; width: 30%;">Product:</td>
                            <td style="font-size: 12px; color: #494D58;">${asset.name}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 12px; color: #8B8B8D;">Serial Number:</td>
                            <td style="font-size: 12px; color: #494D58;">${asset.serial1}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 12px; color: #8B8B8D;">Repair Cost:</td>
                            <td style="font-size: 12px; color: #494D58;">${asset.repairCost !== null ? `${asset.repairCost} INR` : 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 12px; color: #8B8B8D;">Status:</td>
                            <td style="font-size: 12px; color: #494D58;">
                                <span class="badge ${asset.isEWaste ? 'status-ewaste' : 'status-completed'}">
                                    ${asset.isEWaste ? 'E-Waste' : 'Service Check'}
                                </span>
                            </td>
                        </tr>
                        ${asset.remarks ? `
                        <tr>
                            <td style="font-size: 12px; color: #8B8B8D;">Remarks:</td>
                            <td style="font-size: 12px; color: #494D58;">${asset.remarks}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td colspan="2" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;"></td>
                        </tr>
                        `).join('') : `
                        <tr>
                            <td colspan="2" style="font-size: 12px; color: #494D58;">No assets were processed.</td>
                        </tr>
                        `}
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