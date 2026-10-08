import type { Role } from "@/types";

export type Action =
  | "deleteQuote"
  | "editProducts"
  | "excelImport"
  | "viewUsers"
  | "createStaff"
  | "createAdmin"
  | "createSuperAdmin"
  | "editUser"
  | "editOwnRoleUser"
  | "deleteUser"
  | "viewAuditLog"
  | "exportAuditLog"
  | "editStock";

export function can(role: Role, action: Action): boolean {
  switch (action) {
    case "deleteQuote":
    case "editProducts":
    case "excelImport":
    case "viewUsers":
      return role === "Super Admin" || role === "Admin";
    case "createStaff":
      return role === "Super Admin" || role === "Admin";
    case "createAdmin":
    case "createSuperAdmin":
    case "deleteUser":
      return role === "Super Admin";
    case "editUser":
      return role === "Super Admin" || role === "Admin";
    case "editOwnRoleUser":
      // Admin may only edit/deactivate Staff users, not other Admins/Super Admins
      return role === "Super Admin";
    case "viewAuditLog":
      return role === "Super Admin" || role === "Admin";
    case "exportAuditLog":
      return role === "Super Admin";
    case "editStock":
      // Stock counts, min buffer, POs and deliveries are open to every role (unlike product details)
      return true;
    default:
      return false;
  }
}
