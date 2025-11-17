import { apiRequest, type ApiRequestOptions } from "./api";

export interface DocumentDto {
  id: number;
  ownerEmail: string;
  ownerPublicKey: string;
  docType: string;
  docNumber: string;
  hash: string;
  createdAt: string;
  issueDate: string;
  expiryDate?: string | null;
  metadataUri?: string | null;
  sharedWith: string[];
}

export interface DocumentPermissionDto {
  documentId: number;
  ownerPublicKey: string;
  targetPublicKey: string;
  grantedAt: string;
}

export interface CreateDocumentPayload {
  ownerEmail: string;
  ownerPublicKey: string;
  docType: string;
  docNumber: string;
  hash: string;
  issueDate: string;
  expiryDate?: string | null;
  metadataUri?: string | null;
}

export interface ShareDocumentPayload {
  ownerPublicKey: string;
  targetPublicKey: string;
}

function withToken(token?: string): Pick<ApiRequestOptions, "token"> {
  return token ? { token } : {};
}

export function fetchOwnedDocuments(ownerPublicKey: string, token?: string) {
  const query = new URLSearchParams({ ownerPublicKey }).toString();
  return apiRequest<DocumentDto[]>(`/documents?${query}`, withToken(token));
}

export function fetchSharedDocuments(targetPublicKey: string, token?: string) {
  const query = new URLSearchParams({ targetPublicKey }).toString();
  return apiRequest<DocumentDto[]>(`/documents/shared?${query}`, withToken(token));
}

export function createDocument(payload: CreateDocumentPayload, token?: string) {
  return apiRequest<DocumentDto>("/documents", {
    method: "POST",
    body: payload,
    ...withToken(token),
  });
}

export function shareDocument(documentId: number, payload: ShareDocumentPayload, token?: string) {
  return apiRequest<DocumentPermissionDto>(`/documents/${documentId}/share`, {
    method: "POST",
    body: payload,
    ...withToken(token),
  });
}

export function revokeDocumentShare(
  documentId: number,
  ownerPublicKey: string,
  targetPublicKey: string,
  token?: string,
) {
  const query = new URLSearchParams({ ownerPublicKey, targetPublicKey }).toString();
  return apiRequest<null>(`/documents/${documentId}/share?${query}`, {
    method: "DELETE",
    ...withToken(token),
  });
}

export function listDocumentPermissions(documentId: number, ownerPublicKey: string, token?: string) {
  const query = new URLSearchParams({ ownerPublicKey }).toString();
  return apiRequest<DocumentPermissionDto[]>(`/documents/${documentId}/permissions?${query}`, withToken(token));
}
