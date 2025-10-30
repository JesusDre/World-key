import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper para verificar autenticación
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  return user.id;
}

// ==================== AUTENTICACIÓN ====================

// Registro de usuario
app.post('/make-server-4118c158/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password y nombre son requeridos' }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // Auto-confirmar email ya que no hay servidor de correo configurado
    });

    if (error) {
      console.log('Error creating user:', error);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Crear wallet inicial
    await kv.set(`wallet:${userId}`, JSON.stringify({
      balance: 1000.00, // Balance inicial de demo
      currency: 'MXN'
    }));

    // Crear perfil de usuario
    await kv.set(`user:${userId}`, JSON.stringify({
      id: userId,
      email,
      name,
      worldKeyId: `WK-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      createdAt: new Date().toISOString()
    }));

    return c.json({ 
      success: true, 
      userId,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Error en el registro' }, 500);
  }
});

// Login
app.post('/make-server-4118c158/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email y password son requeridos' }, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Login error:', error);
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    return c.json({ 
      success: true,
      accessToken: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.log('Login error:', error);
    return c.json({ error: 'Error en el login' }, 500);
  }
});

// ==================== DOCUMENTOS ====================

// Obtener documentos del usuario
app.get('/make-server-4118c158/documents', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      console.log('❌ No autorizado - sin userId');
      return c.json({ error: 'No autorizado' }, 401);
    }

    console.log(`📄 Buscando documentos para usuario: ${userId}`);
    const documents = await kv.getByPrefix(`document:${userId}:`);
    console.log(`📦 Documentos encontrados (raw):`, documents);
    
    // getByPrefix retorna directamente los valores, no objetos {key, value}
    const parsedDocs = documents.map(docValue => {
      // Si docValue ya es un objeto (no string), usarlo directamente
      const parsed = typeof docValue === 'string' ? JSON.parse(docValue) : docValue;
      console.log('📄 Documento parseado:', parsed);
      
      // Asegurar compatibilidad con documentos antiguos
      return {
        ...parsed,
        blockchainVerified: parsed.blockchainVerified ?? false,
        blockchainTxHash: parsed.blockchainTxHash ?? null,
        activeShares: parsed.activeShares ?? 0
      };
    });
    
    console.log(`✅ Retornando ${parsedDocs.length} documentos para usuario ${userId}`);
    return c.json({ documents: parsedDocs });
  } catch (error) {
    console.log('❌ Error fetching documents:', error);
    console.log('❌ Error stack:', error.stack);
    return c.json({ error: 'Error al obtener documentos', details: error.message }, 500);
  }
});

// Agregar documento
app.post('/make-server-4118c158/documents', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      console.log('❌ No autorizado - sin userId');
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { type, number, issueDate, expiryDate, verified } = await c.req.json();
    console.log(`📝 Creando documento para usuario ${userId}:`, { type, number });
    
    const docId = Math.random().toString(36).substring(2, 15);
    const document = {
      id: docId,
      userId,
      type,
      number,
      issueDate,
      expiryDate,
      verified: verified || false,
      tokenHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      blockchainVerified: false, // Inicialmente no verificado
      blockchainTxHash: null,
      activeShares: 0,
      createdAt: new Date().toISOString()
    };

    console.log(`💾 Guardando documento ${docId} en KV store`);
    await kv.set(`document:${userId}:${docId}`, JSON.stringify(document));
    console.log(`✅ Documento creado exitosamente`);
    
    return c.json({ success: true, document });
  } catch (error) {
    console.log('❌ Error adding document:', error);
    console.log('❌ Error stack:', error.stack);
    return c.json({ error: 'Error al agregar documento', details: error.message }, 500);
  }
});

// Verificar documento en blockchain (simula el proceso de registro)
app.post('/make-server-4118c158/documents/:id/verify-blockchain', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      console.log('❌ No autorizado - sin userId');
      return c.json({ error: 'No autorizado' }, 401);
    }

    const docId = c.req.param('id');
    console.log(`⛓️ Verificando documento ${docId} para usuario ${userId}`);
    
    const docData = await kv.get(`document:${userId}:${docId}`);
    
    if (!docData) {
      console.log('❌ Documento no encontrado');
      return c.json({ error: 'Documento no encontrado' }, 404);
    }

    const document = JSON.parse(docData);
    console.log('📄 Documento encontrado:', document);
    
    // Simular registro en blockchain (en producción, aquí se haría la llamada real al smart contract)
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    console.log('🔐 TX Hash generado:', mockTxHash);
    
    document.blockchainVerified = true;
    document.blockchainTxHash = mockTxHash;
    document.verified = true;
    document.verifiedAt = new Date().toISOString();

    await kv.set(`document:${userId}:${docId}`, JSON.stringify(document));
    console.log('✅ Documento actualizado con verificación blockchain');

    // Crear entrada en el historial
    const transactionId = Math.random().toString(36).substring(2, 15);
    const historyEntry = {
      id: transactionId,
      userId,
      type: 'document-registered',
      title: 'Documento registrado en Blockchain',
      description: `${document.type} verificado y tokenizado`,
      timestamp: new Date().toISOString(),
      hash: mockTxHash,
      documentType: document.type,
      blockchainVerified: true
    };
    
    await kv.set(`transaction:${userId}:${transactionId}`, JSON.stringify(historyEntry));
    console.log('✅ Entrada de historial creada:', transactionId);
    
    return c.json({ success: true, document, txHash: mockTxHash });
  } catch (error) {
    console.log('❌ Error verifying document:', error);
    return c.json({ error: 'Error al verificar documento en blockchain' }, 500);
  }
});

// ==================== SOLICITUDES DE ACCESO ====================

// Obtener solicitudes (recibidas y enviadas)
app.get('/make-server-4118c158/requests', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      console.log('❌ No autorizado - sin userId');
      return c.json({ error: 'No autorizado' }, 401);
    }

    const type = c.req.query('type') || 'received'; // received | sent
    console.log(`📨 Buscando solicitudes tipo ${type} para usuario: ${userId}`);

    const allRequests = await kv.getByPrefix('request:');
    console.log(`📦 Solicitudes encontradas (raw):`, allRequests?.length || 0);
    
    // getByPrefix retorna directamente los valores, no objetos {key, value}
    const parsedRequests = allRequests
      .map(reqValue => {
        // Si reqValue ya es un objeto (no string), usarlo directamente
        return typeof reqValue === 'string' ? JSON.parse(reqValue) : reqValue;
      })
      .filter(req => type === 'received' ? req.ownerId === userId : req.requesterId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`✅ Retornando ${parsedRequests.length} solicitudes`);
    return c.json({ requests: parsedRequests });
  } catch (error) {
    console.log('❌ Error fetching requests:', error);
    console.log('❌ Error stack:', error.stack);
    return c.json({ error: 'Error al obtener solicitudes', details: error.message }, 500);
  }
});

// Crear solicitud de acceso
app.post('/make-server-4118c158/requests', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { ownerId, documentType, requesterName, requesterRfc, reason } = await c.req.json();
    
    if (!ownerId || !documentType || !requesterRfc) {
      return c.json({ error: 'Datos incompletos' }, 400);
    }

    const requestId = Math.random().toString(36).substring(2, 15);
    const request = {
      id: requestId,
      ownerId,
      requesterId: userId,
      requesterName: requesterName || 'Usuario',
      requesterRfc,
      documentType,
      reason: reason || 'Verificación de identidad',
      status: 'pending', // pending | approved | rejected | revoked
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`request:${requestId}`, JSON.stringify(request));
    
    return c.json({ success: true, request });
  } catch (error) {
    console.log('Error creating request:', error);
    return c.json({ error: 'Error al crear solicitud' }, 500);
  }
});

// Aprobar solicitud
app.post('/make-server-4118c158/requests/:id/approve', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const requestId = c.req.param('id');
    const requestData = await kv.get(`request:${requestId}`);
    
    if (!requestData) {
      return c.json({ error: 'Solicitud no encontrada' }, 404);
    }

    const request = JSON.parse(requestData);
    
    if (request.ownerId !== userId) {
      return c.json({ error: 'No autorizado para aprobar esta solicitud' }, 403);
    }

    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    await kv.set(`request:${requestId}`, JSON.stringify(request));

    // Crear entrada en el historial
    const transactionId = Math.random().toString(36).substring(2, 15);
    await kv.set(`transaction:${userId}:${transactionId}`, JSON.stringify({
      id: transactionId,
      userId,
      type: 'document-access',
      title: 'Acceso concedido',
      description: `${request.documentType} accesado por ${request.requesterName}`,
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      to: `${request.requesterName} (RFC: ${request.requesterRfc})`,
      documentType: request.documentType,
      rfcVerified: true
    }));
    
    return c.json({ success: true, request });
  } catch (error) {
    console.log('Error approving request:', error);
    return c.json({ error: 'Error al aprobar solicitud' }, 500);
  }
});

// Rechazar solicitud
app.post('/make-server-4118c158/requests/:id/reject', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const requestId = c.req.param('id');
    const requestData = await kv.get(`request:${requestId}`);
    
    if (!requestData) {
      return c.json({ error: 'Solicitud no encontrada' }, 404);
    }

    const request = JSON.parse(requestData);
    
    if (request.ownerId !== userId) {
      return c.json({ error: 'No autorizado para rechazar esta solicitud' }, 403);
    }

    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    await kv.set(`request:${requestId}`, JSON.stringify(request));
    
    return c.json({ success: true, request });
  } catch (error) {
    console.log('Error rejecting request:', error);
    return c.json({ error: 'Error al rechazar solicitud' }, 500);
  }
});

// Revocar acceso
app.post('/make-server-4118c158/requests/:id/revoke', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const requestId = c.req.param('id');
    const requestData = await kv.get(`request:${requestId}`);
    
    if (!requestData) {
      return c.json({ error: 'Solicitud no encontrada' }, 404);
    }

    const request = JSON.parse(requestData);
    
    if (request.ownerId !== userId) {
      return c.json({ error: 'No autorizado para revocar esta solicitud' }, 403);
    }

    request.status = 'revoked';
    request.revokedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    await kv.set(`request:${requestId}`, JSON.stringify(request));

    // Crear entrada en el historial
    const transactionId = Math.random().toString(36).substring(2, 15);
    await kv.set(`transaction:${userId}:${transactionId}`, JSON.stringify({
      id: transactionId,
      userId,
      type: 'access-revoked',
      title: 'Acceso revocado',
      description: `Acceso a ${request.documentType} revocado`,
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      from: request.requesterName,
      documentType: request.documentType
    }));
    
    return c.json({ success: true, request });
  } catch (error) {
    console.log('Error revoking access:', error);
    return c.json({ error: 'Error al revocar acceso' }, 500);
  }
});

// ==================== TRANSACCIONES / HISTORIAL ====================

// Obtener historial de transacciones
app.get('/make-server-4118c158/transactions', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      console.log('❌ No autorizado - sin userId');
      return c.json({ error: 'No autorizado' }, 401);
    }

    console.log(`📜 Buscando transacciones para usuario: ${userId}`);
    const transactions = await kv.getByPrefix(`transaction:${userId}:`);
    console.log(`📦 Transacciones encontradas (raw):`, transactions);
    
    // getByPrefix retorna directamente los valores, no objetos {key, value}
    const parsedTransactions = transactions
      .map(txValue => {
        // Si txValue ya es un objeto (no string), usarlo directamente
        return typeof txValue === 'string' ? JSON.parse(txValue) : txValue;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    console.log(`✅ Retornando ${parsedTransactions.length} transacciones`);
    return c.json({ transactions: parsedTransactions });
  } catch (error) {
    console.log('❌ Error fetching transactions:', error);
    console.log('❌ Error stack:', error.stack);
    return c.json({ error: 'Error al obtener historial', details: error.message }, 500);
  }
});

// Crear transacción de pago
app.post('/make-server-4118c158/transactions', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { type, amount, to, from, description } = await c.req.json();
    
    if (!type || amount === undefined) {
      return c.json({ error: 'Tipo y monto son requeridos' }, 400);
    }

    // Actualizar balance
    const walletData = await kv.get(`wallet:${userId}`);
    if (walletData) {
      const wallet = JSON.parse(walletData);
      
      if (type === 'payment-sent' && wallet.balance < Math.abs(amount)) {
        return c.json({ error: 'Saldo insuficiente' }, 400);
      }

      wallet.balance += amount; // amount es negativo para sent, positivo para received
      await kv.set(`wallet:${userId}`, JSON.stringify(wallet));
    }

    const transactionId = Math.random().toString(36).substring(2, 15);
    const transaction = {
      id: transactionId,
      userId,
      type,
      title: type === 'payment-sent' ? 'Pago enviado' : 'Pago recibido',
      description: description || (type === 'payment-sent' ? `A ${to}` : `De ${from}`),
      amount,
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      to: to || undefined,
      from: from || undefined
    };

    await kv.set(`transaction:${userId}:${transactionId}`, JSON.stringify(transaction));
    
    return c.json({ success: true, transaction });
  } catch (error) {
    console.log('Error creating transaction:', error);
    return c.json({ error: 'Error al crear transacción' }, 500);
  }
});

// ==================== WALLET ====================

// Obtener balance de wallet
app.get('/make-server-4118c158/wallet', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const walletData = await kv.get(`wallet:${userId}`);
    
    if (!walletData) {
      // Crear wallet si no existe
      const wallet = {
        balance: 1000.00,
        currency: 'MXN'
      };
      await kv.set(`wallet:${userId}`, JSON.stringify(wallet));
      return c.json({ wallet });
    }

    const wallet = JSON.parse(walletData);
    return c.json({ wallet });
  } catch (error) {
    console.log('Error fetching wallet:', error);
    return c.json({ error: 'Error al obtener wallet' }, 500);
  }
});

// Obtener perfil de usuario
app.get('/make-server-4118c158/profile', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const userData = await kv.get(`user:${userId}`);
    
    if (!userData) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const user = JSON.parse(userData);
    return c.json({ user });
  } catch (error) {
    console.log('Error fetching profile:', error);
    return c.json({ error: 'Error al obtener perfil' }, 500);
  }
});

// ==================== RECUPERACIÓN DE CUENTA ====================

// Configurar recuperación social
app.post('/make-server-4118c158/recovery/setup-social', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { guardians, guardianCount } = await c.req.json();

    if (!guardians || guardians.length < 2) {
      return c.json({ error: 'Se requieren al menos 2 guardianes' }, 400);
    }

    // Obtener configuración de recuperación existente o crear nueva
    const existingData = await kv.get(`recovery:${userId}`);
    const recovery = existingData ? JSON.parse(existingData) : {};

    recovery.socialRecovery = {
      enabled: true,
      guardians: guardians,
      guardianCount: guardianCount || guardians.length,
      configuredAt: new Date().toISOString()
    };

    await kv.set(`recovery:${userId}`, JSON.stringify(recovery));

    return c.json({ success: true });
  } catch (error) {
    console.log('Error setting up social recovery:', error);
    return c.json({ error: 'Error al configurar recuperación social' }, 500);
  }
});

// Configurar preguntas de seguridad
app.post('/make-server-4118c158/recovery/setup-questions', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { questions } = await c.req.json();

    if (!questions || !Array.isArray(questions)) {
      return c.json({ error: 'Preguntas inválidas' }, 400);
    }

    if (questions.length < 3) {
      return c.json({ error: 'Se requieren al menos 3 preguntas' }, 400);
    }

    if (questions.length > 10) {
      return c.json({ error: 'Máximo 10 preguntas permitidas' }, 400);
    }

    // Validar que todas tengan pregunta y respuesta
    const allComplete = questions.every((q: any) => 
      q.question && q.question.trim() !== '' && 
      q.answer && q.answer.trim() !== ''
    );
    
    if (!allComplete) {
      return c.json({ error: 'Todas las preguntas deben tener pregunta y respuesta' }, 400);
    }

    // Obtener configuración de recuperación existente o crear nueva
    const existingData = await kv.get(`recovery:${userId}`);
    const recovery = existingData ? JSON.parse(existingData) : {};

    recovery.securityQuestions = {
      enabled: true,
      questions: questions.map((q: any) => q.question),
      answers: questions.map((q: any) => q.answer),
      configuredAt: new Date().toISOString()
    };

    await kv.set(`recovery:${userId}`, JSON.stringify(recovery));

    return c.json({ success: true });
  } catch (error) {
    console.log('Error setting up security questions:', error);
    return c.json({ error: 'Error al configurar preguntas de seguridad' }, 500);
  }
});

// Configurar 2FA
app.post('/make-server-4118c158/recovery/setup-2fa', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const { secret, code } = await c.req.json();

    if (!secret || !code) {
      return c.json({ error: 'Secret y código son requeridos' }, 400);
    }

    // En producción, validarías el código TOTP aquí
    // Por ahora solo verificamos que sea de 6 dígitos
    if (!/^\d{6}$/.test(code)) {
      return c.json({ error: 'Código inválido' }, 400);
    }

    // Obtener configuración de recuperación existente o crear nueva
    const existingData = await kv.get(`recovery:${userId}`);
    const recovery = existingData ? JSON.parse(existingData) : {};

    recovery.twoFactor = {
      enabled: true,
      secret: secret,
      configuredAt: new Date().toISOString()
    };

    await kv.set(`recovery:${userId}`, JSON.stringify(recovery));

    return c.json({ success: true });
  } catch (error) {
    console.log('Error setting up 2FA:', error);
    return c.json({ error: 'Error al configurar 2FA' }, 500);
  }
});

// Verificar métodos de recuperación disponibles para una cuenta
app.post('/make-server-4118c158/recovery/check-methods', async (c) => {
  try {
    const { identifier, type } = await c.req.json();
    
    if (!identifier || !type) {
      return c.json({ error: 'Identificador y tipo son requeridos' }, 400);
    }

    // Buscar usuario por email o teléfono
    // En producción, buscarías en la tabla de usuarios
    // Por ahora simulamos la búsqueda en KV
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.map(u => typeof u === 'string' ? JSON.parse(u) : u);
    
    const user = users.find(u => {
      if (type === 'email') return u.email === identifier;
      if (type === 'phone') return u.phone === identifier;
      return false;
    });

    if (!user) {
      return c.json({ error: 'Cuenta no encontrada' }, 404);
    }

    // Verificar qué métodos de recuperación tiene configurados
    const recoveryData = await kv.get(`recovery:${user.id}`);
    const recovery = recoveryData ? JSON.parse(recoveryData) : null;

    const methods = {
      social: recovery?.socialRecovery?.enabled || false,
      questions: recovery?.securityQuestions?.enabled || false,
      twoFactor: recovery?.twoFactor?.enabled || false,
      guardianCount: recovery?.socialRecovery?.guardianCount || 3
    };

    // Si tiene preguntas configuradas, incluir las preguntas (pero no las respuestas)
    const questions = recovery?.securityQuestions?.enabled 
      ? recovery.securityQuestions.questions 
      : undefined;

    return c.json({ success: true, methods, questions, userId: user.id });
  } catch (error) {
    console.log('Error checking recovery methods:', error);
    return c.json({ error: 'Error al verificar métodos de recuperación' }, 500);
  }
});

// Recuperación social - reconstruir token
app.post('/make-server-4118c158/recovery/social-recovery', async (c) => {
  try {
    const { identifier, tokens } = await c.req.json();
    
    if (!identifier || !tokens || !Array.isArray(tokens)) {
      return c.json({ error: 'Datos inválidos' }, 400);
    }

    // Buscar usuario
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.map(u => typeof u === 'string' ? JSON.parse(u) : u);
    const user = users.find(u => u.email === identifier || u.phone === identifier);

    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    // Verificar tokens de guardianes
    const recoveryData = await kv.get(`recovery:${user.id}`);
    if (!recoveryData) {
      return c.json({ error: 'No hay configuración de recuperación social' }, 404);
    }

    const recovery = JSON.parse(recoveryData);
    
    // Validar tokens (en producción, usarías Shamir Secret Sharing real)
    // Por ahora simulamos la validación
    const validTokens = tokens.filter(t => t.startsWith('WK-GUARDIAN-'));
    
    if (validTokens.length < Math.ceil(recovery.socialRecovery.guardianCount * 0.67)) {
      return c.json({ error: 'Tokens insuficientes o inválidos' }, 400);
    }

    // Generar token de recuperación
    const recoveryToken = `WK-RECOVERY-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    
    // Guardar token temporal (válido por 1 hora)
    await kv.set(`recovery-token:${recoveryToken}`, JSON.stringify({
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));

    return c.json({ success: true, recoveryToken });
  } catch (error) {
    console.log('Error in social recovery:', error);
    return c.json({ error: 'Error en recuperación social' }, 500);
  }
});

// Verificar preguntas de seguridad
app.post('/make-server-4118c158/recovery/verify-questions', async (c) => {
  try {
    const { identifier, answers } = await c.req.json();
    
    if (!identifier || !answers || !Array.isArray(answers)) {
      return c.json({ error: 'Datos inválidos' }, 400);
    }

    // Buscar usuario
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.map(u => typeof u === 'string' ? JSON.parse(u) : u);
    const user = users.find(u => u.email === identifier || u.phone === identifier);

    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    // Verificar respuestas
    const recoveryData = await kv.get(`recovery:${user.id}`);
    if (!recoveryData) {
      return c.json({ error: 'No hay preguntas de seguridad configuradas' }, 404);
    }

    const recovery = JSON.parse(recoveryData);
    const storedAnswers = recovery.securityQuestions?.answers || [];

    if (answers.length !== storedAnswers.length) {
      return c.json({ error: 'Número de respuestas incorrecto' }, 400);
    }

    // Comparar respuestas (case insensitive)
    const allCorrect = answers.every((answer, index) => 
      answer.toLowerCase().trim() === storedAnswers[index]?.toLowerCase().trim()
    );

    if (!allCorrect) {
      return c.json({ error: 'Respuestas incorrectas' }, 401);
    }

    // Generar token de sesión temporal
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (error) {
      console.log('Error generating magic link:', error);
      return c.json({ error: 'Error al generar acceso' }, 500);
    }

    return c.json({ success: true, message: 'Verificación exitosa' });
  } catch (error) {
    console.log('Error verifying questions:', error);
    return c.json({ error: 'Error al verificar preguntas' }, 500);
  }
});

// Verificar código 2FA
app.post('/make-server-4118c158/recovery/verify-2fa', async (c) => {
  try {
    const { identifier, code } = await c.req.json();
    
    if (!identifier || !code) {
      return c.json({ error: 'Datos inválidos' }, 400);
    }

    // Buscar usuario
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.map(u => typeof u === 'string' ? JSON.parse(u) : u);
    const user = users.find(u => u.email === identifier || u.phone === identifier);

    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    // Verificar código 2FA
    const recoveryData = await kv.get(`recovery:${user.id}`);
    if (!recoveryData) {
      return c.json({ error: 'No hay 2FA configurado' }, 404);
    }

    // En producción, verificarías el código TOTP real
    // Por ahora aceptamos cualquier código de 6 dígitos
    if (!/^\d{6}$/.test(code)) {
      return c.json({ error: 'Código inválido' }, 401);
    }

    return c.json({ success: true, message: 'Código verificado' });
  } catch (error) {
    console.log('Error verifying 2FA:', error);
    return c.json({ error: 'Error al verificar 2FA' }, 500);
  }
});

// Health check
app.get('/make-server-4118c158/health', (c) => {
  return c.json({ status: 'ok', service: 'WorldKey API' });
});

Deno.serve(app.fetch);
