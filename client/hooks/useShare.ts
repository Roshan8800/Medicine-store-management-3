import { useCallback, useState } from "react";
import { Platform, Share } from "react-native";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import * as Print from "expo-print";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

interface ShareContent {
  title?: string;
  message: string;
  url?: string;
}

interface ShareResult {
  success: boolean;
  action?: string;
  activityType?: string;
}

interface UseShareResult {
  isSharing: boolean;
  lastShareResult: ShareResult | null;
  share: (content: ShareContent) => Promise<ShareResult>;
  shareFile: (fileUri: string, mimeType?: string) => Promise<boolean>;
  shareImage: (imageUri: string) => Promise<boolean>;
  sharePDF: (html: string, filename?: string) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<void>;
  canShare: () => Promise<boolean>;
}

export function useShare(): UseShareResult {
  const [isSharing, setIsSharing] = useState(false);
  const [lastShareResult, setLastShareResult] = useState<ShareResult | null>(null);

  const share = useCallback(async (content: ShareContent): Promise<ShareResult> => {
    setIsSharing(true);
    try {
      const result = await Share.share({
        title: content.title,
        message: content.message,
        url: content.url,
      });

      const shareResult: ShareResult = {
        success: result.action === Share.sharedAction,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };

      setLastShareResult(shareResult);

      if (shareResult.success && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return shareResult;
    } catch {
      const failResult: ShareResult = { success: false };
      setLastShareResult(failResult);
      return failResult;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareFile = useCallback(
    async (fileUri: string, mimeType = "application/octet-stream"): Promise<boolean> => {
      setIsSharing(true);
      try {
        const canShareFile = await Sharing.isAvailableAsync();
        if (!canShareFile) {
          return false;
        }

        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: "Share File",
        });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return true;
      } catch {
        return false;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  const shareImage = useCallback(
    async (imageUri: string): Promise<boolean> => {
      return shareFile(imageUri, "image/png");
    },
    [shareFile]
  );

  const sharePDF = useCallback(
    async (html: string, filename = "document.pdf"): Promise<boolean> => {
      setIsSharing(true);
      try {
        const { uri } = await Print.printToFileAsync({ html });

        const pdfFile = new File(Paths.document, filename);
        const sourceFile = new File(uri);
        await sourceFile.move(pdfFile);

        const canShareFile = await Sharing.isAvailableAsync();
        if (!canShareFile) {
          return false;
        }

        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share PDF",
        });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return true;
      } catch {
        return false;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  const copyToClipboard = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const canShare = useCallback(async (): Promise<boolean> => {
    return await Sharing.isAvailableAsync();
  }, []);

  return {
    isSharing,
    lastShareResult,
    share,
    shareFile,
    shareImage,
    sharePDF,
    copyToClipboard,
    canShare,
  };
}

export function generateInvoiceHTML(invoice: {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
}): string {
  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #4A90A4; margin: 0; }
        .header p { margin: 5px 0; color: #666; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #4A90A4; color: white; padding: 10px; text-align: left; }
        .totals { text-align: right; }
        .totals td { padding: 5px 0; }
        .total-row { font-weight: bold; font-size: 18px; color: #4A90A4; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${invoice.pharmacyName}</h1>
        <p>${invoice.pharmacyAddress}</p>
        <p>Phone: ${invoice.pharmacyPhone}</p>
      </div>
      
      <div class="invoice-info">
        <div>
          <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
          <strong>Date:</strong> ${invoice.date}
        </div>
      </div>
      
      <div class="customer-info">
        <strong>Bill To:</strong><br>
        ${invoice.customerName}<br>
        ${invoice.customerAddress || ""}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      
      <table class="totals">
        <tr>
          <td>Subtotal:</td>
          <td style="width: 100px;">₹${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax:</td>
          <td>₹${invoice.tax.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total:</td>
          <td>₹${invoice.total.toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateReportHTML(report: {
  title: string;
  date: string;
  period: string;
  sections: Array<{
    title: string;
    data: Array<{ label: string; value: string | number }>;
  }>;
  pharmacyName: string;
}): string {
  const sectionHtml = report.sections
    .map(
      (section) => `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #4A90A4; border-bottom: 2px solid #4A90A4; padding-bottom: 5px;">
          ${section.title}
        </h3>
        <table style="width: 100%;">
          ${section.data
            .map(
              (row) => `
            <tr>
              <td style="padding: 8px 0;">${row.label}</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${row.value}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #4A90A4; margin: 0; }
        .header h2 { color: #666; margin: 10px 0 5px; }
        .header p { margin: 5px 0; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${report.pharmacyName}</h1>
        <h2>${report.title}</h2>
        <p>Period: ${report.period}</p>
        <p>Generated: ${report.date}</p>
      </div>
      ${sectionHtml}
    </body>
    </html>
  `;
}
