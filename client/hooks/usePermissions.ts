import { useState, useCallback, useMemo, useContext, createContext, ReactNode } from "react";
import React from "react";

export type Permission = 
  | "view_inventory"
  | "edit_inventory"
  | "delete_inventory"
  | "view_sales"
  | "create_sale"
  | "void_sale"
  | "view_reports"
  | "export_reports"
  | "manage_users"
  | "manage_settings"
  | "view_analytics"
  | "manage_suppliers"
  | "approve_purchases"
  | "manage_categories"
  | "view_audit_log"
  | "manage_roles"
  | "backup_data"
  | "restore_data"
  | "access_ai_features"
  | "custom";

export type Role = "owner" | "admin" | "manager" | "pharmacist" | "cashier" | "viewer" | "custom";

export interface RoleConfig {
  name: string;
  description: string;
  permissions: Permission[];
  inheritsFrom?: Role;
}

const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "view_inventory", "edit_inventory", "delete_inventory",
    "view_sales", "create_sale", "void_sale",
    "view_reports", "export_reports",
    "manage_users", "manage_settings",
    "view_analytics", "manage_suppliers",
    "approve_purchases", "manage_categories",
    "view_audit_log", "manage_roles",
    "backup_data", "restore_data", "access_ai_features"
  ],
  admin: [
    "view_inventory", "edit_inventory", "delete_inventory",
    "view_sales", "create_sale", "void_sale",
    "view_reports", "export_reports",
    "manage_users", "manage_settings",
    "view_analytics", "manage_suppliers",
    "approve_purchases", "manage_categories",
    "view_audit_log", "access_ai_features"
  ],
  manager: [
    "view_inventory", "edit_inventory",
    "view_sales", "create_sale", "void_sale",
    "view_reports", "export_reports",
    "view_analytics", "manage_suppliers",
    "approve_purchases", "manage_categories",
    "access_ai_features"
  ],
  pharmacist: [
    "view_inventory", "edit_inventory",
    "view_sales", "create_sale",
    "view_reports",
    "access_ai_features"
  ],
  cashier: [
    "view_inventory",
    "view_sales", "create_sale"
  ],
  viewer: [
    "view_inventory",
    "view_sales",
    "view_reports"
  ],
  custom: []
};

interface PermissionContextValue {
  userRole: Role;
  customPermissions: Permission[];
  setUserRole: (role: Role) => void;
  setCustomPermissions: (permissions: Permission[]) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  getPermissions: () => Permission[];
  canAccess: (requiredPermissions: Permission[], requireAll?: boolean) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ 
  children,
  initialRole = "viewer",
  initialCustomPermissions = []
}: { 
  children: ReactNode;
  initialRole?: Role;
  initialCustomPermissions?: Permission[];
}) {
  const [userRole, setUserRole] = useState<Role>(initialRole);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>(initialCustomPermissions);

  const getPermissions = useCallback((): Permission[] => {
    if (userRole === "custom") {
      return customPermissions;
    }
    return DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  }, [userRole, customPermissions]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    const permissions = getPermissions();
    return permissions.includes(permission);
  }, [getPermissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  }, [hasPermission]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const canAccess = useCallback((requiredPermissions: Permission[], requireAll = true): boolean => {
    return requireAll 
      ? hasAllPermissions(requiredPermissions) 
      : hasAnyPermission(requiredPermissions);
  }, [hasAllPermissions, hasAnyPermission]);

  const value: PermissionContextValue = {
    userRole,
    customPermissions,
    setUserRole,
    setCustomPermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getPermissions,
    canAccess,
  };

  return React.createElement(PermissionContext.Provider, { value }, children);
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  
  if (!context) {
    return {
      userRole: "viewer" as Role,
      customPermissions: [] as Permission[],
      setUserRole: () => {},
      setCustomPermissions: () => {},
      hasPermission: () => false,
      hasAllPermissions: () => false,
      hasAnyPermission: () => false,
      getPermissions: () => [] as Permission[],
      canAccess: () => false,
    };
  }

  return context;
}

export function useRequirePermission(permission: Permission, fallback?: () => void) {
  const { hasPermission } = usePermissions();
  const hasAccess = hasPermission(permission);

  const checkAndExecute = useCallback(<T extends (...args: any[]) => any>(action: T) => {
    return (...args: Parameters<T>) => {
      if (hasAccess) {
        return action(...args);
      }
      if (fallback) {
        fallback();
      }
      return undefined;
    };
  }, [hasAccess, fallback]);

  return { hasAccess, checkAndExecute };
}

export function useRoleCheck() {
  const { userRole, hasPermission, canAccess } = usePermissions();

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin" || isOwner;
  const isManager = userRole === "manager" || isAdmin;
  const isStaff = ["pharmacist", "cashier"].includes(userRole) || isManager;

  const canManageInventory = hasPermission("edit_inventory");
  const canManageSales = hasPermission("create_sale");
  const canManageUsers = hasPermission("manage_users");
  const canViewReports = hasPermission("view_reports");
  const canExportData = hasPermission("export_reports");
  const canAccessAI = hasPermission("access_ai_features");

  return {
    userRole,
    isOwner,
    isAdmin,
    isManager,
    isStaff,
    canManageInventory,
    canManageSales,
    canManageUsers,
    canViewReports,
    canExportData,
    canAccessAI,
    hasPermission,
    canAccess,
  };
}

export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    pharmacist: "Pharmacist",
    cashier: "Cashier",
    viewer: "Viewer",
    custom: "Custom Role",
  };
  return names[role];
}

export function getPermissionDisplayName(permission: Permission): string {
  const names: Record<Permission, string> = {
    view_inventory: "View Inventory",
    edit_inventory: "Edit Inventory",
    delete_inventory: "Delete Inventory",
    view_sales: "View Sales",
    create_sale: "Create Sale",
    void_sale: "Void Sale",
    view_reports: "View Reports",
    export_reports: "Export Reports",
    manage_users: "Manage Users",
    manage_settings: "Manage Settings",
    view_analytics: "View Analytics",
    manage_suppliers: "Manage Suppliers",
    approve_purchases: "Approve Purchases",
    manage_categories: "Manage Categories",
    view_audit_log: "View Audit Log",
    manage_roles: "Manage Roles",
    backup_data: "Backup Data",
    restore_data: "Restore Data",
    access_ai_features: "Access AI Features",
    custom: "Custom Permission",
  };
  return names[permission];
}
