import { body } from "express-validator";

export const validateCreateVendor = [
  body("name").notEmpty().withMessage("Name is required"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email"),

  body("addressLine1")
    .notEmpty()
    .withMessage("Address Line 1 is required"),

  body("mobile")
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Invalid mobile number"),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .matches(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})$/)
    .withMessage("Invalid GST number"),

  body("panNumber")
    .optional({ checkFalsy: true })
    .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)
    .withMessage("Invalid PAN number"),

  body("postalCode")
    .optional({ checkFalsy: true })
    .matches(/^\d{6}$/)
    .withMessage("Invalid postal code"),

  body("bankAccountNumber")
    .optional({ checkFalsy: true })
    .matches(/^\d{9,18}$/)
    .withMessage("Invalid account number"),

  body("bankIfscCode")
    .optional({ checkFalsy: true })
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code"),

  body("status")
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage("Status must be true or false"),
];

export const validateUpdateVendor = [
  body("name").notEmpty().withMessage("Name is required"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email"),

  body("mobile")
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Invalid mobile number"),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .matches(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})$/)
    .withMessage("Invalid GST number"),

  body("panNumber")
    .optional({ checkFalsy: true })
    .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)
    .withMessage("Invalid PAN number"),

  body("postalCode")
    .optional({ checkFalsy: true })
    .matches(/^\d{6}$/)
    .withMessage("Invalid postal code"),

  body("bankAccountNumber")
    .optional({ checkFalsy: true })
    .matches(/^\d{9,18}$/)
    .withMessage("Invalid account number"),

  body("bankIfscCode")
    .optional({ checkFalsy: true })
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code"),

  body("status")
    .optional({ checkFalsy: true })
];
