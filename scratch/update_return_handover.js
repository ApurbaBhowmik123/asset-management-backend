const fs = require('fs');
const filePath = 'f:/asset_management/ams-frontend/src/Page/AssetManagement/ReturnHandover/ReturnHandover.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Extract document URL
// The products are mapped in useEffect. Let's find where they map products.
code = code.replace(
  'const [assetStatuses, setAssetStatuses] = useState({});',
  `const [assetStatuses, setAssetStatuses] = useState({});\n  const [unassignDocumentUrl, setUnassignDocumentUrl] = useState(null);`
);

const oldUseEffectMap = `          const productList = result.data.data.map(assignment => ({
            id: assignment.inventoryProductDetail.grInventoryProduct.product.id,
            inventorProductId: assignment.inventoryProductDetail.id,
            uuid: assignment.inventoryProductDetail.uuid,
            serialNo1: assignment.inventoryProductDetail.serialNo1,
            name: assignment.inventoryProductDetail.grInventoryProduct.product.name,
            brand: assignment.inventoryProductDetail.grInventoryProduct.product.brand,
            category: assignment.inventoryProductDetail.grInventoryProduct.product.category,
          }));`;

const newUseEffectMap = `          const productList = result.data.data.map(assignment => {
            const unassign = assignment.inventoryProductDetail.productUnassignments?.[0];
            return {
              id: assignment.inventoryProductDetail.grInventoryProduct.product.id,
              inventorProductId: assignment.inventoryProductDetail.id,
              uuid: assignment.inventoryProductDetail.uuid,
              serialNo1: assignment.inventoryProductDetail.serialNo1,
              name: assignment.inventoryProductDetail.grInventoryProduct.product.name,
              brand: assignment.inventoryProductDetail.grInventoryProduct.product.brand,
              category: assignment.inventoryProductDetail.grInventoryProduct.product.category,
              unassignCondition: unassign?.condition || null,
              unassignDocumentUrl: unassign?.documentUrl || null,
            };
          });
          const doc = productList.find(p => p.unassignDocumentUrl);
          if (doc) setUnassignDocumentUrl(doc.unassignDocumentUrl);`;

code = code.replace(oldUseEffectMap, newUseEffectMap);

// 2. Add 'View Uploaded Document' Button
const oldButtons = `<Button
            variant="contained"
            color="primary"
            onClick={handleCompleteReturnHandover}
            disabled={isSubmitting}
            className="Global-Button2"
          >
            {isSubmitting ? "Submitting..." : "Complete Handover"}
          </Button>`;

const newButtons = `{unassignDocumentUrl && (
            <Button
              variant="outlined"
              color="secondary"
              href={unassignDocumentUrl.startsWith('http') ? unassignDocumentUrl : baseUrl + unassignDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mr: 2 }}
            >
              View Uploaded Document
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteReturnHandover}
            disabled={isSubmitting}
            className="Global-Button2"
          >
            {isSubmitting ? "Submitting..." : "Complete Handover"}
          </Button>`;

code = code.replace(oldButtons, newButtons);

// 3. Auto-download PDF in handleCompleteReturnHandover
// pdf.output('blob') is there, we just add pdf.save() after
code = code.replace(
  `const pdfBlob = pdf.output('blob');`,
  `const pdfBlob = pdf.output('blob');\n        pdf.save(\`Return_Handover_\${rowData.assignedTo.user.name.replace(/\\s+/g, '_')}.pdf\`);`
);

fs.writeFileSync(filePath, code);
console.log("ReturnHandover.jsx updated successfully");
