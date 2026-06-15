export enum AssignedStatus {
  InStock = "InStock",
  ASSIGNED = "ASSIGNED",
  InstallationCompleted = "InstallationCompleted",
  BLOCKED = "BLOCKED",
  E_WASTE = "E-WASTE",
  WRITE_OFF = "WRITE-OFF",
}

export enum AssignmentStatus {
  Active = "Active",
  Returned = "Returned",
  Revoked = "Revoked",
  Handovered = "Handovered",
}

export enum AssignmentAction {
  Assigned = "Assigned",
  Returned = "Returned",
  Extended = "Extended",
  Reassigned = "Reassigned",
}

export enum TicketStatus {
  CREATED = "Ticket Created",
  Open = "Open",
  ReOpen = "ReOpen",
  AssigendSupport = "Support Engineer Assigned",
  InProgress = "InProgress",
  ServiceChecked = "Service Checked",
  ReviewShared = "Review Shared",
  Resolved = "Resolved",
  Approved = "Approved",
  Rejected = "Rejected",
  Closed = "Closed",
}

export enum AssetTransfer {
  HOLD = "HOLD",
  IN_TRANSIT = "IN_TRANSIT",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
}

export enum TicketAssetStatus {
  ProductReplaced = "Product Replaced",
  ProductInRepair = "Product In Repair",
}

export enum LogAction {
  GR_CREATE = "GR CREATED",
  INSTALLATION = "SOFTWARE INSTALLED",
  ASSIGN = "ASSIGN",
  HANDOVERED = "HANDOVERED",
  UN_ASSIGN = "UN ASSIGNED",
  REPAIR = "REPAIR",
  REPLACE = "REPLACE",
  ASSET_SERVICE = "ASSET SERVICE",
  TICKET = "Ticket",
  CANCEL_TRANSFER = "CANCEL_TRANSFER",
  ACCEPT_TRANSFER = "ACCEPT_TRANSFER",
  SAP_CODE_ADDED = "SAP_CODE_ADDED",
  PRODUCT_REQUEST = "PRODUCT_REQUEST",
}

export enum LogReportAction {}

export enum AssetStatus {
  E_WASTE = "E-WASTE",
  SERVICE_CHECKED = "SERVICE CHECKED",
  WRITE_OFF = "WRITE-OFF",
}

export enum Roles {
  SUPPORT_ENGINEER = "Support Engineer",
  SUPER_ADMIN = "Super Admin",
  SUPPORT_ADMIN = "Support Admin",
  USER = "User",
  ADMIN = "Admin",
  UNIT_ADMIN = "Unit Admin",
}

export enum TicketPriority {
  High = 4,
  Medium = 8,
  Low = 24,
}

export enum ProductRequestStatus {
  BLOCK = "BLOCK",
  OUT_OF_SERVICE = "OUT OF SERVICE",
  WAVE_OF = "WAVE OF",
  E_WASTE = "E-WASTE",
}

export enum RequestStatus {
  BLOCK = "BLOCK",
  OUT_OF_SERVICE = "OUT OF SERVICE",
  WAY_OF = "WAY OF",
  E_WASTE = "E WASTE",
  In_Stock = "In Stock",
}

export enum MailActions {
  ASSIGN_PRODUCT = "Assign Product",
  CREATE_GR = "Create Goods Receipt",
  SOFTWARE_INSTALLATION = "Software Installation",
  ASSIGNMENT_HANDOVERED = "Assignment Handovered",
  GR_CREATED = "Goods Receipt Created",
}
