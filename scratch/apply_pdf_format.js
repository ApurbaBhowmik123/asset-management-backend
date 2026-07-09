const fs = require('fs');
const path = 'F:/asset_management/ams-frontend/src/Page/AssetManagement/UnassignAsset/UnassignAsset.jsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import html2canvas')) {
    code = code.replace(
        'import jsPDF from "jspdf";',
        `import html2canvas from "html2canvas";\nimport jsPDF from "jspdf";`
    );
}

if (!code.includes('import megathermLogo')) {
    code = code.replace(
        'import AssignIcon',
        `import megathermLogo from "../../../assets/Sidebarimages/Layer 1 1.png";\nimport AssignIcon`
    );
}

if (!code.includes('useRef')) {
    code = code.replace(
        'import React, { useState, useEffect } from "react";',
        `import React, { useState, useEffect, useRef } from "react";`
    );
}

if (!code.includes('const printRef = useRef();')) {
    code = code.replace(
        'const [uploadedFile, setUploadedFile] = useState(null);',
        `const [uploadedFile, setUploadedFile] = useState(null);\n  const printRef = useRef();`
    );
}

const oldHandleDownload = `  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Unassign Asset Handover Form", 14, 20);
    doc.text(\`User: \${selectedAsset?.username}\`, 14, 30);
    doc.text(\`Date: \${formData.date}\`, 14, 40);
    
    const tableData = userAssets.map((a, index) => [
      index + 1,
      a.inventoryProductDetail?.uuid || "N/A",
      a.inventoryProductDetail?.grInventoryProduct?.product?.name || "N/A",
      assetConditions[a.inventoryProductDetailId] || "Okay"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["#", "Asset ID", "Asset Name", "Condition"]],
      body: tableData,
    });
    
    doc.text("User Signature: __________________", 14, doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 30 : 150);
    doc.save(\`Unassign_\${selectedAsset?.username}.pdf\`);
  };`;

const newHandleDownload = `  const handleDownloadPDF = async () => {
    const input = printRef.current;
    
    const originalLeft = input.style.left;
    const originalPosition = input.style.position;

    input.style.left = "0px";
    input.style.position = "absolute";
    input.style.zIndex = "-1"; // Keep it behind

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    input.style.left = originalLeft;
    input.style.position = originalPosition;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(\`Unassign_\${selectedAsset?.username?.replace(/\\s+/g, '_') || 'Asset'}.pdf\`);
  };`;

code = code.replace(oldHandleDownload, newHandleDownload);

const pdfTemplate = `
      {/* PDF Template - Hidden but used for PDF generation */}
      <div ref={printRef} style={{ width: "800px", padding: "20px", position: "absolute", left: "-9999px" }}>
        <div style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "white",
          border: "1px solid #000",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "10px",
            borderBottom: "1px solid #000"
          }}>
            <div style={{ fontSize: "10px", lineHeight: "1.2" }}>
              Megatherm <br />
              Version 1.0
            </div>
            <div style={{ textAlign: "center", flexGrow: "1", margin: "0 20px" }}>
              <h1 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Asset Unassignment Form</h1>
            </div>
            <div style={{
              width: "60px",
              height: "60px",
              border: "1px solid #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0"
            }}>
              <div style={{ fontSize: "8px", textAlign: "center", color: "#666" }}><img src={megathermLogo} alt="Company Logo" style={{ maxWidth: "100%", maxHeight: "100%" }} /></div>
            </div>
          </div>

          {/* Main Form Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#e8e8e8", width: "25%" }}>Employee Name:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", width: "75%" }}>{selectedAsset?.username}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#e8e8e8" }}>E-mail ID:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }}>{selectedAsset?.usedByEmail}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold", textAlign: "center" }} colSpan="2">Asset Details</td>
              </tr>
              <tr>
                <td colSpan="2" style={{ border: "1px solid #000", padding: "3px 5px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#e8e8e8" }}>
                        <th style={{ border: "1px solid #000", padding: "3px 5px" }}>Asset ID</th>
                        <th style={{ border: "1px solid #000", padding: "3px 5px" }}>Description</th>
                        <th style={{ border: "1px solid #000", padding: "3px 5px" }}>Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAssets.map((a, index) => (
                        <tr key={index}>
                          <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{a.inventoryProductDetail?.uuid || 'N/A'}</td>
                          <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{a.inventoryProductDetail?.grInventoryProduct?.product?.name || 'N/A'}</td>
                          <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{assetConditions[a.inventoryProductDetailId] || 'Okay'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#e8e8e8" }}>Reasons for Unassignment:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", height: "40px" }}>{formData.remark || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* Signature Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold", textAlign: "center" }}></td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold", textAlign: "center" }}>Name</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold", textAlign: "center" }}>Signature</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", height: "25px" }}></td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }}></td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }}></td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold" }}>Approver:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }}>{formData.approvedBy || 'Pending'}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }}></td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top", backgroundColor: "#d3d3d3", fontWeight: "bold" }}>Date:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", verticalAlign: "top" }} colSpan="2">{formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          {/* User Declaration Section */}
          <div style={{ padding: "10px", borderTop: "1px solid #000", fontSize: "10px", lineHeight: "1.3" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Return Declaration</div>
            <div style={{ marginBottom: "8px" }}>
              I am returning the above-listed assets. I confirm that all data has been backed up and the condition stated above is accurate.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", fontSize: "10px" }}>
              <span>Place:</span>
              <div style={{ borderBottom: "1px solid #000", width: "200px", height: "20px", margin: "0 10px" }}></div>
              <span>Date:</span>
              <div style={{ borderBottom: "1px solid #000", width: "200px", height: "20px", margin: "0 10px" }}></div>
              <span>Employee Signature:</span>
              <div style={{ borderBottom: "1px solid #000", width: "200px", height: "20px", margin: "0 10px" }}></div>
            </div>
          </div>
        </div>
      </div>
`;

if (code.includes('id="asset-modal-title"')) {
    // We will place this pdfTemplate inside the Modal, below the Buttons Box
    code = code.replace(
        `</Modal>`,
        `${pdfTemplate}\n      </Modal>`
    );
}

fs.writeFileSync(path, code);
console.log("UnassignAsset.jsx updated with PDF format");
