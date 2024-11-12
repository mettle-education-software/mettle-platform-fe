import { useQuery } from '@tanstack/react-query';
import ApiClient from 'services/ApiClient';

const apiClient = new ApiClient('/api/metadata');

export const useGetMetadata = (url: string) => {
    return useQuery({
        queryKey: ['link-metadata', url],
        queryFn: () =>
            apiClient
                .get<{
                    canEmbed: boolean;
                    reason?: string;
                    image?: string;
                }>('/', { params: { url } })
                .then(({ data }) => data),
        staleTime: 300000,
        refetchOnWindowFocus: false,
    });
};
