import { useQuery } from '@tanstack/react-query';
import { DedaActivityStatusResponse } from 'interfaces';
import { getDayToday } from 'libs';
import { useAppContext, useMelpContext } from 'providers';
import { melpService } from 'services';

export const useCurrentDayDedaActivityStatus = () => {
    const { user } = useAppContext();
    const { melpSummary, isMelpSummaryLoading } = useMelpContext();

    const currentWeek = `week${melpSummary?.current_deda_week}`;
    const currentDay = getDayToday();

    return useQuery({
        queryKey: ['get-deda-status', currentWeek, currentDay],
        queryFn: () =>
            melpService
                .get<DedaActivityStatusResponse>(`/deda/status/${user?.uid}/${currentWeek}/${currentDay}`)
                .then(({ data }) => data),
        enabled: !!melpSummary && !isMelpSummaryLoading && !!user,
    });
};
