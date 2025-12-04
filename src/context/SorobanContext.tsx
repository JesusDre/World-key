import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  clearStoredWallet,
  connectWallet,
  fetchIdentity,
  getStoredWallet,
  registerIdentity as registerIdentityOnChain,
} from "@/utils/stellar";
import type {
  DocumentRecord,
  HistoryRecord,
  IdentityRecord,
  PermissionRecord,
  WalletAccount,
} from "@/utils/stellar";
import {
  buildDocumentMetadata,
  computeDocumentHash,
  decodeDocumentMetadata,
  encodeDocumentMetadata,
} from "@/utils/documentMetadata";
import {
  createDocument as createDocumentApi,
  fetchOwnedDocuments,
  fetchSharedDocuments,
  listDocumentPermissions,
  revokeDocumentShare,
  shareDocument as shareDocumentApi,
  type DocumentDto,
  type DocumentPermissionDto,
} from "@/services/documents";
import {
  SorobanContext,
  type DocumentInput,
  type SorobanContextValue,
  type RegisterPayload,
} from "./SorobanContext.shared";
import type { AuthSession } from "@/types/auth";

// Re-export the context for easier imports
export { SorobanContext } from "./SorobanContext.shared";

interface InternalHistoryInput {
  type: HistoryRecord["type"];
  title: string;
  description: string;
  txHash?: string;
  actor?: string;
}

const AUTH_SESSION_STORAGE_KEY = "worldkey-auth-session";

export function SorobanProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [identity, setIdentity] = useState<IdentityRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<DocumentRecord[]>([]);
  const [grantedPermissions, setGrantedPermissions] = useState<PermissionRecord[]>([]);
  const [permissionsForMe, setPermissionsForMe] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [authSession, setAuthSessionState] = useState<AuthSession | null>(() => getStoredAuthSession());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authSession) {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSession));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }, [authSession]);

  const appendHistory = useCallback((entry: InternalHistoryInput) => {
    setHistory((prev) => [
      {
        id: `${entry.type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        timestamp: new Date().toISOString(),
        txHash: entry.txHash,
        actor: entry.actor,
      },
      ...prev,
    ]);
  }, []);

  const loadPermissions = useCallback(
    async (docList: DocumentRecord[]): Promise<PermissionRecord[]> => {
      if (!authSession?.token || docList.length === 0) {
        return [];
      }

      const results = await Promise.all(
        docList.map((doc) =>
          listDocumentPermissions(doc.docId, doc.owner, authSession.token!).catch(() => []),
        ),
      );

      return results.flat().map(mapPermissionResponse);
    },
    [authSession?.token],
  );

  const hydrate = useCallback(
    async (publicKey: string): Promise<IdentityRecord | null> => {
      setLoading(true);
      let profile: IdentityRecord | null = null;
      try {
        profile = await fetchIdentity(publicKey).catch(() => null);
        if (profile && authSession?.email) {
          profile = { ...profile, email: authSession.email };
        }
        setIdentity(profile);

        if (!authSession?.token) {
          setDocuments([]);
          setSharedDocuments([]);
          setPermissionsForMe([]);
          setGrantedPermissions([]);
          return profile;
        }

        const [ownedDocs, sharedDocs] = await Promise.all([
          fetchOwnedDocuments(publicKey, authSession.token).catch(() => []),
          fetchSharedDocuments(publicKey, authSession.token).catch(() => []),
        ]);

        const mappedOwned = ownedDocs.map(mapDocumentResponse);
        const mappedShared = sharedDocs.map(mapDocumentResponse);

        setDocuments(mappedOwned);
        setSharedDocuments(mappedShared);
        setPermissionsForMe(mappedShared.map((doc) => doc.docId));
        setGrantedPermissions(await loadPermissions(mappedOwned));
      } finally {
        setLoading(false);
      }
      return profile;
    },
    [authSession?.email, authSession?.token, loadPermissions],
  );

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await getStoredWallet();
      if (stored) {
        setAccount(stored);
        await hydrate(stored.publicKey);
      } else {
        setLoading(false);
      }
    };
    bootstrap().catch((error: unknown) => {
      console.warn("No se pudo restaurar la sesión previa", error);
      setLoading(false);
    });
  }, [hydrate]);

  const connect = useCallback(async () => {
    toast.loading("Conectando wallet…", { id: "worldkey-wallet" });
    try {
      const wallet = await connectWallet();
      toast.success("Wallet conectada", {
        id: "worldkey-wallet",
        description: shorten(wallet.publicKey),
      });
      setAccount(wallet);
      await hydrate(wallet.publicKey);
      return wallet;
    } catch (error) {
      const message = (error as Error).message ?? "No se pudo conectar la wallet";
      toast.error(message, { id: "worldkey-wallet" });
      throw error;
    }
  }, [hydrate]);

  const ensureWallet = useCallback(async () => {
    if (account) return account;
    return connect();
  }, [account, connect]);

  const handleRegisterIdentity = useCallback(
    async ({ name, email, rfc }: RegisterPayload) => {
      const wallet = await ensureWallet();
      const normalizedRfc =
        rfc && rfc.trim().length > 0
          ? rfc.trim()
          : `RFC${wallet.publicKey.slice(0, 8).toUpperCase()}`;

      toast.loading("Firmando transacción…", { id: "worldkey-identity" });

      try {
        const response = await registerIdentityOnChain(wallet.publicKey, {
          name,
          email,
          rfc: normalizedRfc,
        });

        const profile = response.result ?? (await fetchIdentity(wallet.publicKey));
        if (!profile) {
          throw new Error("No se pudo recuperar la identidad registrada");
        }

        setIdentity(profile);
        appendHistory({
          type: "identity",
          title: "Identidad registrada",
          description: `${profile.name} (${shorten(profile.publicKey)})`,
          txHash: response.txHash,
          actor: profile.publicKey,
        });

        toast.success("Identidad verificada en Soroban", {
          id: "worldkey-identity",
          description: `Hash: ${shorten(response.txHash)}`,
        });

        await hydrate(wallet.publicKey);
        return profile;
      } catch (error) {
        const err = error as Error;
        toast.error(err.message ?? "Error al registrar identidad", {
          id: "worldkey-identity",
        });
        throw error;
      }
    },
    [appendHistory, ensureWallet, hydrate],
  );

  const handleCreateDocument = useCallback(
    async (payload: DocumentInput) => {
      if (!identity) {
        throw new Error("Primero registra tu identidad en Soroban.");
      }
      if (!authSession) {
        throw new Error("Inicia sesión para registrar documentos.");
      }

      const metadata = buildDocumentMetadata(payload);
      const hash = await computeDocumentHash(identity.publicKey, metadata);
      const response = await createDocumentApi(
        {
          ownerEmail: authSession.email,
          ownerPublicKey: identity.publicKey,
          docType: payload.type,
          docNumber: payload.number,
          hash,
          issueDate: payload.issueDate,
          expiryDate: payload.expiryDate ?? null,
          metadataUri: encodeDocumentMetadata(metadata),
        },
        authSession.token,
      );

      const record = mapDocumentResponse(response);
      await hydrate(identity.publicKey);

      appendHistory({
        type: "document",
        title: `Documento ${payload.type} registrado`,
        description: `Hash: ${shorten(record.hash)}`,
        actor: identity.publicKey,
      });

      return record;
    },
    [appendHistory, authSession, hydrate, identity],
  );

  const handleShareDocument = useCallback(
    async (docId: number, target: string) => {
      if (!identity) {
        throw new Error("Primero registra tu identidad en Soroban.");
      }
      if (!authSession) {
        throw new Error("Inicia sesión para gestionar permisos.");
      }

      const response = await shareDocumentApi(
        docId,
        {
          ownerPublicKey: identity.publicKey,
          targetPublicKey: target,
        },
        authSession.token,
      );

      const permission = mapPermissionResponse(response);
      setGrantedPermissions((prev) => [permission, ...prev.filter((perm) => perm.target !== target || perm.docId !== docId)]);
      await hydrate(identity.publicKey);

      appendHistory({
        type: "access",
        title: "Permiso concedido",
        description: `Doc ${docId} compartido con ${shorten(target)}`,
        actor: identity.publicKey,
      });
    },
    [appendHistory, authSession, hydrate, identity],
  );

  const handleRevokePermission = useCallback(
    async (docId: number, target: string) => {
      if (!identity) {
        throw new Error("Primero registra tu identidad en Soroban.");
      }
      if (!authSession) {
        throw new Error("Inicia sesión para gestionar permisos.");
      }

      await revokeDocumentShare(docId, identity.publicKey, target, authSession.token);
      setGrantedPermissions((prev) =>
        prev.filter((permission) => permission.docId !== docId || permission.target !== target),
      );
      await hydrate(identity.publicKey);

      appendHistory({
        type: "access",
        title: "Permiso revocado",
        description: `Doc ${docId} ya no es visible para ${shorten(target)}`,
        actor: identity.publicKey,
      });
    },
    [appendHistory, authSession, hydrate, identity],
  );

  const refresh = useCallback(async () => {
    const key = identity?.publicKey ?? account?.publicKey;
    if (!key) {
      toast.info("Conecta tu wallet para sincronizar datos.");
      return identity ?? null;
    }
    return hydrate(key);
  }, [account?.publicKey, hydrate, identity]);

  const disconnect = useCallback(() => {
    clearStoredWallet();
    setAccount(null);
    setIdentity(null);
    setDocuments([]);
    setSharedDocuments([]);
    setGrantedPermissions([]);
    setPermissionsForMe([]);
    setHistory([]);
    setAuthSessionState(null);
  }, []);

  const setAuthSession = useCallback((session: AuthSession | null) => {
    setAuthSessionState(session);
  }, []);

  const value = useMemo<SorobanContextValue>(
    () => ({
      loading,
      account,
      identity,
      documents,
      sharedDocuments,
      grantedPermissions,
      permissionsForMe,
      history,
      authSession,
      connectWallet: connect,
      registerIdentity: handleRegisterIdentity,
      createDocument: handleCreateDocument,
      shareDocument: handleShareDocument,
      revokePermission: handleRevokePermission,
      setAuthSession,
      refresh,
      disconnect,
    }),
    [
      loading,
      account,
      identity,
      documents,
      sharedDocuments,
      grantedPermissions,
      permissionsForMe,
      history,
      authSession,
      connect,
      handleRegisterIdentity,
      handleCreateDocument,
      handleShareDocument,
      handleRevokePermission,
      setAuthSession,
      refresh,
      disconnect,
    ],
  );

  return <SorobanContext.Provider value={value}>{children}</SorobanContext.Provider>;
}

function mapDocumentResponse(response: DocumentDto): DocumentRecord {
  const fallback = {
    type: response.docType,
    number: response.docNumber,
    issueDate: response.issueDate,
    expiryDate: response.expiryDate ?? null,
    createdAt: response.createdAt,
  };

  const metadata = decodeDocumentMetadata(response.metadataUri, fallback);

  return {
    docId: Number(response.id),
    hash: response.hash,
    owner: response.ownerPublicKey,
    metadataUri: response.metadataUri ?? encodeDocumentMetadata(metadata),
    metadata,
    permissions: response.sharedWith ?? [],
  };
}

function mapPermissionResponse(response: DocumentPermissionDto): PermissionRecord {
  return {
    docId: response.documentId,
    owner: response.ownerPublicKey,
    target: response.targetPublicKey,
    grantedAt: response.grantedAt,
  };
}

function getStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function shorten(value: string, size = 6): string {
  if (!value) return "";
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
