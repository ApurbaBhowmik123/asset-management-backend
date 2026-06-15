export const handoverAssetMail = async (
  employeeName: string,
  employeeCode: string,
  designation: string,
  mobile: string,
  locationName: string,
  email: string,
  unitName: string,
  departName: string,
  assignedAt: string,
  status: string,
  attachmentUrl: string,
  assignedItems: any[]
) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Agreement</title>
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
                                Handover</th>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 15px; line-height: 19px; font-weight: 500; color: #171718; text-align: left;">
                                Sign Agreement
                            </th>
                        </tr>
                    </thead>
                </table>
                <table class="assign_details" width="100%"
                    style="padding: 24px 20px; border: 1px solid rgba(255, 233, 211, 1); background-color: rgba(255, 233, 211, 1); border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 19px; line-height: 23px; font-weight: 500; color: #171718; text-align: left; margin-bottom: 5px;">
                                ${employeeName}</td>
                            <td colspan="2"
                                style="font-size: 12px; line-height: 16px; font-weight: 400; color: #171718; text-align: left; margin-bottom: 5px; text-align: right;">
                                <b>Company: </b> ${unitName}
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 5px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #DB3027; text-align: left;">
                                <span style="background: #DB30271A; padding: 5px 10px; border-radius: 4px;">Employee Code:
                                     ${employeeCode}</span>
                            </td>
                            <td colspan="2"
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px;">
                                    <b> Dept: </b> &nbsp; ${departName}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 20px;"></td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr style="text-align: left;">
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; padding: 5px 8px; display: inline-block;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; padding: 5px 8px; display: inline-block;" >
                                    <b>Designation:</b> &nbsp; ${designation}</span>
                            </td>
                            <td
                             style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; padding: 5px 8px; display: inline-block;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; padding: 5px 8px; display: inline-block;">
                                    <b>Ph Number:</b> &nbsp; ${mobile}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; padding: 5px 8px; display: inline-block;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; padding: 5px 8px; display: inline-block;">
                                    <b>Location:</b> &nbsp; ${locationName}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; padding: 5px 8px; display: inline-block; ">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; padding: 5px 8px; display: inline-block;">
                                    <b>Email ID:</b> &nbsp; ${email}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="50%" style="margin-bottom: 20px;">
                    <thead>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 15px; font-weight: 500; color: #171718 ;text-align: left;">
                                Hello ${employeeName},</th>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 19px; font-weight: 500; color: #171718; text-align: left;">
                                Sign agreement for your assigned products.
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
                                Assigned details</td>
                        </tr>
                        <tr>
                            <td style="height: 5px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                                Assign At :
                            </td>
                            <td colspan="2"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; color: rgba(13, 110, 253, 1); background-color: rgba(13, 110, 253, 0.1);">
                                    <b> ${assignedAt}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 10px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                                Status :
                            </td>
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px; color: rgba(219, 48, 39, 1); background-color: rgba(219, 48, 39, 0.1);">
                                    <b> ${status}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 10px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                               Signed Agreement :
                            </td>
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span style="color: #28A744">&#x2611;</span>  Signed
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 10px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="5"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: rgba(139, 139, 141, 1); text-align: left;">
                                Submit Agreement Form :
                            </td>
                            <td colspan="52"
                                style="font-size: 12px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                              <span style="color: #28A744">&#x2611;</span> Yes
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 20px;"></td>
                        </tr>
                        
                    </tbody>
                    
                </table>
                 <table width="50%" style="margin-bottom: 20px;">
                    <thead>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 13px; line-height: 15px; font-weight: 500; color: #171718 ;text-align: left;">
                               Attachments</th>
                        </tr>
                        <tr style="text-align: left;">
                            <th style="padding-top: 12px;">
                            <a href=${attachmentUrl} target="_blank">
                               <img src="./pdf.png" alt="" class="img-fluid">
                            </a>
                            </th>
                        </tr>
                    </thead>
                </table>
                <table width="100%" style="border: 1px solid #EDEDEF; border-radius: 6px; margin-bottom: 20px;">
                    <thead style="background: #F4F4EE; padding: 10px 10px; text-align: center;">
                        <tr>
                            <th colspan="8"
                                style="text-align: left; font-size: 14px; font-weight: 500; color: #171718; padding: 15px 25px; background: #fff;">
                                Assigned Items
                            </th>
                        </tr>
                        <tr>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                #</th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                               product id
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                               Brand
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                product name
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase;padding: 10px 10px;">
                                category
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                Subcategory
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                Quantity
                            </th>
                        </tr>
                    </thead>
                    <tbody style=" text-align: center;">
                        ${assignedItems
                          .map(
                            (item, index) => `
                        
                        <tr>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">0${
                              index + 1
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">${
                              item?.grInventoryProduct?.product?.uuid ?? "-"
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">${
                              item?.grInventoryProduct?.product?.brand.name ??
                              "-"
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">${
                              item?.grInventoryProduct?.product?.name ?? "-"
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">${
                              item?.grInventoryProduct?.product?.category
                                ?.name ?? "-"
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">${
                              item?.grInventoryProduct?.product?.subcategory
                                ?.name ?? "-"
                            }</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px; border-bottom: 1px solid #EDEDEF;">1</td>

                        </tr>
                        `
                          )
                          .join("")}
                       
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8"
                                style="font-size: 15px; font-weight: 500; color: #000104; padding: 15px 25px;text-align: right;">
                                <span style="font-size: 12px !important; margin-right: 15px;">Total Item</span> ${assignedItems.length}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </td>
        </tr>
    </tbody>

</table>
</body>

</html>`;
