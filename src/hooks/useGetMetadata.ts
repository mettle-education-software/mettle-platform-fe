import { useQuery } from '@tanstack/react-query';

export const useGetMetadata = (url: string) => {
    return useQuery({
        queryKey: ['metadata', url],
        queryFn: () =>
            fetch(`/api/metadata?url=${url}`)
                .then((res) => res.json())
                .then((data) => data),
        enabled: !!url,
        retry: false,
    });
};
