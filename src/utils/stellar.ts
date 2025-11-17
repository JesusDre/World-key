import { fetchIdentity as fetchIdentityApi, registerIdentity as registerIdentityApi, type IdentityResponseDto } from "@/services/identities";

interface FreighterProvider {
  isConnected?: () => Promise<boolean>;
  getPublicKey?: () => Promise<string>;
  requestAccess: (input?: Record<string, unknown>) => Promise<{ publicKey: string }>;
  signTransaction: (transactionXdr: string, networkPassphrase: string) => Promise<string>;
}

declare global {
  interface Window {
    freighterApi?: FreighterProvider;
  }
}

export interface WalletAccount {
  publicKey: string;
  provider: "freighter";
}

export interface IdentityRecord {
  id: number;
  publicKey: string;
  name: string;
  rfc: string;
  email: string;
  verified: boolean;
}

export interface DocumentMetadata {
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string | null;
  createdAt: string;
}

export interface DocumentRecord {
  docId: number;
  hash: string;
  owner: string;
  metadataUri: string;
  metadata: DocumentMetadata;
  permissions: string[];
  lastTx?: string;
}

export interface PermissionRecord {
  docId: number;
  owner: string;
  target: string;
  grantedAt?: string;
  lastTx?: string;
}

export interface HistoryRecord {
  id: string;
  type: "identity" | "document" | "access";
  title: string;
  description: string;
  timestamp: string;
  txHash?: string;
  actor?: string;
}

export interface InvokeResponse<T = unknown> {
  result?: T;
  txHash: string;
}

const WALLET_STORAGE_KEY = "worldkey-active-wallet";
const IDENTITY_METADATA_STORAGE_KEY = "worldkey-identity-metadata";

export async function connectWallet(): Promise<WalletAccount> {
  const freighter = await requireFreighter();

  let publicKey = await freighter.getPublicKey?.().catch(() => null);
  if (!publicKey && freighter.isConnected) {
    const connected = await freighter.isConnected().catch(() => false);
    if (!connected) {
      const response = await freighter.requestAccess();
      publicKey = response.publicKey;
    }
  }

  if (!publicKey) {
    const result = await freighter.requestAccess();
    publicKey = result.publicKey;
  }

  if (!publicKey) {
    throw new Error("No se pudo obtener la clave pública de Freighter");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(WALLET_STORAGE_KEY, publicKey);
  }

  return { publicKey, provider: "freighter" };
}

export async function getStoredWallet(): Promise<WalletAccount | null> {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(WALLET_STORAGE_KEY);
  if (!stored) return null;
  return { publicKey: stored, provider: "freighter" };
}

export function clearStoredWallet() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(WALLET_STORAGE_KEY);
}

export async function fetchIdentity(publicKey: string): Promise<IdentityRecord | null> {
  try {
    const response = await fetchIdentityApi(publicKey);
    const metadata = getIdentityMetadata(publicKey);
    return {
      ...mapIdentityResponse(response),
      email: metadata?.email ?? "",
      rfc: metadata?.rfc ?? "",
    };
  } catch (error) {
    console.warn("No se pudo recuperar la identidad", error);
    return null;
  }
}

export async function registerIdentity(
  publicKey: string,
  payload: { name: string; rfc: string; email: string },
): Promise<InvokeResponse<IdentityRecord>> {
  const response = await registerIdentityApi({ publicKey, fullName: payload.name });
  persistIdentityMetadata(publicKey, { email: payload.email, rfc: payload.rfc });

  const result: IdentityRecord = {
    ...mapIdentityResponse(response),
    name: payload.name,
    email: payload.email,
    rfc: payload.rfc,
  };

  return {
    txHash: response.transaction?.hash ?? generateTxHash(),
    result,
  };
}

async function requireFreighter(): Promise<FreighterProvider> {
  if (typeof window === "undefined" || !window.freighterApi) {
    throw new Error("Instala y habilita Freighter para continuar.");
  }
  return window.freighterApi;
}

function mapIdentityResponse(dto: IdentityResponseDto): IdentityRecord {
  return {
    id: Date.parse(dto.createdAt ?? "") || Date.now(),
    publicKey: dto.publicKey,
    name: dto.fullName,
    rfc: "",
    email: "",
    verified: true,
  };
}

type IdentityMetadata = {
  email: string;
  rfc?: string;
};

function getIdentityMetadata(publicKey: string): IdentityMetadata | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(IDENTITY_METADATA_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, IdentityMetadata>;
    return parsed[publicKey] ?? null;
  } catch {
    return null;
  }
}

function persistIdentityMetadata(publicKey: string, metadata: IdentityMetadata) {
  if (typeof window === "undefined") {
    return;
  }
  const raw = window.localStorage.getItem(IDENTITY_METADATA_STORAGE_KEY);
  const parsed: Record<string, IdentityMetadata> = raw ? safeParseMetadata(raw) : {};
  parsed[publicKey] = metadata;
  window.localStorage.setItem(IDENTITY_METADATA_STORAGE_KEY, JSON.stringify(parsed));
}

function safeParseMetadata(value: string): Record<string, IdentityMetadata> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, IdentityMetadata>;
    }
  } catch {
    /* noop */
  }
  return {};
}

function generateTxHash(): string {
  return `backend-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}
