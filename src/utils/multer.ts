import multer from "multer";
const storage = multer.memoryStorage(); 

export const upload = multer({
    storage: storage,
    limits: { fileSize: 20000000 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPG, PNG, PDF, and XLSX are allowed.'));
        }
        cb(null, true);
    }
});