import { body, param } from "express-validator";

export const validateCreateGr = [
  // Validate GRDetail
  body("sapId").optional().isString().withMessage("sapId must be a string"),
  body("sapDate").optional(),
  body("invoiceNumber")
    .optional()
    .isString()
    .withMessage("invoiceNumber must be a string"),
  body("invoiceDate")
    .optional()
    .isISO8601()
    .withMessage("invoiceDate must be a valid date"),
  body("grId").optional().isString().withMessage("grId must be a string"),
  body("grDate").optional(),
  body("vendorId")
    .optional()
    .isInt()
    .withMessage("vendorId must be an integer"),
  body("unitId").isInt().withMessage("unitId must be an integer"),
  body("description").optional().isString(),

  // Validate products array
  body("products").isArray().withMessage("products must be an array"),
  body("products.*.productId")
    .isInt()
    .withMessage("productId must be an integer"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be a positive integer"),
  body("products.*.ratePerPiece")
    .isFloat({ min: 0 })
    .withMessage("ratePerPiece must be a non-negative number"),
  body("products.*.freeQty").optional().isInt({ min: 0 }),
  body("products.*.description").optional().isString(),
  body("products.*.maintenanceFrequency").optional().isString(),
  body("products.*.maintenanceDueDate")
    .optional()
    .isISO8601()
    .withMessage("maintenanceDueDate must be a valid date"),
  body("products.*.lifecycleExDate")
    .optional()
    .isISO8601()
    .withMessage("lifecycleExDate must be a valid date"),
  // body("products.*.warrantyTill")
  //   .optional()
  //   .isISO8601()
  //   .withMessage("warrantyTill must be a valid date"),
  body("products.*.warrantyFile").optional().isString(),
  body("products.*.importantLink")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("importantLink must be a valid URL"),
  body("products.*.invoiceFile").optional().isString(),

  // Validate specs inside each product
  body("products.*.specs").optional().isArray(),
  body("products.*.specs.*.specFieldId")
    .if(body("products.*.specs").exists())
    .isInt()
    .withMessage("specFieldId must be an integer"),
  body("products.*.specs.*.value")
    .if(body("products.*.specs").exists())
    .isString()
    .withMessage("value must be a string"),

  // Validate serials and freeSerials
  body("products.*.serials").optional().isArray(),
  body("products.*.serials.*.serialNo1").optional().isString(),
  body("products.*.serials.*.serialNo2").optional().isString(),

  body("products.*.freeSerials").optional().isArray(),
  body("products.*.freeSerials.*.serialNo1").optional().isString(),
  body("products.*.freeSerials.*.serialNo2").optional().isString(),
];

export const validateUpdateGr = [
  // Validate route param
  param("grId").isString().withMessage("grId must be a string"),

  // Validate GR detail fields
  body("sapId").optional().isString(),
  body("sapDate").optional(),
  body("invoiceNumber").optional().isString(),
  body("invoiceDate").optional(),
  body("grId").optional().isString(),
  body("grDate").optional(),
  body("vendorId").optional().isInt(),
  body("description").optional().isString(),
];
