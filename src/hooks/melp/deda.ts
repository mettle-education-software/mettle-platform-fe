import { useQuery } from '@tanstack/react-query';
import { DedaActivityStatusResponse, FireUser } from 'interfaces';
import { MelpSummaryResponse } from 'interfaces/melp';
import { getDayToday } from 'libs';
import { melpService } from 'services';

export const useCurrentDayDedaActivityStatus = (melpSummary?: MelpSummaryResponse['data'], user?: FireUser) => {
    const currentWeek = `week${melpSummary?.current_deda_week}`;
    const currentDay = getDayToday();

    return useQuery({
        queryKey: ['get-deda-status', currentWeek, currentDay],
        queryFn: () =>
            melpService
                .get<DedaActivityStatusResponse>(`/deda/status/${user?.uid}/${currentWeek}/${currentDay}`)
                .then(({ data }) => data),
        enabled: !!melpSummary && !!user,
    });
};
