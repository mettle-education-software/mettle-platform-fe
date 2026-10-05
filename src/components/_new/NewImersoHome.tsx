'use client';

import { Button, Modal, Select } from 'antd';
import { useResumeDeda, useStartDeda } from 'hooks';
import { DedaDifficulties, DedaDifficulty, MelpStatus } from 'interfaces/melp';
import { getWeekDay, nextMondayDate } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { firstName } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewDedasGrid } from './NewDedasGrid';
import { NewHpecRow } from './NewHpecRow';
import { NewPage } from './NewPage';

/* ---------- estados (mesmo conteúdo, mesmas ações e mesmas chamadas de components/_melp/_melpHome) ---------- */

const ExploreAll: React.FC = () => {
    const router = useRouter();
    return (
        <button type="button" className="lnk gold" data-access-allow onClick={() => router.push('/imerso/deda')}>
            Explore all DEDAs <ArrowRight {...ICON} size={16} aria-hidden />
        </button>
    );
};

const Grid: React.FC<{ customTitle?: string; aside?: React.ReactNode }> = ({ customTitle, aside }) => {
    const router = useRouter();
    return (
        <NewDedasGrid
            type="lastDedas"
            customTitle={customTitle}
            aside={aside}
            onSelectedDeda={(dedaSlug) => router.push(dedaPath(dedaSlug))}
        />
    );
};

/** CAN_START_DEDA: confirmar o início (modal de intensidade, mesmos textos e a mesma chamada de useStartDeda). */
const CanStart: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [level, setLevel] = useState<DedaDifficulty>('EASY');
    const confirmDedaStart = useStartDeda();

    const levelTexts: Record<DedaDifficulty, React.ReactNode> = {
        EASY: 'A gradual pace, reaching 3 hours/day (1 hour 15 minutes active, 1 hour 45 minutes passive) within 10 months (41 weeks).',
        MEDIUM: 'A moderate pace, reaching 4 hours/day (1 hour 30 minutes active, 2 hours 30 minutes passive) within 8 months (33 weeks).',
        HARD: 'An accelerated pace, reaching 5 hours/day (2 hours active, 3 hours passive) within 6 months (25 weeks).',
    };

    return (
        <>
            <Modal
                maskClosable
                destroyOnClose
                title="Choose your intensity level"
                open={open}
                onOk={() => confirmDedaStart.mutate({ userGoalLevel: level }, { onSuccess: () => setOpen(false) })}
                okButtonProps={{ loading: confirmDedaStart.isPending }}
                onCancel={() => setOpen(false)}
                okText={`Confirm ${DedaDifficulties[level]}`}
                cancelText="Cancel"
            >
                <div className="modal-body">
                    <p className="eyebrow">Intensity level options</p>
                    <Select
                        className="full-width"
                        value={level}
                        onChange={(value) => setLevel(value)}
                        options={Object.keys(DedaDifficulties).map((key) => ({
                            label: DedaDifficulties[key as DedaDifficulty],
                            value: key,
                        }))}
                    />
                    <p>
                        The intensity level you select determines how quickly you’ll reach your daily targets and,
                        ultimately, achieve your goal of English fluency:
                    </p>
                    <p className="level">
                        <strong>{DedaDifficulties[level]}: </strong>
                        {levelTexts[level]}
                    </p>
                    <p>
                        These targets help you structure your routine effectively, ensuring steady progress based on
                        your commitment level.
                    </p>
                    <p className="hint">
                        Note: You can only select your intensity level at the start of the program or when restarting it
                        using one of your reset options.
                    </p>
                </div>
            </Modal>
            <div className="notice">
                <div>
                    <b>Hey there!</b>
                    <p>
                        You can start already the DEDA program. The next available date is{' '}
                        <strong>{nextMondayDate().toLocaleDateString()}</strong>
                    </p>
                </div>
                <Button type="primary" onClick={() => setOpen(true)} loading={confirmDedaStart.isPending}>
                    Confirm DEDA start
                </Button>
            </div>
            <NewHpecRow />
            <Grid customTitle="DEDA week zero" />
        </>
    );
};

const Waiting: React.FC = () => (
    <>
        <div className="notice">
            <div>
                <b>Great!</b>
                <p>
                    You have confirmed the start of DEDA. Come back on{' '}
                    <strong>{nextMondayDate().toLocaleDateString()}</strong> to start.
                </p>
            </div>
        </div>
        <NewHpecRow />
    </>
);

const Started: React.FC = () => (
    <>
        <NewHpecRow />
        <Grid aside={<ExploreAll />} />
    </>
);

const Paused: React.FC = () => {
    const resumeDeda = useResumeDeda();
    return (
        <>
            <div className="notice">
                <div>
                    <b>Feel like getting back to DEDA?</b>
                    <p>
                        You can return to the DEDA program. The next available date is{' '}
                        <strong>{nextMondayDate().toLocaleDateString()}</strong>
                    </p>
                </div>
                <Button type="primary" onClick={() => resumeDeda.mutate()} loading={resumeDeda.isPending}>
                    Return to DEDA
                </Button>
            </div>
            <NewHpecRow />
            <Grid />
        </>
    );
};

const Finished: React.FC = () => (
    <>
        <div className="notice">
            <div>
                <b>Well done!</b>
                <p>You have completed all DEDA weeks!</p>
            </div>
        </div>
        <NewHpecRow />
        <Grid customTitle="Dive back again" aside={<ExploreAll />} />
    </>
);

const VIEWS: Partial<Record<MelpStatus, React.ReactNode>> = {
    MELP_BEGIN: <NewHpecRow />,
    WEEK_ZERO: (
        <>
            <NewHpecRow />
            <Grid customTitle="DEDA week zero" />
        </>
    ),
    CAN_START_DEDA: <CanStart />,
    DEDA_STARTED_NOT_BEGUN: <Waiting />,
    DEDA_STARTED: <Started />,
    DEDA_PAUSED: <Paused />,
    DEDA_FINISHED: <Finished />,
};

/**
 * Home do IMERSO (/imerso) na plataforma nova. O estado mostrado segue exatamente a regra da página atual
 * (melp_status, semana zero pelos dias desde o início, expirado = DEDA em andamento sob o convite de renovação).
 */
export const NewImersoHome: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { user } = useAppContext();
    const { access } = useProductAccess();

    const melpStatus = melpSummary?.melp_status;
    const daysSinceMelpStart = melpSummary?.days_since_melp_start;

    let renderStatus: MelpStatus = melpStatus;
    if (melpStatus === 'MELP_BEGIN' && daysSinceMelpStart >= 2 && daysSinceMelpStart < 9) {
        renderStatus = 'WEEK_ZERO' as MelpStatus;
    }
    if (access(IMERSO_PRODUCT).state === 'expired') {
        renderStatus = 'DEDA_STARTED';
    }

    return (
        <NewPage>
            <header className="ph">
                <p className="eyebrow">IMERSO</p>
                <h1>Welcome, {firstName(user?.name)}</h1>
                {melpStatus === 'DEDA_STARTED' && (
                    <p className="ctx">
                        DEDA <b>{melpSummary.currentDedaName}</b> · Week {melpSummary.current_deda_week} · Day{' '}
                        {getWeekDay()}
                    </p>
                )}
            </header>
            {VIEWS[renderStatus] ??
                (melpStatus === 'MELP_SUSPENDED' && <p className="hint">Your IMERSO access is suspended.</p>)}
        </NewPage>
    );
};

export default NewImersoHome;
