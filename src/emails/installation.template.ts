export const installationEmail = async (
  productId: string,
  status: string,
  grId: string,
  grDate: string,
  serialNo: string,
  productName: string,
  brand: string,
  category: string,
  installationSpecification: any
) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installation Details</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

        body {
            font-family: "Inter", sans-serif;
            width: 100%;
            margin: 0 auto;
        }
        
    </style>
</head>

<table width="100%" style="padding: 20px 30px;">
    <tbody>
        <tr>
            <td>
                <table width="100%" style="margin-bottom: 20px;">
                    <thead>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 11px; line-height: 15px; font-weight: 500; color: #4E7549; text-align: left;">
                                Product ID: ${productId}</th>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 15px; line-height: 19px; font-weight: 500; color: #171718; text-align: left;">
                               Installation Details
                            </th>
                        </tr>
                    </thead>
                </table>
                <table width="100%"
                    style="padding: 24px 20px; border: 1px solid #FFE9D3; background-color: #FFE9D3;  border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 19px; line-height: 23px; font-weight: 500; color: #171718; text-align: left; margin-bottom: 5px;">
                                Current Installation Information</td>
                            <td colspan="2"
                                style="font-size: 12px; line-height: 15px; font-weight: 500; color: #000000; text-align: right;">
                                Status : 
                                <span style="background: #F5F8F5; color: #2C932C; padding: 5px 8px; border-radius: 4px; font-size: 11px; font-weight: 400; margin-left: 10px; display: inline-block;">${status}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 5px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #DB3027; text-align: left;">
                                <span style="background: #DB30271A; padding: 5px 10px; border-radius: 4px;">GR ID:
                                     ${grId}</span>
                            </td>
                            <td colspan="2"></td>
                        </tr>
                        <tr>
                            <td style="height: 20px;"></td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left;  display: inline-block; padding: 5px 8px;">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>Product ID: </b> &nbsp;  ${productId}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left;  display: inline-block; padding: 5px 8px;">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>GR Date: </b> &nbsp;  ${grDate}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left;  display: inline-block; padding: 5px 8px;">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>Serial Numbers:</b> &nbsp;   ${serialNo}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; display: inline-block; padding: 5px 8px; ">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>Product Name: </b> &nbsp;  ${productName}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; display: inline-block; padding: 5px 8px; ">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>Brand:   </b> &nbsp;  ${brand}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; display: inline-block; padding: 5px 8px; ">
                                <span style="background: #F5F6F8; padding: 5px 8px; border-radius: 4px; display: inline-block;">
                                    <b>Category:  </b> &nbsp;  ${category} </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="50%" style="margin-bottom: 20px;">
                    <thead>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 20px; font-weight: 500; color: #171718 ;text-align: left;">
                                This is to inform you that the installation for Product ID:  ${productId} is scheduled for Date: 22/07/2025. 
                            </th>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 20px; font-weight: 500; color: #171718 ;text-align: left;">
                               Kindly ensure that the necessary arrangements are made for smooth execution. If you have any specific requirements or need to reschedule, please let us know at your earliest convenience.
                            </th>
                        </tr>
                        <tr>
                               <td style="height: 10px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 19px; font-weight: 500; color: #171718; text-align: left;">
                                All Installation details is given below.
                            </th>
                        </tr>
                    </thead>
                </table>
                <table width="80%"
                    style="padding: 24px 20px; border: 1px solid rgba(255, 245, 240, 1); background-color: rgba(255, 245, 240, 1); border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 19px; line-height: 23px; font-weight: 500; color: #171718; text-align: left; margin-bottom: 5px;">
                                Installation</td>
                        </tr>
                        <tr>
                            <td style="height: 5px;"></td>
                        </tr>
                        ${installationSpecification
                          .map(
                            (spec: any) => `
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                               ${spec?.softwares?.name ?? "-"} :
                            </td>
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span>
                                     ${spec?.value ?? "-"}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 10px;"></td>
                        </tr>
                        `
                          )
                          .join("")}
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                                Submit Agreement Form :
                            </td>
                            <td colspan="52"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                              Yes
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 20px;"></td>
                        </tr>
                        
                    </tbody>
                    
                </table>
            </td>
        </tr>
    </tbody>

</table>
</body>

</html>`;
