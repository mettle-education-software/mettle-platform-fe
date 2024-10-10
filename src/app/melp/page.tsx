'use client';

import styled from '@emotion/styled';
import { Col, Row, Typography } from 'antd';
import {
    CanStartDeda,
    Chip,
    DedaFinished,
    DedaPaused,
    DedaStarted,
    MaxWidthContainer,
    MelpBegin,
    WaitingForDedaStart,
    WeekZero,
} from 'components';
import { MelpStatus } from 'interfaces/melp';
import { withAuthentication } from 'libs';
import { useAppContext, useMelpContext } from 'providers';
import React from 'react';

const { Title } = Typography;

const HeaderWelcome = styled.section`
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    background: linear-gradient(0deg, var(--main-bg) 0%, #262421 100%);
    background-size: cover;
    display: flex;
    justify-content: center;
`;

const MainContent = styled.section`
    width: 100%;
    min-height: 100%;
    background: var(--main-bg);
    padding-top: 2rem;
    padding-bottom: 2rem;
    display: flex;
    justify-content: center;
`;

const renderMelpHome = (melpAccountStatus: MelpStatus) => {
    const melpStatusViews: Map<MelpStatus, React.ReactNode> = new Map([
        ['MELP_BEGIN', <MelpBegin key="MELP_BEGIN" />],
        ['WEEK_ZERO', <WeekZero key="WEEK_ZERO" />],
        ['CAN_START_DEDA', <CanStartDeda key="CAN_START_DEDA" />],
        ['DEDA_STARTED_NOT_BEGUN', <WaitingForDedaStart key="WAITING_FOR_DEDA_START" />],
        ['DEDA_STARTED', <DedaStarted key="DEDA_STARTED" />],
        ['DEDA_PAUSED', <DedaPaused key="DEDA_PAUSED" />],
        ['DEDA_FINISHED', <DedaFinished key="DEDA_FINISHED" />],
    ]);

    return melpStatusViews.get(melpAccountStatus);
};

const MelpHome = () => {
    const { melpSummary } = useMelpContext();
    const { user } = useAppContext();

    const melpStatus = melpSummary?.melp_status;
    const daysSinceMelpStart = melpSummary?.days_since_melp_start;

    let renderStatus: MelpStatus = melpStatus;

    if (melpStatus === 'MELP_BEGIN' && daysSinceMelpStart >= 2 && daysSinceMelpStart < 9) {
        renderStatus = 'WEEK_ZERO' as MelpStatus;
    }

    return (
        <React.Fragment>
            <HeaderWelcome>
                <MaxWidthContainer>
                    <Row gutter={[8, 8]}>
                        <Col span={24}>
                            <Chip bgColor="#383532" size="large" style={{ border: 'none', color: '#FFF' }}>
                                IMERSO
                            </Chip>
                        </Col>
                        <Col>
                            <Title level={3} className="color-secondary">
                                Welcome, {user?.name}.
                            </Title>
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </HeaderWelcome>

            <MainContent>
                <MaxWidthContainer>{renderMelpHome(renderStatus)}</MaxWidthContainer>
            </MainContent>
        </React.Fragment>
    );
};

export default withAuthentication(MelpHome);
