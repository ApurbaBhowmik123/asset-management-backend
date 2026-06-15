import { body, param } from "express-validator";

export const CreateServiceValidator = [
  // Validate route param
  param("inventoryProductDetailId")
    .isInt({ gt: 0 })
    .withMessage("inventoryProductDetailId must be a positive integer"),

  // Validate softwareIds
  body("softwareIds")
    .optional()
    .isArray({ min: 1 })
    .withMessage("softwareIds must be a non-empty array"),
  body("softwareIds.*.id")
    .isInt({ gt: 0 })
    .withMessage("Each software item must have a valid id"),
  body("softwareIds.*.value")
    .isString()
    .notEmpty()
    .withMessage("Each software item must have a non-empty value"),

  // Validate specValues
  body("specValues")
    .optional()
    .isArray({ min: 1 })
    .withMessage("specValues must be a non-empty array"),
  body("specValues.*.id")
    .isInt({ gt: 0 })
    .withMessage("Each spec item must have a valid id"),
  body("specValues.*.value")
    .isString()
    .notEmpty()
    .withMessage("Each spec item must have a non-empty value"),

  // Validate serviceDetails object
  body("serviceDetails")
    .isObject()
    .withMessage("serviceDetails must be an object"),

  // Boolean checks (optional but validated if present)
  body("serviceDetails.azurejoinandDomainCheck").optional().isBoolean(),
  body("serviceDetails.adPolicyCheck").optional().isBoolean(),
  body("serviceDetails.zscalerandDnsCheck").optional().isBoolean(),
  body("serviceDetails.deviceManagerCheck").optional().isBoolean(),
  body("serviceDetails.hDDPerformanceCheck").optional().isBoolean(),
  body("serviceDetails.memorySpeedCheck").optional().isBoolean(),
  body("serviceDetails.laptopBatteryCheck").optional().isBoolean(),
  body("serviceDetails.applicationLicenseCheck").optional().isBoolean(),
  body("serviceDetails.antivirusStatusCheck").optional().isBoolean(),
  body("serviceDetails.systemScanAndLogCheck").optional().isBoolean(),
  body("serviceDetails.intuneApplicationCheck").optional().isBoolean(),
  body("serviceDetails.mouseKeyboardStatus").optional().isBoolean(),
  body("serviceDetails.systemDriverStatusCheck").optional().isBoolean(),
  body("serviceDetails.antiVirusPolicyCheck").optional().isBoolean(),

  // String fields (optional but must be string if present)
  body("serviceDetails.harddiskCheck").optional().isString(),
  body("serviceDetails.monitorCheck").optional().isString(),
  body("serviceDetails.tcpipCheck").optional().isString(),
  body("serviceDetails.zscalerProxyVerUpgrade").optional().isString(),
  body("serviceDetails.applicationOffice").optional().isString(),
  body("serviceDetails.wsusPatchRelease").optional().isString(),
  body("serviceDetails.unWantedapplicationTobeRemoved").optional().isString(),
  body("serviceDetails.tempRefetchPrefetchtobeDeleted").optional().isString(),
  body("serviceDetails.startupToBeConfigured").optional().isString(),
  body("serviceDetails.bitLockerCheck").optional().isString(),
  body("serviceDetails.backupSolutionCheck").optional().isString(),
  body("latestVersionOfOsUpdate").optional().isString()
];
