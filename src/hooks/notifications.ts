import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { firestore } from 'config/firebase';
import { collection, doc, getDocs, onSnapshot, Timestamp, updateDoc, query, limit, orderBy } from 'firebase/firestore';
import { Notification } from 'interfaces';
import { useAppContext } from 'providers';
import { useEffect } from 'react';

export const useListenForNotifications = () => {
    const { user } = useAppContext();
    const queryClient = useQueryClient();

    useEffect(() => {
        let unsubscribe = () => {};

        if (user?.uid) {
            unsubscribe = onSnapshot(
                collection(firestore, `/notifications/${user.uid}/userNotifications`),
                async () => {
                    await queryClient.invalidateQueries({
                        queryKey: ['get-notifications'],
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
