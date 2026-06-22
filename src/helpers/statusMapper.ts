import { AssignedStatus } from "@src/enum/enum";

export function mapStatusParamToEnum(
  statusParam: string
): AssignedStatus | null {
  switch (statusParam) {
    case "InStock":
      return AssignedStatus.InStock;
    case "InstallationCompleted":
      return AssignedStatus.InstallationCompleted;
    case "ASSIGNED":
      return AssignedStatus.ASSIGNED;
    case "BLOCKED":
      return AssignedStatus.BLOCKED;
    case "E_WASTE":
      return AssignedStatus.E_WASTE;
    case "SCRAP":
      return AssignedStatus.SCRAP;
    default:
      return null;
  }
}
