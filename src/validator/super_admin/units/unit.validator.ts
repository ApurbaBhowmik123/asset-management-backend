import { body } from "express-validator";

const addressFields = [
  "addressLine1", "addressLine2", "addressLine3",
  "buildingName", "unitNumber", "floor", "neighborhood",
  "landmark", "city", "district", "county", "state", "province",
  "country", "countryCode", "postalCode", "zipCode", "poBoxNumber",
  "latitude", "longitude", "timezone", "geohash", "formatted", "placeId"
];

const addressValidations = addressFields.map(field =>
  body(field).optional()
);

export const validateCreateUnit = [
  body("name").trim().notEmpty().withMessage("Unit name is required"),
  body("identificationNumber").optional({checkFalsy:true}),
  body("description").optional(),
  body("status").optional().isBoolean().withMessage("Status must be a boolean"),
  ...addressValidations
];

export const validateUpdateUnit = [
  body("name").trim().notEmpty().withMessage("Unit name cannot be empty"),
  body("identificationNumber").optional({checkFalsy: true}),
  body("description").optional(),
  body("status").optional().isBoolean().withMessage("Status must be a boolean"),
  ...addressValidations
];
