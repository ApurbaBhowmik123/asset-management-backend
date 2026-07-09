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
        const permSlug = "old-data-sync-module";
        let perm = yield prisma_1.default.permission.findFirst({ where: { slug: permSlug } });
        if (!perm) {
            perm = yield prisma_1.default.permission.create({
                data: {
                    name: "Old Data Sync Module",
                    slug: permSlug,
                    description: "Access to bulk upload old data sync"
                }
            });
            console.log("Created permission:", perm.slug);
        }
        else {
            console.log("Permission already exists:", perm.slug);
        }
        const role = yield prisma_1.default.role.findFirst({ where: { name: 'Super Admin' } });
        if (role) {
            yield prisma_1.default.role.update({
                where: { id: role.id },
                data: {
                    permissions: {
                        connect: { id: perm.id }
                    }
                }
            });
            console.log("Assigned", permSlug, "to Super Admin");
        }
    });
}
main().catch(console.error).finally(() => prisma_1.default.$disconnect());
