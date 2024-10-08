import { useQuery } from '@tanstack/react-query';
import { QueryParams } from 'interfaces';
import { useAppContext } from 'providers';
import { adminService } from 'services';

export const useGetMettleUsers = (params: QueryParams) => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['mettle-users', params],
        queryFn: () =>
            adminService
                .get<{
                    data: {
                        user_uid: string;
                        first_name: string;
                        last_name: string;
                        email: string;
                    }[];
                    pagination: {
                        limit: number;
                        offset: number;
                    };
                }>('/v2/users', {
                    params: {
                        ...params,
                        offset: 0,
                        limit: 1000,
                    },
                })
                .then(({ data }) => data),
        enabled: !!user && user?.roles?.includes('METTLE_ADMIN'),
    });
};
