import { useQuery } from '@tanstack/react-query';
import { IUserResponse } from 'interfaces';
import { melpService } from 'services';

export const useGetUser = (userUid?: string) => {
    return useQuery({
        queryKey: ['get-user', userUid],
        queryFn: () => melpService.get<IUserResponse>(`/${userUid as string}/summary`).then(({ data }) => data),
        enabled: !!userUid,
    });
};
