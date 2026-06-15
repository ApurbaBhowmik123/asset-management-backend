import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

export const uploadFiles = async (
  folderName: string,
  files: Express.Multer.File | Express.Multer.File[]
): Promise<string[]> => {
  const uploadDir = path.join(__dirname, `../../uploads/${folderName}`);
  const publicPath = `/uploads/${folderName}`;
  await fs.ensureDir(uploadDir); // create directory if it doesn't exist
  
  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedFileNames: string[] = [];

  for (const file of fileArray) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(filePath, file.buffer);
    uploadedFileNames.push(`${publicPath}/${uniqueName}`);
  }

  return uploadedFileNames;
};
