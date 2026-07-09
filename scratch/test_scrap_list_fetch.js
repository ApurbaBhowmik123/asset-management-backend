"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Usually defined in .env
function testScrapList() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma.user.findFirst({ where: { email: "admin@yopmail.com" } });
            if (!user) {
                console.log("Admin user not found");
                return;
            }
            // Create token
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, roles: ["Super Admin"] }, JWT_SECRET, { expiresIn: "1h" });
            // Call API
            const response = yield axios_1.default.get("http://localhost:8082/api/gr/inventory/filter/SCRAP?page=1&limit=10", {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Total Count:", response.data.total);
            console.log("Data Length:", response.data.data.length);
            if (response.data.data.length > 0) {
                console.log("First item:", response.data.data[0].assignedStatus);
            }
        }
        catch (error) {
            if (error.response) {
                console.error("API Error:", error.response.status, error.response.data);
            }
            else {
                console.error("Error:", error);
            }
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
testScrapList();
