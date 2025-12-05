import { useCallback, useMemo } from "react";

export interface SanitizeOptions {
  trimWhitespace?: boolean;
  removeHtml?: boolean;
  removeScripts?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  escapeHtml?: boolean;
  normalizeSpaces?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  removeEmojis?: boolean;
  removeSpecialChars?: boolean;
  allowedChars?: RegExp;
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

export function useSanitize(defaultOptions: SanitizeOptions = {}) {
  const escapeHtml = useCallback((str: string): string => {
    return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
  }, []);

  const unescapeHtml = useCallback((str: string): string => {
    const reverseEntities: Record<string, string> = {};
    Object.entries(HTML_ENTITIES).forEach(([char, entity]) => {
      reverseEntities[entity] = char;
    });
    return str.replace(/&(amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g, (entity) => {
      return reverseEntities[entity] || entity;
    });
  }, []);

  const removeHtmlTags = useCallback((str: string, allowedTags: string[] = []): string => {
    if (allowedTags.length === 0) {
      return str.replace(/<[^>]*>/g, "");
    }
    const allowedPattern = allowedTags.join("|");
    const regex = new RegExp(`<(?!\/?(?:${allowedPattern})\\b)[^>]*>`, "gi");
    return str.replace(regex, "");
  }, []);

  const removeScripts = useCallback((str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript:/gi, "");
  }, []);

  const normalizeSpaces = useCallback((str: string): string => {
    return str.replace(/\s+/g, " ").trim();
  }, []);

  const removeEmojis = useCallback((str: string): string => {
    return str.replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    );
  }, []);

  const removeSpecialChars = useCallback((str: string): string => {
    return str.replace(/[^\w\s]/gi, "");
  }, []);

  const sanitize = useCallback((input: string, options: SanitizeOptions = {}): string => {
    const opts = { ...defaultOptions, ...options };
    let result = input;

    if (opts.removeScripts) {
      result = removeScripts(result);
    }

    if (opts.removeHtml) {
      result = removeHtmlTags(result, opts.allowedTags);
    }

    if (opts.escapeHtml) {
      result = escapeHtml(result);
    }

    if (opts.trimWhitespace) {
      result = result.trim();
    }

    if (opts.normalizeSpaces) {
      result = normalizeSpaces(result);
    }

    if (opts.removeEmojis) {
      result = removeEmojis(result);
    }

    if (opts.removeSpecialChars) {
      result = removeSpecialChars(result);
    }

    if (opts.allowedChars) {
      result = result.split("").filter((char) => opts.allowedChars!.test(char)).join("");
    }

    if (opts.toLowerCase) {
      result = result.toLowerCase();
    }

    if (opts.toUpperCase) {
      result = result.toUpperCase();
    }

    if (opts.maxLength && result.length > opts.maxLength) {
      result = result.substring(0, opts.maxLength);
    }

    return result;
  }, [defaultOptions, removeScripts, removeHtmlTags, escapeHtml, normalizeSpaces, removeEmojis, removeSpecialChars]);

  const sanitizeEmail = useCallback((email: string): string => {
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, "");
  }, []);

  const sanitizePhone = useCallback((phone: string): string => {
    return phone.replace(/[^\d+\-\s()]/g, "").replace(/\s+/g, " ").trim();
  }, []);

  const sanitizeNumber = useCallback((input: string, allowDecimal = true): string => {
    if (allowDecimal) {
      return input.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "").replace(/^(-)?\./, "$1").replace(/(\..*)\./g, "$1");
    }
    return input.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
  }, []);

  const sanitizeUrl = useCallback((url: string): string => {
    const sanitized = url.trim().replace(/javascript:/gi, "").replace(/data:/gi, "");
    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      if (!sanitized.startsWith("http://") && !sanitized.startsWith("https://")) {
        return `https://${sanitized}`;
      }
      return sanitized;
    }
  }, []);

  const sanitizeFilename = useCallback((filename: string): string => {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/^\.+/, "")
      .substring(0, 255);
  }, []);

  const sanitizeSearchQuery = useCallback((query: string): string => {
    return query
      .replace(/[<>]/g, "")
      .replace(/['"]/g, "")
      .trim()
      .substring(0, 200);
  }, []);

  const sanitizeSqlLike = useCallback((input: string): string => {
    return input.replace(/[%_\\]/g, (char) => `\\${char}`);
  }, []);

  const sanitizeForRegex = useCallback((input: string): string => {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }, []);

  return {
    sanitize,
    escapeHtml,
    unescapeHtml,
    removeHtmlTags,
    removeScripts,
    normalizeSpaces,
    removeEmojis,
    removeSpecialChars,
    sanitizeEmail,
    sanitizePhone,
    sanitizeNumber,
    sanitizeUrl,
    sanitizeFilename,
    sanitizeSearchQuery,
    sanitizeSqlLike,
    sanitizeForRegex,
  };
}

export function createInputSanitizer<T extends Record<string, any>>(
  schema: Record<keyof T, SanitizeOptions>
) {
  return (data: T): T => {
    const sanitize = useSanitize();
    const result = { ...data };

    (Object.keys(schema) as (keyof T)[]).forEach((key) => {
      const value = result[key];
      if (typeof value === "string") {
        result[key] = sanitize.sanitize(value, schema[key]) as T[keyof T];
      }
    });

    return result;
  };
}

export const SANITIZE_PRESETS: Record<string, SanitizeOptions> = {
  text: {
    trimWhitespace: true,
    normalizeSpaces: true,
    removeScripts: true,
    escapeHtml: true,
  },
  richText: {
    trimWhitespace: true,
    removeScripts: true,
    allowedTags: ["b", "i", "u", "strong", "em", "br", "p", "ul", "ol", "li"],
  },
  plainText: {
    trimWhitespace: true,
    normalizeSpaces: true,
    removeHtml: true,
    escapeHtml: true,
  },
  searchQuery: {
    trimWhitespace: true,
    normalizeSpaces: true,
    removeHtml: true,
    maxLength: 200,
  },
  username: {
    trimWhitespace: true,
    toLowerCase: true,
    removeSpecialChars: false,
    allowedChars: /[a-z0-9_-]/,
    maxLength: 50,
  },
  filename: {
    trimWhitespace: true,
    maxLength: 255,
  },
};
