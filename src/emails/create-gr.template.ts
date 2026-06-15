export const sendCreateGrEmail = async (
  orderId: string,
  invoiceNumber: string,
  invoiceDate: string,
  purchaseDate: string,
  sapGrId: string,
  purchaseId: string,
  productDetails: any[] = []
) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchasr Product</title>
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
                                GR Details</th>
                        </tr>
                        <tr style="text-align: left;">
                            <th
                                style="font-size: 15px; line-height: 19px; font-weight: 500; color: #171718; text-align: left;">
                                Product Added To
                                Stock
                            </th>
                        </tr>
                    </thead>
                </table>
                <table width="100%"
                    style="padding: 24px 20px; border: 1px solid #EDEDEF; border-radius: 6px; margin-bottom: 20px;">
                    <tbody>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 19px; line-height: 23px; font-weight: 500; color: #171718; text-align: left; margin-bottom: 5px;">
                                Purchase Order# ${orderId}</td>
                            <td colspan="2"
                                style="font-size: 12px; line-height: 16px; font-weight: 400; color: #171718; text-align: left; margin-bottom: 5px; text-align: right;">
                                <b>Invoice Number:</b> ${invoiceNumber}
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 5px;"></td>
                        </tr>
                        <tr style="text-align: left;">
                            <td colspan="2"
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #DB3027; text-align: left;">
                                <span style="background: #DB30271A; padding: 5px 10px; border-radius: 4px;">Date:
                                    ${purchaseDate}</span>
                            </td>
                            <td colspan="2"
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #494D58; text-align: right;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px;">
                                    <b> Date:</b> &nbsp; ${invoiceDate}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="height: 20px;"></td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr style="text-align: left;">
                             <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; width: 160px;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px;">
                                    <b>SAP GR Id:</b> &nbsp; ${sapGrId}</span>
                            </td>
                            <td
                                style="font-size: 11px; line-height: 15px; font-weight: 400; color: #2A2E38; text-align: left; width: 160px;">
                                <span style="background: #F5F6F8; padding: 5px 10px; border-radius: 4px;">
                                    <b>Purchase Id:</b> &nbsp; ${purchaseId}</span>
                            </td>
                           
                        </tr>
                    </tbody>
                </table>
                <table width="100%" style="border: 1px solid #EDEDEF; border-radius: 6px; margin-bottom: 20px;">
                    <thead style="background: #F4F4EE; padding: 10px 10px; text-align: left;">
                        <tr>
                            <th colspan="8"
                                style="text-align: left; font-size: 14px; font-weight: 500; color: #171718; padding: 15px 25px; background: #fff;">
                                Items List
                            </th>
                        </tr>
                        <tr>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                #</th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                product
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                category
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                Subcategory
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase;padding: 10px 10px;">
                                quantity
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                free qty
                            </th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                rate</th>
                            <th
                                style="font-size: 10px; font-weight: 500; color: #4E5357;text-transform: uppercase; padding: 10px 10px;">
                                total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productDetails
                          .map(
                            (product, index) => `
                        <tr >
                            <td
                                style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;">
                                0${index + 1}</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> ${product?.product.name}</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
">${product?.product.category?.name || "-"}</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> ${product?.product.subcategory?.name || "-"}</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> ${product.quantity}</td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> ${product.freeQty}</td>

                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> INR ${product.ratePerPiece}
                            </td>
                            <td style="font-size: 12px; font-weight: 400; color: #000104; padding: 10px 10px; border-bottom: 1px solid #EDEDEF;
"> INR ${product.totalAmount}
                            </td>

                        </tr>
                        `
                          )
                          .join("")}
                        
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8"
                                style="font-size: 15px; font-weight: 500; color: #000104; padding: 15px 25px;text-align: right;">
                                <span style="font-size: 12px !important; margin-right: 15px;">Total</span> INR ${productDetails.reduce(
                                  (acc, product) => acc + product.totalAmount,
                                  0
                                )}
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
