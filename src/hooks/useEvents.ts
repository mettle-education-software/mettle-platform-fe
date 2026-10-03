import { useMutation } from '@tanstack/react-query';
import { n8nServiceWebhook } from 'services';

export const useProductEventsSender = () => {
    return useMutation({
        mutationFn: ({
            productId,
            dto,
        }: {
            productId: string;
            dto: {
                eventKey: number;
                userUid: string;
                userEmail: string;
                userFirstName: string;
            };
        }) => n8nServiceWebhook.post(`/event-handler/${productId}`, { ...dto }),
    });
};

export const useFirstLoginEvent = () => {
    return useMutation({
        mutationFn: ({ email }: { email: string }) =>
            n8nServiceWebhook.post('/user-logged-in', {
                email_address: email,
            }),
    });
};
