import type { DocumentMetadata } from "./stellar";
import { sha256Hex } from "./crypto";

export type DocumentMetadataInput = {
  type: string;
  number: string;
  issueDate: string;
  expiryDate?: string | null;
};

export function buildDocumentMetadata(input: DocumentMetadataInput): DocumentMetadata {
  return {
    type: input.type,
    number: input.number,
    issueDate: input.issueDate,
    expiryDate: input.expiryDate ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function encodeDocumentMetadata(metadata: DocumentMetadata): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}

export function decodeDocumentMetadata(
  uri?: string | null,
  fallback?: DocumentMetadata,
): DocumentMetadata {
  if (!uri) {
    return fallback ?? {
      type: "Documento",
      number: "",
      issueDate: "",
      expiryDate: null,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const [, payload] = uri.split(",", 2);
    const decoded = payload ? JSON.parse(decodeURIComponent(payload)) : JSON.parse(uri);
    return {
      type: String(decoded.type ?? fallback?.type ?? "Documento"),
      number: String(decoded.number ?? fallback?.number ?? ""),
      issueDate: String(decoded.issueDate ?? fallback?.issueDate ?? ""),
      expiryDate: decoded.expiryDate ? String(decoded.expiryDate) : fallback?.expiryDate ?? null,
      createdAt: String(decoded.createdAt ?? fallback?.createdAt ?? new Date().toISOString()),
    };
  } catch {
    return fallback ?? {
      type: "Documento",
      number: "",
      issueDate: "",
      expiryDate: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function computeDocumentHash(publicKey: string, metadata: DocumentMetadata): Promise<string> {
  return sha256Hex(JSON.stringify({ publicKey, ...metadata }));
}
