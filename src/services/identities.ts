import { apiRequest } from "./api";

export interface BlockchainTransactionDto {
  hash: string;
  network: string;
  status: string;
  timestamp: string;
  description: string;
}

export interface IdentityResponseDto {
  publicKey: string;
  fullName: string;
  createdAt: string;
  transaction?: BlockchainTransactionDto | null;
}

export interface RegisterIdentityPayload {
  publicKey: string;
  fullName: string;
}

export async function registerIdentity(payload: RegisterIdentityPayload): Promise<IdentityResponseDto> {
  return apiRequest<IdentityResponseDto>("/identities", {
    method: "POST",
    body: payload,
  });
}

export async function fetchIdentity(publicKey: string): Promise<IdentityResponseDto> {
  return apiRequest<IdentityResponseDto>(`/identities/${encodeURIComponent(publicKey)}`);
}
