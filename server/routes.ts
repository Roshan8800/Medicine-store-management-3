import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, insertSupplierSchema, insertCategorySchema,
  insertMedicineSchema, insertBatchSchema, insertInvoiceSchema,
  insertStockAdjustmentSchema
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "binayak-pharmacy-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ AUTH ROUTES ============
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      await storage.createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
        details: { username: user.username }
      });
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Register (first user becomes owner)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }
      
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Check if this is the first user
      const allUsers = await storage.getAllUsers();
      const role = allUsers.length === 0 ? 'owner' : (result.data.role || 'cashier');
      
      const user = await storage.createUser({ ...result.data, role });
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser((req as any).user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ DASHBOARD ============
  
  app.get("/api/dashboard/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ USERS ============
  
  app.get("/api/users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ SUPPLIERS ============
  
  app.get("/api/suppliers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Get suppliers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/suppliers/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Get supplier error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid supplier data", errors: result.error.errors });
      }
      const supplier = await storage.createSupplier(result.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Create supplier error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/suppliers/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const supplier = await storage.updateSupplier(req.params.id, req.body);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Update supplier error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ CATEGORIES ============
  
  app.get("/api/categories", authenticateToken, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid category data", errors: result.error.errors });
      }
      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ MEDICINES ============
  
  app.get("/api/medicines", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      let medicines;
      if (search && typeof search === 'string') {
        medicines = await storage.searchMedicines(search);
      } else {
        medicines = await storage.getAllMedicines();
      }
      res.json(medicines);
    } catch (error) {
      console.error("Get medicines error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/medicines/low-stock", authenticateToken, async (req: Request, res: Response) => {
    try {
      const medicines = await storage.getLowStockMedicines();
      res.json(medicines);
    } catch (error) {
      console.error("Get low stock error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/medicines/barcode/:barcode", authenticateToken, async (req: Request, res: Response) => {
    try {
      const medicine = await storage.getMedicineByBarcode(req.params.barcode);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      const batches = await storage.getAvailableBatches(medicine.id);
      res.json({ ...medicine, batches });
    } catch (error) {
      console.error("Get medicine by barcode error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/medicines/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const medicine = await storage.getMedicine(req.params.id);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      const batches = await storage.getBatchesByMedicine(medicine.id);
      res.json({ ...medicine, batches });
    } catch (error) {
      console.error("Get medicine error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/medicines", authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = insertMedicineSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid medicine data", errors: result.error.errors });
      }
      const medicine = await storage.createMedicine(result.data);
      res.status(201).json(medicine);
    } catch (error) {
      console.error("Create medicine error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/medicines/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const medicine = await storage.updateMedicine(req.params.id, req.body);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      console.error("Update medicine error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ BATCHES ============
  
  app.get("/api/batches/expiring", authenticateToken, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const batches = await storage.getExpiringBatches(days);
      res.json(batches);
    } catch (error) {
      console.error("Get expiring batches error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/batches/:medicineId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const batches = await storage.getBatchesByMedicine(req.params.medicineId);
      res.json(batches);
    } catch (error) {
      console.error("Get batches error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/batches", authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = insertBatchSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid batch data", errors: result.error.errors });
      }
      const batch = await storage.createBatch(result.data);
      res.status(201).json(batch);
    } catch (error) {
      console.error("Create batch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ INVOICES ============
  
  app.get("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/invoices/next-number", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoiceNumber = await storage.getNextInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (error) {
      console.error("Get next invoice number error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/invoices/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { items, ...invoiceData } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Invoice must have at least one item" });
      }
      
      invoiceData.userId = (req as any).user.id;
      invoiceData.invoiceNumber = await storage.getNextInvoiceNumber();
      
      const invoice = await storage.createInvoice(invoiceData, items);
      
      await storage.createAuditLog({
        userId: (req as any).user.id,
        action: 'CREATE_INVOICE',
        entityType: 'invoice',
        entityId: invoice.id,
        details: { invoiceNumber: invoice.invoiceNumber, total: invoiceData.totalAmount }
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ PURCHASE ORDERS ============
  
  app.get("/api/purchase-orders", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("Get purchase orders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/purchase-orders", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { items, ...poData } = req.body;
      poData.userId = (req as any).user.id;
      poData.poNumber = `PO${Date.now()}`;
      
      const order = await storage.createPurchaseOrder(poData, items);
      res.status(201).json(order);
    } catch (error) {
      console.error("Create purchase order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/purchase-orders/:id/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const order = await storage.updatePurchaseOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update purchase order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ STOCK ADJUSTMENTS ============
  
  app.get("/api/stock-adjustments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const medicineId = req.query.medicineId as string | undefined;
      const adjustments = await storage.getStockAdjustments(medicineId);
      res.json(adjustments);
    } catch (error) {
      console.error("Get stock adjustments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/stock-adjustments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = insertStockAdjustmentSchema.safeParse({
        ...req.body,
        userId: (req as any).user.id
      });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid adjustment data", errors: result.error.errors });
      }
      const adjustment = await storage.createStockAdjustment(result.data);
      
      await storage.createAuditLog({
        userId: (req as any).user.id,
        action: 'STOCK_ADJUSTMENT',
        entityType: 'batch',
        entityId: req.body.batchId,
        details: { type: req.body.adjustmentType, quantity: req.body.quantity, reason: req.body.reason }
      });
      
      res.status(201).json(adjustment);
    } catch (error) {
      console.error("Create stock adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ AUDIT LOGS ============
  
  app.get("/api/audit-logs", authenticateToken, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ REPORTS ============
  
  app.get("/api/reports/sales", authenticateToken, async (req: Request, res: Response) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const sales = await storage.getDailySales(date);
      res.json(sales);
    } catch (error) {
      console.error("Get sales report error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ CUSTOMERS ============
  
  app.get("/api/customers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ SEARCH ============
  
  app.get("/api/search", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { q, type } = req.query;
      const query = (q as string) || "";
      const searchType = (type as string) || "all";
      
      const results = await storage.globalSearch(query, searchType);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ ANALYTICS ============
  
  app.get("/api/analytics", authenticateToken, async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "week";
      const analytics = await storage.getAnalytics(period);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ CATEGORY CRUD ============
  
  app.patch("/api/categories/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ PURCHASE ORDERS CRUD ============
  
  app.patch("/api/purchase-orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const order = await storage.updatePurchaseOrderStatus(req.params.id, req.body.status);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update purchase order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ BACKUP & RESTORE ============
  
  app.get("/api/backup/export", authenticateToken, async (req: Request, res: Response) => {
    try {
      const backup = await storage.exportAllData();
      res.json(backup);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/backup/import", authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.importData(req.body);
      res.json({ message: "Data imported successfully" });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ NOTIFICATIONS ============
  
  app.get("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotifications((req as any).user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ AI FEATURES ============
  
  app.post("/api/ai/chat", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { chatWithAI } = await import("./ai");
      const { message, context } = req.body;
      const result = await chatWithAI(message, context);
      res.json(result);
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/drug-interactions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { checkDrugInteractions } = await import("./ai");
      const { drugs } = req.body;
      const result = await checkDrugInteractions(drugs);
      res.json(result);
    } catch (error) {
      console.error("Drug interactions error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/alternatives", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { suggestAlternatives } = await import("./ai");
      const { medicine, reason } = req.body;
      const result = await suggestAlternatives(medicine, reason);
      res.json(result);
    } catch (error) {
      console.error("Alternatives error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/predict-demand", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { predictDemand } = await import("./ai");
      const { medicineHistory } = req.body;
      const result = await predictDemand(medicineHistory);
      res.json(result);
    } catch (error) {
      console.error("Predict demand error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/smart-search", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { smartSearch } = await import("./ai");
      const { query, context } = req.body;
      const result = await smartSearch(query, context);
      res.json(result);
    } catch (error) {
      console.error("Smart search error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/sales-insights", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { generateSalesInsights } = await import("./ai");
      const { salesData } = req.body;
      const result = await generateSalesInsights(salesData);
      res.json(result);
    } catch (error) {
      console.error("Sales insights error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/analyze-prescription", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { analyzePrescription } = await import("./ai");
      const { prescriptionText } = req.body;
      const result = await analyzePrescription(prescriptionText);
      res.json(result);
    } catch (error) {
      console.error("Prescription analysis error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/expiry-risk", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { predictExpiryRisk } = await import("./ai");
      const { batches } = req.body;
      const result = await predictExpiryRisk(batches);
      res.json(result);
    } catch (error) {
      console.error("Expiry risk error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/customer-insights", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { generateCustomerInsights } = await import("./ai");
      const { customerData } = req.body;
      const result = await generateCustomerInsights(customerData);
      res.json(result);
    } catch (error) {
      console.error("Customer insights error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/optimize-pricing", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { optimizePricing } = await import("./ai");
      const { medicines } = req.body;
      const result = await optimizePricing(medicines);
      res.json(result);
    } catch (error) {
      console.error("Price optimization error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  app.post("/api/ai/inventory-summary", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { summarizeInventoryStatus } = await import("./ai");
      const { inventory } = req.body;
      const result = await summarizeInventoryStatus(inventory);
      res.json(result);
    } catch (error) {
      console.error("Inventory summary error:", error);
      res.status(500).json({ success: false, error: "AI service unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
