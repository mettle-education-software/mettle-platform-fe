import { useQuery } from '@tanstack/react-query';
import { MelpSummaryResponse } from 'interfaces/melp';
import { melpService } from 'services';

export const useMelpSummary = (userUid?: string) => {
    return useQuery({
        queryKey: ['melp-summary', userUid],
        queryFn: () => melpService.get<MelpSummaryResponse>(`/${userUid as string}/summary`).then(({ data }) => data),
        enabled: !!userUid,
    });
};
