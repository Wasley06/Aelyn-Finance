export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type Category = 'income' | 'expense';
export type DebtStatus = 'Paid' | 'Unpaid';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'stakeholder' | 'admin';
  isDeveloperMode?: boolean;
  currency?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'entry' | 'debt' | 'system';
  timestamp: any;
  readBy: string[];
}

export interface Entry {
  id: string;
  amount: number;
  category: Category;
  date: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: any; // Firestore Timestamp or Date ISO
}

export interface Debt {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: DebtStatus;
  userId: string;
  createdAt: any;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  before?: any;
  after?: any;
  timestamp: any;
  targetCollection: string;
  targetId: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
