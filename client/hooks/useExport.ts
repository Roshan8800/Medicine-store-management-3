import { useState, useCallback } from "react";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Platform } from "react-native";

type ExportFormat = "csv" | "json" | "pdf" | "excel";

interface ExportColumn<T> {
  key: keyof T;
  header: string;
  format?: (value: T[keyof T], row: T) => string;
}

interface ExportConfig<T> {
  filename: string;
  columns: ExportColumn<T>[];
  title?: string;
  subtitle?: string;
}

interface UseExportResult<T> {
  isExporting: boolean;
  error: string | null;
  exportToCSV: (data: T[], config: ExportConfig<T>) => Promise<string | null>;
  exportToJSON: (data: T[], filename: string) => Promise<string | null>;
  exportToPDF: (data: T[], config: ExportConfig<T>) => Promise<string | null>;
  exportToExcel: (data: T[], config: ExportConfig<T>) => Promise<string | null>;
  shareExport: (fileUri: string, mimeType: string) => Promise<boolean>;
}

export function useExport<T extends Record<string, unknown>>(): UseExportResult<T> {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatValue = useCallback(
    (value: unknown, column: ExportColumn<T>, row: T): string => {
      if (column.format) {
        return column.format(value as T[keyof T], row);
      }
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    []
  );

  const generateCSV = useCallback(
    (data: T[], config: ExportConfig<T>): string => {
      const headers = config.columns.map((col) => `"${col.header}"`).join(",");
      const rows = data.map((row) =>
        config.columns
          .map((col) => {
            const value = formatValue(row[col.key], col, row);
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      );
      return [headers, ...rows].join("\n");
    },
    [formatValue]
  );

  const generateExcelXML = useCallback(
    (data: T[], config: ExportConfig<T>): string => {
      const headerCells = config.columns
        .map((col) => `<Cell><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`)
        .join("");

      const dataRows = data
        .map((row) => {
          const cells = config.columns
            .map((col) => {
              const value = formatValue(row[col.key], col, row);
              const type = typeof row[col.key] === "number" ? "Number" : "String";
              return `<Cell><Data ss:Type="${type}">${escapeXML(value)}</Data></Cell>`;
            })
            .join("");
          return `<Row>${cells}</Row>`;
        })
        .join("");

      return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#4A90A4" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row ss:StyleID="Header">${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
    },
    [formatValue]
  );

  const generatePDFHTML = useCallback(
    (data: T[], config: ExportConfig<T>): string => {
      const headerCells = config.columns
        .map((col) => `<th style="padding: 10px; background: #4A90A4; color: white; text-align: left;">${col.header}</th>`)
        .join("");

      const dataRows = data
        .map((row, index) => {
          const cells = config.columns
            .map((col) => {
              const value = formatValue(row[col.key], col, row);
              return `<td style="padding: 8px; border-bottom: 1px solid #eee;">${value}</td>`;
            })
            .join("");
          const bgColor = index % 2 === 0 ? "#fff" : "#f9f9f9";
          return `<tr style="background: ${bgColor};">${cells}</tr>`;
        })
        .join("");

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${config.title || config.filename}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #4A90A4; margin-bottom: 5px; }
    .subtitle { color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    .footer { margin-top: 20px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  ${config.title ? `<h1>${config.title}</h1>` : ""}
  ${config.subtitle ? `<p class="subtitle">${config.subtitle}</p>` : ""}
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
    },
    [formatValue]
  );

  const saveFile = useCallback(
    async (content: string, filename: string): Promise<string | null> => {
      if (Platform.OS === "web") {
        return null;
      }

      const file = new File(Paths.document, filename);
      await file.write(content);
      return file.uri;
    },
    []
  );

  const exportToCSV = useCallback(
    async (data: T[], config: ExportConfig<T>): Promise<string | null> => {
      setIsExporting(true);
      setError(null);

      try {
        const csv = generateCSV(data, config);
        const filename = `${config.filename}_${Date.now()}.csv`;
        const fileUri = await saveFile(csv, filename);
        return fileUri;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(message);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [generateCSV, saveFile]
  );

  const exportToJSON = useCallback(
    async (data: T[], filename: string): Promise<string | null> => {
      setIsExporting(true);
      setError(null);

      try {
        const json = JSON.stringify(data, null, 2);
        const fullFilename = `${filename}_${Date.now()}.json`;
        const fileUri = await saveFile(json, fullFilename);
        return fileUri;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(message);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [saveFile]
  );

  const exportToPDF = useCallback(
    async (data: T[], config: ExportConfig<T>): Promise<string | null> => {
      setIsExporting(true);
      setError(null);

      try {
        const html = generatePDFHTML(data, config);
        const { uri } = await Print.printToFileAsync({ html });
        
        const filename = `${config.filename}_${Date.now()}.pdf`;
        const pdfFile = new File(Paths.document, filename);
        const sourceFile = new File(uri);
        await sourceFile.move(pdfFile);

        return pdfFile.uri;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(message);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [generatePDFHTML]
  );

  const exportToExcel = useCallback(
    async (data: T[], config: ExportConfig<T>): Promise<string | null> => {
      setIsExporting(true);
      setError(null);

      try {
        const xml = generateExcelXML(data, config);
        const filename = `${config.filename}_${Date.now()}.xls`;
        const fileUri = await saveFile(xml, filename);
        return fileUri;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(message);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [generateExcelXML, saveFile]
  );

  const shareExport = useCallback(
    async (fileUri: string, mimeType: string): Promise<boolean> => {
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) return false;

        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: "Share Export",
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return {
    isExporting,
    error,
    exportToCSV,
    exportToJSON,
    exportToPDF,
    exportToExcel,
    shareExport,
  };
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createProductExportConfig(): ExportConfig<{
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  supplier: string;
}> {
  return {
    filename: "products_export",
    title: "Product Inventory Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { key: "id", header: "Product ID" },
      { key: "name", header: "Product Name" },
      { key: "sku", header: "SKU" },
      { key: "category", header: "Category" },
      { key: "price", header: "Price", format: (v) => `₹${Number(v).toFixed(2)}` },
      { key: "stock", header: "Stock Qty" },
      { key: "supplier", header: "Supplier" },
    ],
  };
}

export function createOrderExportConfig(): ExportConfig<{
  id: string;
  date: string;
  customer: string;
  items: number;
  total: number;
  status: string;
}> {
  return {
    filename: "orders_export",
    title: "Orders Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { key: "id", header: "Order ID" },
      { key: "date", header: "Date" },
      { key: "customer", header: "Customer" },
      { key: "items", header: "Items" },
      { key: "total", header: "Total", format: (v) => `₹${Number(v).toFixed(2)}` },
      { key: "status", header: "Status" },
    ],
  };
}

export function createInventoryExportConfig(): ExportConfig<{
  id: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  location: string;
}> {
  return {
    filename: "inventory_export",
    title: "Inventory Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { key: "id", header: "Inventory ID" },
      { key: "productName", header: "Product" },
      { key: "batchNumber", header: "Batch No." },
      { key: "quantity", header: "Quantity" },
      { key: "expiryDate", header: "Expiry Date" },
      { key: "location", header: "Location" },
    ],
  };
}
