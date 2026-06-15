import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";


export const decodeBase64File = async (base64String: string, folder: string): Promise<string> => {
  try {
    if (!base64String) {
      throw new Error("Base64 string is required");
    }

    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 file format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.split("/")[1];

    const buffer = Buffer.from(base64Data, "base64");
    const filename = `${uuidv4()}.${ext}`;
    const uploadPath = path.join(__dirname, "..", "..", "uploads", folder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, filename);
    fs.writeFileSync(filePath, buffer);

    return filename;
  } catch (error) {
    console.error("Error decoding base64 file:", error);
    throw error;
  }
};
