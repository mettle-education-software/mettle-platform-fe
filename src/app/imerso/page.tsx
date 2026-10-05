'use client';

import styled from '@emotion/styled';
import { Col, Row, Typography } from 'antd';
import {
    AppLayout,
    CanStartDeda,
    Chip,
    DedaFinished,
    DedaPaused,
    DedaStarted,
    MaxWidthContainer,
    MelpBegin,
    WaitingForDedaStart,
    WeekZero,
    withRoles,
} from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { MelpStatus } from 'interfaces/melp';
import { withAuthentication } from 'libs';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import dynamic from 'next/dynamic';
import { useAppContext, useMelpContext, useProductAccess } from 'providers';
import React from 'react';

// Home do IMERSO da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewImersoHome = dynamic(() => import('components/_new/NewImersoHome'), { ssr: false, loading: () => null });

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
    const { access } = useProductAccess();

    const melpStatus = melpSummary?.melp_status;
    const daysSinceMelpStart = melpSummary?.days_since_melp_start;

    let renderStatus: MelpStatus = melpStatus;

    if (melpStatus === 'MELP_BEGIN' && daysSinceMelpStart >= 2 && daysSinceMelpStart < 9) {
        renderStatus = 'WEEK_ZERO' as MelpStatus;
    }

    // Imerso expirado (cai em DEDA_PAUSED pela pausa do sistema): mesma home do DEDA em andamento, cujo único item que
    // abre é "Explore all DEDAs" — o AppLayout transforma os demais cliques no convite de renovação.
    if (access(IMERSO_PRODUCT).state === 'expired') {
        renderStatus = 'DEDA_STARTED';
    }

    const newDesign = useNewDesign();
    if (newDesign)
        return (
            <AppLayout withMelpSummary>
                <NewImersoHome />
            </AppLayout>
        );

    return (
        <AppLayout withMelpSummary>
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
                                Welcome, {user?.name.split(' ')[0]}
                            </Title>
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </HeaderWelcome>

            <MainContent>
                <MaxWidthContainer>{renderMelpHome(renderStatus)}</MaxWidthContainer>
            </MainContent>
        </AppLayout>
    );
};

const MelpWithRoles = withRoles(MelpHome, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        type: 'redirect',
        to: '/',
    },
});

export default withAuthentication(MelpWithRoles);
