const fs = require('fs');
const filePath = 'f:/asset_management/ams-frontend/src/Page/AssetManagement/UnassignAsset/UnassignAsset.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add jsPDF imports
if (!code.includes('import jsPDF')) {
  code = code.replace(
    'import { mkConfig, generateCsv, download } from "export-to-csv";',
    `import { mkConfig, generateCsv, download } from "export-to-csv";\nimport jsPDF from "jspdf";\nimport "jspdf-autotable";`
  );
}

// 2. Add state variables for the modal
code = code.replace(
  'const [selectedAsset, setSelectedAsset] = useState(null);',
  `const [selectedAsset, setSelectedAsset] = useState(null);\n  const [userAssets, setUserAssets] = useState([]);\n  const [assetConditions, setAssetConditions] = useState({});\n  const [uploadedFile, setUploadedFile] = useState(null);`
);

// 3. Add userId to transformedData
code = code.replace(
  'const assignmentId = item.AssignProductDetails?.[0]?.assignedId;',
  `const assignmentId = item.AssignProductDetails?.[0]?.assignedId;\n          const userId = assignedUser?.id || null;`
);
code = code.replace(
  'uuid: item.uuid,',
  `uuid: item.uuid,\n            userId: userId,`
);

// 4. Update handleOpenModal
const oldHandleOpenModal = `  const handleOpenModal = (asset) => {
    setSelectedAsset(asset);
    setOpenModal(true);
  };`;
const newHandleOpenModal = `  const handleOpenModal = async (asset) => {
    setSelectedAsset(asset);
    setOpenModal(true);
    setUserAssets([]);
    setAssetConditions({});
    setUploadedFile(null);
    if (asset.userId) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(\`\${baseUrl}/asset-mng/asset-unassign/\${asset.userId}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const json = await res.json();
        if (json.status && json.data?.data) {
          setUserAssets(json.data.data);
          const initConds = {};
          json.data.data.forEach(a => initConds[a.inventoryProductDetailId] = "Okay");
          setAssetConditions(initConds);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
        // location or single asset
        setUserAssets([ { inventoryProductDetailId: asset.id, inventoryProductDetail: { uuid: asset.uuid, grInventoryProduct: { product: { name: asset.model } } }, assignedId: asset.assignmentId } ]);
        setAssetConditions({ [asset.id]: "Okay" });
    }
  };`;
code = code.replace(oldHandleOpenModal, newHandleOpenModal);

// 5. Update handleCloseModal
code = code.replace(
  'setSelectedAsset(null);',
  `setSelectedAsset(null);\n    setUserAssets([]);\n    setAssetConditions({});\n    setUploadedFile(null);`
);

// 6. Update handleSubmit to use FormData
const oldHandleSubmit = `const payload = {
        inventoryProductIds: selectedAsset._group ? selectedAsset._group.map(g => g.id) : [selectedAsset.id],
        assignmentIds: [selectedAsset.assignmentId],
        approvedDate: new Date(formData.date).toISOString(),
        approvedBy: selectedUser.id.toString(),
        remarks: formData.remark || "No remarks"
      };

      const response = await fetch(\`\${baseUrl}/asset-mng/asset-unassign\`, {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${token}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });`;

const newHandleSubmit = `const formDataPayload = new FormData();
      formDataPayload.append('inventoryProductIds', JSON.stringify(userAssets.map(a => a.inventoryProductDetailId)));
      formDataPayload.append('assignmentIds', JSON.stringify(userAssets.map(a => a.assignedId)));
      formDataPayload.append('conditions', JSON.stringify(userAssets.map(a => assetConditions[a.inventoryProductDetailId] || 'Okay')));
      formDataPayload.append('approvedDate', new Date(formData.date).toISOString());
      formDataPayload.append('approvedBy', selectedUser.id.toString());
      formDataPayload.append('remarks', formData.remark || "No remarks");
      if (uploadedFile) {
        formDataPayload.append('file', uploadedFile);
      }

      const response = await fetch(\`\${baseUrl}/asset-mng/asset-unassign\`, {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${token}\`,
        },
        body: formDataPayload
      });`;
code = code.replace(oldHandleSubmit, newHandleSubmit);


// 7. Add handleDownloadPDF
const handleDownloadPDF = `
  const handleDownloadPDF = () => {
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

    doc.autoTable({
      startY: 50,
      head: [["#", "Asset ID", "Asset Name", "Condition"]],
      body: tableData,
    });
    
    doc.text("User Signature: __________________", 14, doc.lastAutoTable.finalY + 30);
    doc.save(\`Unassign_\${selectedAsset?.username}.pdf\`);
  };
`;
code = code.replace('const columnHelper = createMRTColumnHelper();', handleDownloadPDF + '\n  const columnHelper = createMRTColumnHelper();');

// 8. Replace Modal content
const modalRegex = /<Modal[\s\S]*?<\/Modal>/;
const newModal = `<Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="asset-modal-title"
        aria-describedby="asset-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="asset-modal-title" variant="h6" component="h2" gutterBottom className="line">
            Bulk Unassign Assets
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            <strong>User:</strong> {selectedAsset?.username} <br/>
            <strong>Email:</strong> {selectedAsset?.usedByEmail}
          </Typography>

          {/* Asset List with Condition */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Assigned Assets:</Typography>
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
            {userAssets.map(a => (
              <Box key={a.inventoryProductDetailId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                <Box>
                  <Typography variant="body2"><strong>{a.inventoryProductDetail?.uuid}</strong></Typography>
                  <Typography variant="caption">{a.inventoryProductDetail?.grInventoryProduct?.product?.name}</Typography>
                </Box>
                <Box>
                  <label style={{ marginRight: 10 }}>
                    <input type="radio" checked={assetConditions[a.inventoryProductDetailId] === "Okay"} onChange={() => setAssetConditions(prev => ({...prev, [a.inventoryProductDetailId]: "Okay"}))} /> Okay
                  </label>
                  <label>
                    <input type="radio" checked={assetConditions[a.inventoryProductDetailId] === "Damage"} onChange={() => setAssetConditions(prev => ({...prev, [a.inventoryProductDetailId]: "Damage"}))} /> Damage
                  </label>
                </Box>
              </Box>
            ))}
            {userAssets.length === 0 && <Typography variant="body2">No assets found.</Typography>}
          </Box>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: "10px" }}>
            <div style={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Date</Typography>
              <CustomTextField fullWidth type="date" name="date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleInputChange} />
            </div>
            <div style={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Approved By</Typography>
              <CustomTextField select fullWidth name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} disabled={loadingUsers}>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                ))}
              </CustomTextField>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Remark</Typography>
            <CustomTextField fullWidth name="remark" multiline rows={2} value={formData.remark} onChange={handleInputChange} />
          </div>

          {/* Document Section */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Button variant="outlined" onClick={handleDownloadPDF} startIcon={<FileDownloadIcon/>}>
              Download Document
            </Button>
            <Box>
              <Typography variant="caption" display="block">Upload Signed Document:</Typography>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setUploadedFile(e.target.files[0])} />
            </Box>
          </Box>

          {/* Buttons */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button className="Global-Button3" onClick={handleCloseModal} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button className="Global-Button2" onClick={handleSubmit} sx={{ textTransform: 'none' }} disabled={!uploadedFile}>Unassign All</Button>
          </Box>
        </Box>
      </Modal>`;

code = code.replace(modalRegex, newModal);

fs.writeFileSync(filePath, code);
console.log("UnassignAsset.jsx updated successfully");
