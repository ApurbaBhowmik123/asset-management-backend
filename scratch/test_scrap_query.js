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
const prisma_1 = __importDefault(require("../src/utils/prisma"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const whereCondition = {
            status: true,
            AND: [],
            assignedStatus: "SCRAP"
        };
        const inventoryList = yield prisma_1.default.inventoryProductDetail.findMany({
            where: whereCondition,
            include: {
                grInventoryProduct: {
                    include: {
                        product: {
                            include: {
                                category: true,
                                brand: true,
                            },
                        },
                        category: true,
                        brand: true
                    },
                },
                location: true,
                unit: true,
                qrCode: true,
            }
        });
        console.log("Scrap list fetched:", inventoryList.length);
        if (inventoryList.length > 0) {
            console.log(JSON.stringify(inventoryList[0], null, 2));
        }
    });
}
main().catch(console.error).finally(() => prisma_1.default.$disconnect());
