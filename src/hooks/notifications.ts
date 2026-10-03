import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { firestore } from 'config/firebase';
import {
    collection,
    doc,
    getCountFromServer,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Notification } from 'interfaces';
import { useAppContext } from 'providers';
import { useEffect } from 'react';

export const useListenForNotifications = () => {
    const { user } = useAppContext();
    const queryClient = useQueryClient();

    useEffect(() => {
        let unsubscribe = () => {};

        if (user?.uid) {
            const notificationsRef = collection(firestore, `/notifications/${user.uid}/userNotifications`);
            const notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));

            unsubscribe = onSnapshot(
                notificationsQuery,
                async () => {
                    await queryClient.invalidateQueries({
                        queryKey: ['get-notifications'],
                    });
                    await queryClient.invalidateQueries({
                        queryKey: ['get-notification-unread-count', user.uid],
                    });
                },
            );
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);
};

export const useGetNotifications = (userUid: string) => {
    return useQuery({
        queryKey: ['get-notifications', userUid],
        queryFn: async () => {
            const notificationsRef = collection(firestore, `/notifications/${userUid}/userNotifications`);
            const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(5));
            const docSnap = await getDocs(q);

            return docSnap.docs.map((doc) => doc.data() as Notification);
        },
        enabled: !!userUid,
    });
};

export const useGetUnreadNotificationsCount = (userUid: string) => {
    return useQuery({
        queryKey: ['get-notification-unread-count', userUid],
        queryFn: async () => {
            const notificationsRef = collection(firestore, `/notifications/${userUid}/userNotifications`);
            const unreadQuery = query(notificationsRef, where('isRead', '==', false));
            const countSnapshot = await getCountFromServer(unreadQuery);

            return countSnapshot.data().count;
        },
        enabled: !!userUid,
    });
};

export const useMarkAsRead = (userUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: string) => {
            try {
                const notificationRef = doc(firestore, `/notifications/${userUid}/userNotifications/${notificationId}`);
                return await updateDoc(notificationRef, {
                    isRead: true,
                    updatedAt: Timestamp.now(),
                }).then((res) => res);
            } catch (error) {
                throw error;
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['get-notifications', userUid],
            });
        },
    });
};
