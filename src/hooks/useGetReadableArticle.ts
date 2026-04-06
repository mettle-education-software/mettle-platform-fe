import { useQuery } from '@tanstack/react-query';
import ApiClient from 'services/ApiClient';

const apiClient = new ApiClient('/api/article-content');

export type ReadableArticle = {
    title: string;
    content: string;
    textContent: string;
    excerpt: string | null;
    byline: string | null;
    siteName: string | null;
    length: number;
};

export const useGetReadableArticle = (url: string, enabled: boolean) => {
    return useQuery({
        queryKey: ['readable-article', url],
        queryFn: () => apiClient.get<ReadableArticle>('/', { params: { url } }).then(({ data }) => data),
        enabled,
        staleTime: 300000,
        refetchOnWindowFocus: false,
    });
};
