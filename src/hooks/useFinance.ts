import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Entry, Debt, ActivityLog as Log, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function useFinance() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const qEntries = query(collection(db, 'entries'), orderBy('date', 'desc'));
    const qDebts = query(collection(db, 'debts'), orderBy('date', 'desc'));
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));

    const unsubEntries = onSnapshot(qEntries, (snap) => {
      setEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'entries'));

    const unsubDebts = onSnapshot(qDebts, (snap) => {
      setDebts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'debts'));

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'logs'));

    setLoading(false);

    return () => {
      unsubEntries();
      unsubDebts();
      unsubLogs();
    };
  }, [profile]);

  const addLog = async (action: string, before: any, after: any, targetCollection: string, targetId: string) => {
    await addDoc(collection(db, 'logs'), {
      userId: auth.currentUser?.uid,
      userName: profile?.displayName || auth.currentUser?.email,
      action,
      before,
      after,
      timestamp: serverTimestamp(),
      targetCollection,
      targetId
    });
  };

  const createNotification = async (message: string, type: 'entry' | 'debt' | 'system') => {
    await addDoc(collection(db, 'notifications'), {
      message,
      type,
      timestamp: serverTimestamp(),
      readBy: []
    });
  };

  const addEntry = async (entry: Omit<Entry, 'id' | 'userId' | 'userName' | 'createdAt'>) => {
    const data = {
      ...entry,
      userId: auth.currentUser?.uid,
      userName: profile?.displayName || auth.currentUser?.email,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'entries'), data);
    await addLog('Created Entry', null, data, 'entries', docRef.id);
    await createNotification(`${profile?.displayName || 'A stakeholder'} recorded a ${entry.category}: ${entry.description}`, 'entry');
  };

  const deleteEntry = async (id: string, existingData: any) => {
    await deleteDoc(doc(db, 'entries', id));
    await addLog('Deleted Entry', existingData, null, 'entries', id);
    await createNotification(`A transaction record was removed: ${existingData.description}`, 'system');
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'userId' | 'createdAt'>) => {
    const data = {
      ...debt,
      userId: auth.currentUser?.uid,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'debts'), data);
    await addLog('Created Debt', null, data, 'debts', docRef.id);
    await createNotification(`${profile?.displayName || 'A stakeholder'} registered a new debt: ${debt.description}`, 'debt');
  };

  const updateDebtStatus = async (id: string, status: 'Paid' | 'Unpaid', existingData: any) => {
    await updateDoc(doc(db, 'debts', id), { status });
    await addLog('Updated Debt Status', existingData, { ...existingData, status }, 'debts', id);
    await createNotification(`Debt status updated to ${status} for: ${existingData.description}`, 'debt');
  };

  const deleteDebt = async (id: string, existingData: any) => {
    await deleteDoc(doc(db, 'debts', id));
    await addLog('Deleted Debt', existingData, null, 'debts', id);
  };

  const deleteLog = async (id: string) => {
    await deleteDoc(doc(db, 'logs', id));
  };

  return { entries, debts, logs, loading, addEntry, deleteEntry, addDebt, updateDebtStatus, deleteDebt, deleteLog, createNotification };
}
