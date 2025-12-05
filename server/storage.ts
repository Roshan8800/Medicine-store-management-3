import { 
  users, type User, type InsertUser,
  suppliers, type Supplier, type InsertSupplier,
  categories, type Category, type InsertCategory,
  medicines, type Medicine, type InsertMedicine,
  batches, type Batch, type InsertBatch,
  invoices, type Invoice, type InsertInvoice,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem,
  purchaseOrders, type PurchaseOrder, type InsertPurchaseOrder,
  purchaseOrderItems, type PurchaseOrderItem,
  stockAdjustments, type StockAdjustment, type InsertStockAdjustment,
  auditLogs, type AuditLog,
  settings, type Setting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lte, gte, and, sql, ilike, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Suppliers
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | undefined>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Medicines
  getAllMedicines(): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicineByBarcode(barcode: string): Promise<Medicine | undefined>;
  searchMedicines(query: string): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: string, data: Partial<Medicine>): Promise<Medicine | undefined>;
  getLowStockMedicines(): Promise<any[]>;
  
  // Batches
  getBatchesByMedicine(medicineId: string): Promise<Batch[]>;
  getAvailableBatches(medicineId: string): Promise<Batch[]>;
  getBatch(id: string): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatchQuantity(id: string, quantity: number): Promise<Batch | undefined>;
  getExpiringBatches(daysAhead: number): Promise<any[]>;
  
  // Invoices
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: string): Promise<any>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  getNextInvoiceNumber(): Promise<string>;
  getDailySales(date: Date): Promise<any>;
  
  // Purchase Orders
  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder, items: any[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: string, status: string): Promise<PurchaseOrder | undefined>;
  
  // Stock Adjustments
  createStockAdjustment(adjustment: InsertStockAdjustment): Promise<StockAdjustment>;
  getStockAdjustments(medicineId?: string): Promise<StockAdjustment[]>;
  
  // Audit Logs
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.name);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Medicines
  async getAllMedicines(): Promise<Medicine[]> {
    return db.select().from(medicines).orderBy(medicines.name);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine || undefined;
  }

  async getMedicineByBarcode(barcode: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.barcode, barcode));
    return medicine || undefined;
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    return db.select().from(medicines).where(
      or(
        ilike(medicines.name, `%${query}%`),
        ilike(medicines.genericName, `%${query}%`),
        ilike(medicines.brand, `%${query}%`),
        eq(medicines.barcode, query)
      )
    ).limit(50);
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const [created] = await db.insert(medicines).values(medicine).returning();
    return created;
  }

  async updateMedicine(id: string, data: Partial<Medicine>): Promise<Medicine | undefined> {
    const [medicine] = await db
      .update(medicines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(medicines.id, id))
      .returning();
    return medicine;
  }

  async getLowStockMedicines(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT m.*, COALESCE(SUM(b.quantity), 0) as total_stock
      FROM medicines m
      LEFT JOIN batches b ON m.id = b.medicine_id
      WHERE m.is_active = true
      GROUP BY m.id
      HAVING COALESCE(SUM(b.quantity), 0) <= m.reorder_level
      ORDER BY total_stock ASC
    `);
    return result.rows as any[];
  }

  // Batches
  async getBatchesByMedicine(medicineId: string): Promise<Batch[]> {
    return db.select().from(batches)
      .where(eq(batches.medicineId, medicineId))
      .orderBy(batches.expiryDate);
  }

  async getAvailableBatches(medicineId: string): Promise<Batch[]> {
    const now = new Date();
    return db.select().from(batches)
      .where(
        and(
          eq(batches.medicineId, medicineId),
          gte(batches.quantity, 1),
          gte(batches.expiryDate, now)
        )
      )
      .orderBy(batches.expiryDate); // FEFO - First Expiry First Out
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [created] = await db.insert(batches).values(batch).returning();
    return created;
  }

  async updateBatchQuantity(id: string, quantity: number): Promise<Batch | undefined> {
    const [batch] = await db
      .update(batches)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return batch;
  }

  async getExpiringBatches(daysAhead: number): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const result = await db.execute(sql`
      SELECT b.*, m.name as medicine_name, m.brand
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.expiry_date <= ${futureDate}
      AND b.expiry_date >= NOW()
      AND b.quantity > 0
      ORDER BY b.expiry_date ASC
    `);
    return result.rows as any[];
  }

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceWithItems(id: string): Promise<any> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const items = await db.execute(sql`
      SELECT ii.*, m.name as medicine_name, m.brand, b.batch_number
      FROM invoice_items ii
      JOIN medicines m ON ii.medicine_id = m.id
      JOIN batches b ON ii.batch_id = b.id
      WHERE ii.invoice_id = ${id}
    `);
    
    return { ...invoice, items: items.rows };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    
    // Insert items and update batch quantities
    for (const item of items) {
      await db.insert(invoiceItems).values({ ...item, invoiceId: created.id });
      
      // Deduct from batch
      const batch = await this.getBatch(item.batchId);
      if (batch) {
        await this.updateBatchQuantity(item.batchId, batch.quantity - item.quantity);
      }
    }
    
    return created;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const today = new Date();
    const prefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM invoices 
      WHERE invoice_number LIKE ${prefix + '%'}
    `);
    
    const count = Number((result.rows[0] as any).count) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async getDailySales(date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(AVG(total_amount), 0) as avg_bill_value
      FROM invoices
      WHERE created_at >= ${startOfDay} AND created_at <= ${endOfDay}
    `);
    
    return result.rows[0];
  }

  // Purchase Orders
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po || undefined;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder, items: any[]): Promise<PurchaseOrder> {
    const [created] = await db.insert(purchaseOrders).values(po).returning();
    
    for (const item of items) {
      await db.insert(purchaseOrderItems).values({ ...item, purchaseOrderId: created.id });
    }
    
    return created;
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db
      .update(purchaseOrders)
      .set({ status, updatedAt: new Date(), receivedAt: status === 'received' ? new Date() : undefined })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return po;
  }

  // Stock Adjustments
  async createStockAdjustment(adjustment: InsertStockAdjustment): Promise<StockAdjustment> {
    const [created] = await db.insert(stockAdjustments).values(adjustment).returning();
    
    // Update batch quantity
    const batch = await this.getBatch(adjustment.batchId);
    if (batch) {
      let newQuantity = batch.quantity;
      if (adjustment.adjustmentType === 'add' || adjustment.adjustmentType === 'addition' || adjustment.adjustmentType === 'return') {
        newQuantity += adjustment.quantity;
      } else {
        // remove, damage, expired
        newQuantity -= adjustment.quantity;
      }
      await this.updateBatchQuantity(adjustment.batchId, Math.max(0, newQuantity));
    }
    
    return created;
  }

  async getStockAdjustments(medicineId?: string): Promise<StockAdjustment[]> {
    if (medicineId) {
      return db.select().from(stockAdjustments)
        .where(eq(stockAdjustments.medicineId, medicineId))
        .orderBy(desc(stockAdjustments.createdAt));
    }
    return db.select().from(stockAdjustments).orderBy(desc(stockAdjustments.createdAt));
  }

  // Audit Logs
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log as any).returning();
    return created;
  }

  async getAuditLogs(limit = 100): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `);
    return result.rows as any[];
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const today = new Date();
    const dailySales = await this.getDailySales(today);
    const lowStock = await this.getLowStockMedicines();
    const expiring = await this.getExpiringBatches(30);
    
    const medicineCount = await db.execute(sql`SELECT COUNT(*) as count FROM medicines WHERE is_active = true`);
    const supplierCount = await db.execute(sql`SELECT COUNT(*) as count FROM suppliers WHERE is_active = true`);
    
    // Weekly sales
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySales = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE created_at >= ${weekAgo}
    `);
    
    // Monthly sales
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlySales = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE created_at >= ${monthAgo}
    `);

    return {
      todaySales: dailySales,
      weeklySales: Number((weeklySales.rows[0] as any).total),
      monthlySales: Number((monthlySales.rows[0] as any).total),
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 5),
      expiringCount: expiring.length,
      expiringItems: expiring.slice(0, 5),
      totalMedicines: Number((medicineCount.rows[0] as any).count),
      totalSuppliers: Number((supplierCount.rows[0] as any).count),
    };
  }

  // Customers
  async getAllCustomers(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT customer_name as name, customer_phone as phone,
             MAX(created_at) as last_visit,
             COUNT(*) as total_purchases,
             SUM(total_amount) as total_amount
      FROM invoices
      WHERE customer_name IS NOT NULL AND customer_name != ''
      GROUP BY customer_name, customer_phone
      ORDER BY total_amount DESC
    `);
    return (result.rows as any[]).map((r, i) => ({
      id: `customer-${i}`,
      name: r.name,
      phone: r.phone,
      lastVisit: r.last_visit,
      totalPurchases: Number(r.total_amount),
    }));
  }

  async createCustomer(data: { name: string; phone?: string; email?: string; address?: string }): Promise<any> {
    return {
      id: `customer-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
  }

  async deleteCustomer(id: string): Promise<void> {
    // Customers are derived from invoices, so we can't delete them
  }

  // Category CRUD
  async updateCategory(id: string, data: Partial<Category>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Global Search
  async globalSearch(query: string, type: string): Promise<any[]> {
    const results: any[] = [];
    const searchQuery = `%${query}%`;

    if (type === "all" || type === "medicine") {
      const meds = await db.select().from(medicines)
        .where(or(
          ilike(medicines.name, searchQuery),
          ilike(medicines.genericName, searchQuery),
          ilike(medicines.brand, searchQuery)
        ))
        .limit(10);
      results.push(...meds.map(m => ({
        id: m.id,
        type: "medicine",
        title: m.name,
        subtitle: m.brand || m.genericName,
        metadata: `MRP: Rs ${m.mrp}`,
      })));
    }

    if (type === "all" || type === "invoice") {
      const invs = await db.select().from(invoices)
        .where(or(
          ilike(invoices.invoiceNumber, searchQuery),
          ilike(invoices.customerName, searchQuery)
        ))
        .limit(10);
      results.push(...invs.map(i => ({
        id: i.id,
        type: "invoice",
        title: i.invoiceNumber,
        subtitle: i.customerName || "Walk-in",
        metadata: `Rs ${i.totalAmount}`,
      })));
    }

    if (type === "all" || type === "supplier") {
      const sups = await db.select().from(suppliers)
        .where(or(
          ilike(suppliers.name, searchQuery),
          ilike(suppliers.email, searchQuery),
          ilike(suppliers.phone, searchQuery)
        ))
        .limit(10);
      results.push(...sups.map(s => ({
        id: s.id,
        type: "supplier",
        title: s.name,
        subtitle: s.phone || s.email,
        metadata: s.city || "",
      })));
    }

    return results;
  }

  // Analytics
  async getAnalytics(period: string): Promise<any> {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setDate(now.getDate() - 30);
        break;
      case "year":
        startDate.setDate(now.getDate() - 365);
        break;
    }

    const salesResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order
      FROM invoices
      WHERE created_at >= ${startDate}
    `);

    const topProductsResult = await db.execute(sql`
      SELECT m.name, SUM(ii.quantity) as quantity, SUM(ii.total) as revenue
      FROM invoice_items ii
      JOIN medicines m ON ii.medicine_id = m.id
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.created_at >= ${startDate}
      GROUP BY m.id, m.name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    const row = salesResult.rows[0] as any;
    
    return {
      totalSales: Number(row.total_sales),
      totalOrders: Number(row.total_orders),
      averageOrderValue: Number(row.avg_order),
      topProducts: (topProductsResult.rows as any[]).map(p => ({
        name: p.name,
        quantity: Number(p.quantity),
        revenue: Number(p.revenue),
      })),
      salesTrend: [],
      categoryDistribution: [],
    };
  }

  // Export all data
  async exportAllData(): Promise<any> {
    const [
      allMedicines,
      allSuppliers,
      allCategories,
      allInvoices,
      allBatches,
      allUsers
    ] = await Promise.all([
      this.getAllMedicines(),
      this.getAllSuppliers(),
      this.getAllCategories(),
      this.getAllInvoices(),
      db.select().from(batches),
      this.getAllUsers(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        medicines: allMedicines,
        suppliers: allSuppliers,
        categories: allCategories,
        invoices: allInvoices,
        batches: allBatches,
        users: allUsers.map(u => ({ ...u, password: undefined })),
      },
    };
  }

  // Import data
  async importData(data: any): Promise<void> {
    // This is a simplified import - in production you'd want transactions and validation
    if (data.data?.medicines) {
      for (const med of data.data.medicines) {
        try {
          await this.createMedicine(med);
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    if (data.data?.suppliers) {
      for (const sup of data.data.suppliers) {
        try {
          await this.createSupplier(sup);
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    if (data.data?.categories) {
      for (const cat of data.data.categories) {
        try {
          await this.createCategory(cat);
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }

  // Notifications
  async getNotifications(userId: string): Promise<any[]> {
    const expiring = await this.getExpiringBatches(30);
    const lowStock = await this.getLowStockMedicines();
    
    const notifications: any[] = [];
    
    expiring.slice(0, 5).forEach((item, i) => {
      notifications.push({
        id: `exp-${i}`,
        title: "Expiry Alert",
        body: `${item.medicine_name} expires on ${new Date(item.expiry_date).toLocaleDateString()}`,
        type: "expiry",
        read: false,
        createdAt: new Date(),
      });
    });
    
    lowStock.slice(0, 5).forEach((item, i) => {
      notifications.push({
        id: `low-${i}`,
        title: "Low Stock Alert",
        body: `${item.name} is running low (${item.total_stock} units)`,
        type: "lowStock",
        read: false,
        createdAt: new Date(),
      });
    });
    
    return notifications;
  }
}

export const storage = new DatabaseStorage();
