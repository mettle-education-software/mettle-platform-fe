'use client';

import {
    AppLayout,
    CanStartDeda,
    DedaFinished,
    DedaPaused,
    DedaStarted,
    MelpBegin,
    WaitingForDedaStart,
    WeekZero,
} from 'components';
import { MelpStatus } from 'interfaces/melp';
import { withAuthentication } from 'libs';
import { useMelpContext } from 'providers/MelpProvider';
import React from 'react';

const renderMelpHome = (melpAccountStatus: MelpStatus) => {
    const melpStatusViews: Map<MelpStatus, React.ReactNode> = new Map([
        ['MELP_BEGIN', <MelpBegin key="MELP_BEGIN" />],
        ['CAN_START_DEDA', <CanStartDeda key="CAN_START_DEDA" />],
        ['WEEK_ZERO' as MelpStatus, <WeekZero key="WEEK_ZERO" />],
        ['DEDA_STARTED_NOT_BEGUN', <WaitingForDedaStart key="WAITING_FOR_DEDA_START" />],
        ['DEDA_STARTED', <DedaStarted key="DEDA_STARTED" />],
        ['DEDA_PAUSED', <DedaPaused key="DEDA_PAUSED" />],
        ['DEDA_FINISHED', <DedaFinished key="DEDA_FINISHED" />],
    ]);

    return melpStatusViews.get(melpAccountStatus);
};

const MelpHome = () => {
    const { melpSummary } = useMelpContext();

    const melpStatus = melpSummary?.melp_status;
    const daysSinceMelpStart = melpSummary?.days_since_melp_start;

    let renderStatus: MelpStatus = melpStatus;

    if (melpStatus === 'MELP_BEGIN' && daysSinceMelpStart >= 2 && daysSinceMelpStart < 9) {
        renderStatus = 'WEEK_ZERO' as MelpStatus;
    }

    return <AppLayout withMelpSummary>{renderMelpHome(renderStatus)}</AppLayout>;
};

export default withAuthentication(MelpHome);
