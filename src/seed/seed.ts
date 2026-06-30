import { PrismaClient } from "../../prisma/generated/prisma/client";
import bcrypt from "bcrypt";
import { generateSlug } from "../common/generate_slug";
import { generateNextCode } from "../utils/codeGenerator";
import prisma from "../utils/prisma";


const permissionData = [
  // User permissions
  { name: "Create Users", description: "Ability to create new users" },
  { name: "Read Users", description: "Ability to view users" },
  { name: "Update Users", description: "Ability to update user details" },
  { name: "Delete Users", description: "Ability to delete users" },

  // Role permissions
  { name: "Create Roles", description: "Ability to create new roles" },
  { name: "Read Roles", description: "Ability to view roles" },
  { name: "Update Roles", description: "Ability to update role details" },
  { name: "Delete Roles", description: "Ability to delete roles" },

  // Departments permissions
  {
    name: "Create Departments",
    description: "Ability to create new Departments",
  },
  { name: "Read Departments", description: "Ability to view Departments" },
  {
    name: "Update Departments",
    description: "Ability to update Departments details",
  },
  { name: "Delete Departments", description: "Ability to delete Departments" },

  // Brands permissions
  { name: "Create Brands", description: "Ability to create new Brands" },
  { name: "Read Brands", description: "Ability to view Brands" },
  { name: "Update Brands", description: "Ability to update Brands details" },
  { name: "Delete Brands", description: "Ability to delete Brands" },

  // Units permissions
  { name: "Create Units", description: "Ability to create new Units" },
  { name: "Read Units", description: "Ability to view Units" },
  { name: "Update Units", description: "Ability to update Units details" },
  { name: "Delete Units", description: "Ability to delete Units" },

  // Vendors permissions
  { name: "Create Vendors", description: "Ability to create new Vendors" },
  { name: "Read Vendors", description: "Ability to view Vendors" },
  { name: "Update Vendors", description: "Ability to update Vendors details" },
  { name: "Delete Vendors", description: "Ability to delete Vendors" },

  // Asset permissions
  { name: "Create Asset", description: "Ability to create new Assets" },
  { name: "Read Asset", description: "Ability to view Assets" },
  { name: "Update Asset", description: "Ability to update Assets details" },
  { name: "Delete Asset", description: "Ability to delete Assets" },

  // Product permissions
  { name: "Create Product", description: "Ability to create new products" },
  { name: "Read Product", description: "Ability to view products" },
  { name: "Update Product", description: "Ability to update products details" },
  { name: "Delete Product", description: "Ability to delete products" },

  // Category permissions
  {
    name: "Create Categories",
    description: "Ability to create new categories",
  },
  { name: "Read Categories", description: "Ability to view categories" },
  {
    name: "Update Categories",
    description: "Ability to update categories details",
  },
  { name: "Delete Categories", description: "Ability to delete categories" },

  // Installation permissions
  {
    name: "Create Installation",
    description: "Ability to create new installations",
  },
  { name: "Read Installation", description: "Ability to view installations" },
  {
    name: "Update Installation",
    description: "Ability to update installation details",
  },
  {
    name: "Delete Installation",
    description: "Ability to delete installations",
  },

  // Specification Field permissions
  {
    name: "Create Spec Fields",
    description: "Ability to create new specification fields",
  },
  {
    name: "Read Spec Fields",
    description: "Ability to view specification fields",
  },
  {
    name: "Update Spec Fields",
    description: "Ability to update specification fields details",
  },
  {
    name: "Delete Spec Fields",
    description: "Ability to delete specification fields",
  },

  // SubCategory permissions
  {
    name: "Create Subcategories",
    description: "Ability to create new subcategories",
  },
  { name: "Read Subcategories", description: "Ability to view subcategories" },
  {
    name: "Update Subcategories",
    description: "Ability to update subcategories details",
  },
  {
    name: "Delete Subcategories",
    description: "Ability to delete subcategories",
  },

  // Gr Permissions
  { name: "Create Gr", description: "Ability to create new GRs" },
  { name: "Read Gr", description: "Ability to view GRs" },
  { name: "Update Gr", description: "Ability to update GRs details" },
  { name: "Delete Gr", description: "Ability to delete GRs" },

  // Inventory permissions
  {
    name: "Create Inventory",
    description: "Ability to create new inventory items",
  },
  { name: "Read Inventory", description: "Ability to view inventory items" },
  {
    name: "Update Inventory",
    description: "Ability to update inventory items details",
  },
  {
    name: "Delete Inventory",
    description: "Ability to delete inventory items",
  },

  // GR Module
  { name: "GR Module", description: "Can access the GR module" },

  // Permission permissions
  {
    name: "Create Permissions",
    description: "Ability to create new permissions",
  },
  { name: "Read Permissions", description: "Ability to view permissions" },
  {
    name: "Update Permissions",
    description: "Ability to update permission details",
  },
  { name: "Delete Permissions", description: "Ability to delete permissions" },

  // Access Module
  { name: "Access Module", description: "Can access the access control layer" },

  // Profile Access
  { name: "User Profile Access", description: "Access own user profile" },

  // Unassign Asset permissions
  {
    name: "Unassign Asset",
    description: "Ability to unassign assets from users",
  },

  // Location permissions
  { name: "Create Locations", description: "Ability to create new locations" },
  { name: "Read Locations", description: "Ability to view locations" },
  {
    name: "Update Locations",
    description: "Ability to update location details",
  },
  { name: "Delete Locations", description: "Ability to delete locations" },
  
  // Software permissions
  { name: "Software Module", description: "Access the software module" },
  { name: "Read Software", description: "Ability to view software" },
  { name: "Create Software", description: "Ability to create software" },
  { name: "Update Software", description: "Ability to update software details" },
  { name: "Delete Software", description: "Ability to delete software" },
];

async function main() {
  console.log("Seeding database...");

  const permissions = await Promise.all(
    permissionData.map(async (perm) => {
      const slug = generateSlug(perm.name);
      return prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: { ...perm, slug },
      });
    })
  );

  // Create Unit Admin role with all permissions only on Unit module
  const unitAdminPerms = permissions.filter((perm) =>
    [
      "GR Module",
      "Create GR",
      "Read GR",
      "Update GR",
      "Delete GR",
      "Create Inventory",
      "Read Inventory",
      "Update Inventory",
      "Delete Inventory",
      "Create Subcategories",
      "Read Subcategories",
      "Update Subcategories",
      "Delete Subcategories",
      "Create Categories",
      "Read Categories",
      "Update Categories",
      "Delete Categories",
      "Create Spec Fields",
      "Read Spec Fields",
      "Update Spec Fields",
      "Delete Spec Fields",
      "Create Locations",
      "Read Locations",
      "Update Locations",
      "Delete Locations",
      "Unassign Asset",
      "Create Product",
      "Read Product",
      "Update Product",
      "Delete Product",
      "Create Brands",
      "Read Brands",
      "Update Brands",
      "Delete Brands",
    ].includes(perm.name)
  );

  const supportAdminPerms = permissions.filter((perm) =>
    [
      "Create Installation",
      "Read Installation",
      "Update Installation",
      "Delete Installation",
    ].includes(perm.name)
  );

  // 2. Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {
      permissions: {
        set: permissions.map((perm) => ({ id: perm.id })),
      },
    },
    create: {
      name: "Super Admin",
      description: "Has access to all system features and permissions",
      slug: generateSlug("Super Admin"),
      permissions: {
        connect: permissions.map((perm) => ({ id: perm.id })),
      },
    },
  });

  const unitAdminRole = await prisma.role.upsert({
    where: { name: "Unit Admin" },
    update: {
      permissions: {
        set: unitAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
    create: {
      name: "Unit Admin",
      description: "Can manage unit-specific resources",
      slug: generateSlug("Unit Admin"),
      permissions: {
        connect: unitAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
  });

  const supportAdminRole = await prisma.role.upsert({
    where: { name: "Support Admin" },
    update: {
      permissions: {
        set: supportAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
    create: {
      name: "Support Admin",
      description: "Can manage support-related resources",
      slug: generateSlug("Support Admin"),
      permissions: {
        connect: supportAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
  });

  const supportEngineerRole = await prisma.role.upsert({
    where: { name: "Support Engineer" },
    update: {
      permissions: {
        set: supportAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
    create: {
      name: "Support Engineer",
      description: "Can assist with support-related tasks",
      slug: generateSlug("Support Engineer"),
      permissions: {
        connect: supportAdminPerms.map((perm) => ({ id: perm.id })),
      },
    },
  });

  const userPerm = permissions.find((p) => p.name === "User Profile Access");

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {
      permissions: userPerm ? {
        set: [{ id: userPerm.id }],
      } : {},
    },
    create: {
      name: "User",
      description: "Can access own profile",
      slug: generateSlug("User"),
      permissions: userPerm ? { connect: [{ id: userPerm.id }] } : undefined,
    },
  });

  // 3. Create users
  const hashedPassword = await bcrypt.hash("password", 10);
  const superAdminuuid = await generateNextCode(prisma.user, "uuid", "EMP");

  await prisma.user.upsert({
    where: { uuid: superAdminuuid },
    update: {},
    create: {
      uuid: superAdminuuid,
      name: "Super Admin",
      email: "super_admin@app.com",
      password: hashedPassword,
      designation: "System Owner",
      roles: {
        connect: [{ id: superAdminRole.id }],
      },
    },
  });

  const useruuid = await generateNextCode(prisma.user, "uuid", "EMP");
  await prisma.user.upsert({
    where: { uuid: useruuid },
    update: {},
    create: {
      uuid: useruuid,
      name: "Regular User",
      email: "user@app.com",
      password: hashedPassword,
      designation: "End User",
      roles: {
        connect: [{ id: userRole.id }],
      },
    },
  });

  const supportAdminuuid = await generateNextCode(prisma.user, "uuid", "EMP");

  await prisma.user.upsert({
    where: { uuid: supportAdminuuid },
    update: {},
    create: {
      uuid: supportAdminuuid,
      name: "Support Admin",
      email: "support_admin@app.com",
      password: hashedPassword,
      designation: "Support Admin",
      roles: {
        connect: [{ id: supportAdminRole.id }],
      },
    },
  });

  const unitadminuuid = await generateNextCode(prisma.user, "uuid", "EMP");
  await prisma.user.upsert({
    where: { uuid: unitadminuuid },
    update: {},
    create: {
      uuid: unitadminuuid,
      name: "Unit Admin",
      email: "unit_admin@app.com",
      password: hashedPassword,
      designation: "Unit Admin",
      roles: {
        connect: [{ id: unitAdminRole.id }],
      },
    },
  });

  const supportEngineeruuid = await generateNextCode(
    prisma.user,
    "uuid",
    "EMP"
  );

  await prisma.user.upsert({
    where: {uuid:supportEngineeruuid},
    update: {},
    create: {
      uuid: supportEngineeruuid,
      name: "Support Engineer",
      email: "support_engineer@app.com",
      password: hashedPassword,
      designation: "Support Engineer",
      roles: {
        connect: [{ id: supportEngineerRole.id }],
      },
    },
  });

  // --- SEED BRAND, CATEGORY, SUBCATEGORY, AND SPEC FIELDS ---
  console.log("Seeding Brands, Category, Subcategory and Spec Fields...");
  
  // Seed Brands
  const brandsToSeed = ["HP", "Dell", "Lenovo", "Apple"];
  for (const brandName of brandsToSeed) {
    let brand = await prisma.brand.findFirst({
      where: { name: brandName },
    });
    if (!brand) {
      const brandUuid = await generateNextCode(prisma.brand, "uuid", "BRND");
      await prisma.brand.create({
        data: {
          uuid: brandUuid,
          name: brandName,
          createdBy: 1,
          updatedBy: 1,
        },
      });
    }
  }

  // Seed Category
  let category = await prisma.category.findFirst({
    where: { name: "IT Assets" },
  });
  if (!category) {
    const catUuid = await generateNextCode(prisma.category, "uuid", "CAT");
    category = await prisma.category.create({
      data: {
        uuid: catUuid,
        name: "IT Assets",
        description: "Information Technology Assets",
        createdBy: 1,
        updatedBy: 1,
      },
    });
  }

  // Seed Subcategory
  let subcategory = await prisma.subcategory.findFirst({
    where: { name: "Laptops", categoryId: category.id },
  });
  if (!subcategory) {
    const subcatUuid = await generateNextCode(prisma.subcategory, "uuid", "SUBCAT");
    subcategory = await prisma.subcategory.create({
      data: {
        uuid: subcatUuid,
        categoryId: category.id,
        name: "Laptops",
        description: "Laptop Computers",
        createdBy: 1,
        updatedBy: 1,
      },
    });
  }

  // Seed Spec Fields
  const specFieldsToSeed = [
    { name: "RAM", fieldType: "TEXT" },
    { name: "SSD", fieldType: "TEXT" },
    { name: "Graphics Card", fieldType: "TEXT" },
    { name: "Processor", fieldType: "TEXT" },
  ];

  const seededSpecFields = [];
  for (const sf of specFieldsToSeed) {
    let specField = await prisma.specField.findFirst({
      where: { name: sf.name },
    });
    if (!specField) {
      const sfUuid = await generateNextCode(prisma.specField, "uuid", "SPEC");
      specField = await prisma.specField.create({
        data: {
          uuid: sfUuid,
          name: sf.name,
          fieldType: sf.fieldType,
          createdBy: 1,
          updatedBy: 1,
        },
      });
    }
    seededSpecFields.push(specField);
  }

  

  console.log(" Seeding complete.");
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
