import { body } from "express-validator";

export const createPermissionValidator = [
  body("name")
    .exists().withMessage("Permission name is required")
    .notEmpty().withMessage("Permission name cannot be empty")
    .isString().withMessage("Permission name must be a string"),

  body("type")
    .exists().withMessage("Permission type is required")
    .isIn(["crud", "basic"]).withMessage("Type must be either 'crud' or 'basic'"),

  // Conditional: If type is "basic", description is required
  body("description")
    .if(body("type").equals("basic"))
    .exists().withMessage("Description is required for basic type")
    .notEmpty().withMessage("Description cannot be empty")
    .isString().withMessage("Description must be a string"),

  // Conditional: If type is "crud", resource must be array of allowed operations
  body("resource")
    .if(body("type").equals("crud"))
    .exists().withMessage("Resource is required for crud type")
    .isArray({ min: 1 }).withMessage("Resource must be a non-empty array")
    .custom((arr) => {
      const validOps = ["create","read", "update", "delete"];
      const invalidOps = arr.filter((op: string) => !validOps.includes(op));
      if (invalidOps.length > 0) {
        throw new Error(`Invalid resource operations: ${invalidOps.join(", ")}`);
      }
      return true;
    }),
];