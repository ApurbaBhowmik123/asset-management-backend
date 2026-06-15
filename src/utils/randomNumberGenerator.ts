import crypto from "crypto";

export const generateUniqueId = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(6);
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
};
