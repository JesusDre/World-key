import { createContext } from "react";
import type {
  DocumentRecord,
  HistoryRecord,
  IdentityRecord,
  PermissionRecord,
  WalletAccount,
} from "@/utils/stellar";
import type { AuthSession } from "@/types/auth";

export type RegisterPayload = {
  name: string;
  email: string;
  rfc?: string;
};

export type DocumentInput = {
  type: string;
  number: string;
  issueDate: string;
  expiryDate?: string | null;
};

export interface SorobanContextValue {
  loading: boolean;
  account: WalletAccount | null;
  identity: IdentityRecord | null;
  documents: DocumentRecord[];
  sharedDocuments: DocumentRecord[];
  grantedPermissions: PermissionRecord[];
  permissionsForMe: number[];
  history: HistoryRecord[];
  authSession: AuthSession | null;
  connectWallet: () => Promise<WalletAccount>;
  registerIdentity: (payload: RegisterPayload) => Promise<IdentityRecord>;
  createDocument: (payload: DocumentInput) => Promise<DocumentRecord>;
  shareDocument: (docId: number, target: string) => Promise<void>;
  revokePermission: (docId: number, target: string) => Promise<void>;
  setAuthSession: (session: AuthSession | null) => void;
  refresh: () => Promise<IdentityRecord | null>;
  disconnect: () => void;
}

export const SorobanContext = createContext<SorobanContextValue | undefined>(undefined);
