import { useQuery } from '@tanstack/react-query';
import { useAppContext } from 'providers';
import { adminService } from 'services';

export const useGetMettleUsers = () => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['mettle-users'],
        queryFn: () =>
            adminService
                .get<{
                    data: {
                        user_uid: string;
                        first_name: string;
                        email: string;
                    }[];
                    pagination: {
                        limit: number;
                        offset: number;
                    };
                }>('/v2/users', {
                    params: {
                        offset: 0,
                        limit: 1000,
                    },
                })
                .then(({ data }) => data),
        enabled: !!user && user.roles.includes('METTLE_ADMIN'),
    });
};
