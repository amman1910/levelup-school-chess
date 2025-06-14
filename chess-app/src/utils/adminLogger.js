// utils/adminLogger.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const logAdminAction = async ({ admin, actionType, targetType, targetId, description = '' }) => {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminId: admin?.id || '',
      adminName: `${admin?.firstName || ''} ${admin?.lastName || ''}`,
      actionType,
      targetType,
      targetId,
      description,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};
