import { useQuery } from '@tanstack/react-query';
import { quotesService } from 'services';

export const useGetQuote = () => {
    return useQuery({
        queryKey: ['random-quotes'],
        queryFn: () =>
            quotesService
                .get<string>('', {
                    params: {
                        language: 'pt',
                    },
                })
                .then(({ data }) => data),
    });
};
