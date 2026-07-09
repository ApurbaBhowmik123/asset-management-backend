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
        const slug = "create-soft-delete";
        let permission = yield prisma_1.default.permission.findUnique({ where: { slug } });
        if (!permission) {
            permission = yield prisma_1.default.permission.create({
                data: {
                    name: "Create Soft Delete",
                    slug: slug,
                    description: "Ability to soft delete an item",
                }
            });
            console.log("Created permission:", permission);
        }
        else {
            console.log("Permission already exists:", permission);
        }
        // Assign to Super Admin
        const superAdminRole = yield prisma_1.default.role.findFirst({
            where: { name: "Super Admin" },
            include: { permissions: true }
        });
        if (superAdminRole) {
            const hasPerm = superAdminRole.permissions.some(p => p.slug === slug);
            if (!hasPerm) {
                yield prisma_1.default.role.update({
                    where: { id: superAdminRole.id },
                    data: {
                        permissions: {
                            connect: { id: permission.id }
                        }
                    }
                });
                console.log("Assigned permission to Super Admin role");
            }
            else {
                console.log("Super Admin already has this permission");
            }
        }
        else {
            console.log("Super Admin role not found");
        }
    });
}
main()
    .catch(console.error)
    .finally(() => prisma_1.default.$disconnect());
