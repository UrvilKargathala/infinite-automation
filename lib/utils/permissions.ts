import type { Role } from "@/types";

export type Action =
  | "deleteQuote"
  | "editProducts"
  | "excelImport"
  | "viewUsers"
  | "createPurchase"
  | "createAdmin"
  | "createSuperAdmin"
  | "editUser"
  | "editOwnRoleUser"
  | "deleteUser"
  | "viewAuditLog"
  | "exportAuditLog"
  | "editStock"
  | "manageComplaints";

export function can(role: Role, action: Action): boolean {
  switch (action) {
    case "deleteQuote":
    case "editProducts":
    case "excelImport":
    case "viewUsers":
      return role === "Super Admin" || role === "Admin";
    case "createPurchase":
      return role === "Super Admin" || role === "Admin";
    case "createAdmin":
    case "createSuperAdmin":
    case "deleteUser":
      return role === "Super Admin";
    case "editUser":
      return role === "Super Admin" || role === "Admin";
    case "editOwnRoleUser":
      // Admin may only edit/deactivate Purchase users, not other Admins/Super Admins
      return role === "Super Admin";
    case "viewAuditLog":
      return role === "Super Admin" || role === "Admin";
    case "exportAuditLog":
      return role === "Super Admin";
    case "editStock":
      // Stock counts, min buffer, POs and deliveries are open to every role (unlike product details)
      return true;
    case "manageComplaints":
      // Raise, edit, reassign, reopen and delete complaints. Engineers (any role) can still complete their own.
      return role === "Super Admin" || role === "Admin";
    default:
      return false;
  }
}
