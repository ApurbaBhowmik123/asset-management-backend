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
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./prisma/generated/prisma");
const prisma = new prisma_1.PrismaClient();
function check() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const assignment = yield prisma.productAssignment.findFirst({
            where: { status: 'Active' },
            include: {
                inventoryProductDetail: {
                    include: {
                        specValues: { include: { specField: true } },
                        grInventoryProduct: {
                            include: {
                                product: {
                                    include: {
                                        productSpecValue: { include: { specField: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log("GRProductSpecValue:", JSON.stringify((_a = assignment === null || assignment === void 0 ? void 0 : assignment.inventoryProductDetail) === null || _a === void 0 ? void 0 : _a.specValues, null, 2));
        console.log('--- Product Spec Values ---');
        console.log("ProductSpecValue:", JSON.stringify((_d = (_c = (_b = assignment === null || assignment === void 0 ? void 0 : assignment.inventoryProductDetail) === null || _b === void 0 ? void 0 : _b.grInventoryProduct) === null || _c === void 0 ? void 0 : _c.product) === null || _d === void 0 ? void 0 : _d.productSpecValue, null, 2));
    });
}
check().catch(console.error).finally(() => prisma.$disconnect());
