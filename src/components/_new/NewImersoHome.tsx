'use client';

import { Button, Modal, Select } from 'antd';
import { useResumeDeda, useStartDeda } from 'hooks';
import { DedaDifficulties, DedaDifficulty, MelpStatus } from 'interfaces/melp';
import { formatImersoDate, nextMondayDate } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { firstName, IntensityLang, readIntensityLang, saveIntensityLang } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AccessCtaBlock, useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewDedasGrid } from './NewDedasGrid';
import { Dash, HpecSection, Kpis, NowRow, RecentDedas, SummaryError, SuspendedNotice, useTrail } from './NewImersoDash';
import { NewPage } from './NewPage';
import { NewContentLoading } from './NewStatus';

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

/**
 * Textos do modal de intensidade em inglês (os de hoje) e em português (tradução, mesmos números). Ficam no código:
 * não vêm do conteúdo (Contentful).
 */
const INTENSITY_TEXTS = {
    en: {
        title: 'Choose your intensity level',
        options: 'Intensity level options',
        intro: 'The intensity level you select determines how quickly you’ll reach your daily targets and, ultimately, achieve your goal of English fluency:',
        levels: {
            EASY: 'A gradual pace, reaching 3 hours/day (1 hour 15 minutes active, 1 hour 45 minutes passive) within 10 months (41 weeks).',
            MEDIUM: 'A moderate pace, reaching 4 hours/day (1 hour 30 minutes active, 2 hours 30 minutes passive) within 8 months (33 weeks).',
            HARD: 'An accelerated pace, reaching 5 hours/day (2 hours active, 3 hours passive) within 6 months (25 weeks).',
        } as Record<DedaDifficulty, string>,
        targets:
            'These targets help you structure your routine effectively, ensuring steady progress based on your commitment level.',
        note: 'Note: You can only select your intensity level at the start of the program or when restarting it using one of your reset options.',
        confirm: (name: string) => `Confirm ${name}`,
        cancel: 'Cancel',
    },
    pt: {
        title: 'Escolha seu nível de intensidade',
        options: 'Níveis de intensidade',
        intro: 'O nível de intensidade que você escolher determina em quanto tempo você vai atingir suas metas diárias e, assim, alcançar seu objetivo de fluência em inglês:',
        levels: {
            EASY: 'Um ritmo gradual, chegando a 3 horas por dia (1 hora e 15 minutos de ativo, 1 hora e 45 minutos de passivo) em 10 meses (41 semanas).',
            MEDIUM: 'Um ritmo moderado, chegando a 4 horas por dia (1 hora e 30 minutos de ativo, 2 horas e 30 minutos de passivo) em 8 meses (33 semanas).',
            HARD: 'Um ritmo acelerado, chegando a 5 horas por dia (2 horas de ativo, 3 horas de passivo) em 6 meses (25 semanas).',
        } as Record<DedaDifficulty, string>,
        targets:
            'Essas metas ajudam você a organizar sua rotina com eficiência, garantindo um progresso constante de acordo com o seu nível de comprometimento.',
        note: 'Observação: você só pode escolher o nível de intensidade no início do programa ou ao reiniciá-lo usando uma das suas opções de reinício.',
        confirm: (name: string) => `Confirmar ${name}`,
        cancel: 'Cancelar',
    },
};

/** CAN_START_DEDA: confirmar o início (modal de intensidade, mesmos textos e a mesma chamada de useStartDeda). */
const CanStart: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [level, setLevel] = useState<DedaDifficulty>('EASY');
    const [lang, setLang] = useState<IntensityLang>('en');
    useEffect(() => setLang(readIntensityLang()), []);
    const pickLang = (value: IntensityLang) => {
        setLang(value);
        saveIntensityLang(value);
    };
    const t = INTENSITY_TEXTS[lang];
    const confirmDedaStart = useStartDeda();

    return (
        <>
            <Modal
                maskClosable
                destroyOnClose
                title={
                    <div className="title-row">
                        <span lang={lang}>{t.title}</span>
                        <span className="lang" role="group" aria-label="Language / Idioma">
                            {(['en', 'pt'] as const).map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    lang={value}
                                    aria-pressed={lang === value}
                                    onClick={() => pickLang(value)}
                                >
                                    {value.toUpperCase()}
                                </button>
                            ))}
                        </span>
                    </div>
                }
                open={open}
                onOk={() => confirmDedaStart.mutate({ userGoalLevel: level }, { onSuccess: () => setOpen(false) })}
                okButtonProps={{ loading: confirmDedaStart.isPending }}
                onCancel={() => setOpen(false)}
                okText={t.confirm(DedaDifficulties[level])}
                cancelText={t.cancel}
            >
                <div className="modal-body" lang={lang}>
                    <p className="eyebrow">{t.options}</p>
                    <Select
                        className="full-width"
                        value={level}
                        onChange={(value) => setLevel(value)}
                        aria-label={t.options}
                        options={Object.keys(DedaDifficulties).map((key) => ({
                            label: DedaDifficulties[key as DedaDifficulty],
                            value: key,
                        }))}
                    />
                    <p>{t.intro}</p>
                    <p className="level">
                        <strong>{DedaDifficulties[level]}: </strong>
                        {t.levels[level]}
                    </p>
                    <p>{t.targets}</p>
                    <p className="hint">{t.note}</p>
                </div>
            </Modal>
            <div className="notice">
                <div>
                    <b>You can start DEDA</b>
                    <p>
                        Next start: <strong>{formatImersoDate(nextMondayDate())}</strong>
                    </p>
                </div>
                <Button type="primary" onClick={() => setOpen(true)} loading={confirmDedaStart.isPending}>
                    Start DEDA
                </Button>
            </div>
        </>
    );
};

const Waiting: React.FC = () => (
    <div className="notice">
        <div>
            <b>DEDA starts on {formatImersoDate(nextMondayDate())}</b>
        </div>
    </div>
);

const Paused: React.FC = () => {
    const resumeDeda = useResumeDeda();
    return (
        <div className="notice">
            <div>
                <b>LAMP is paused</b>
                <p>
                    Next start: <strong>{formatImersoDate(nextMondayDate())}</strong>
                </p>
            </div>
            <Button type="primary" onClick={() => resumeDeda.mutate()} loading={resumeDeda.isPending}>
                Resume LAMP
            </Button>
        </div>
    );
};

const Finished: React.FC = () => (
    <div className="notice">
        <div>
            <b>Well done!</b>
            <p>You have completed all DEDA weeks!</p>
        </div>
    </div>
);

/** O que cada estado mostra: aviso (como hoje), "Agora", números da LAMP, percurso do HPEC e DEDAs. */
type View = {
    notice?: React.ReactNode;
    /** DEDA de hoje no "Agora" (só com o DEDA em andamento) */
    deda?: boolean;
    /** números da LAMP (há semanas de DEDA registradas) */
    kpis?: boolean;
    dedas?: React.ReactNode;
};

const VIEWS: Partial<Record<MelpStatus, View>> = {
    MELP_BEGIN: {},
    WEEK_ZERO: { dedas: <Grid customTitle="DEDA week zero" /> },
    CAN_START_DEDA: { notice: <CanStart />, dedas: <Grid customTitle="DEDA week zero" /> },
    DEDA_STARTED_NOT_BEGUN: { notice: <Waiting /> },
    DEDA_STARTED: { deda: true, kpis: true, dedas: <RecentDedas aside={<ExploreAll />} /> },
    DEDA_PAUSED: { notice: <Paused />, kpis: true, dedas: <RecentDedas skipCurrent={false} aside={<ExploreAll />} /> },
    DEDA_FINISHED: {
        notice: <Finished />,
        kpis: true,
        dedas: <RecentDedas title="Dive back again" skipCurrent={false} aside={<ExploreAll />} />,
    },
};

/**
 * Home do IMERSO (/imerso) na plataforma nova. O estado mostrado segue a regra da página atual (melp_status, semana
 * zero pelos dias desde o início); leitura põe a linha de renovação no lugar do aviso, suspenso mostra o aviso com a
 * saída, e falha do resumo um "Try again".
 */
export const NewImersoHome: React.FC = () => {
    const { melpSummary, isMelpSummaryError, retryMelpSummary } = useMelpContext();
    const { user } = useAppContext();
    const { access } = useProductAccess();

    const melpStatus = melpSummary?.melp_status;
    const daysSinceMelpStart = melpSummary?.days_since_melp_start;

    let renderStatus: MelpStatus = melpStatus;
    if (melpStatus === 'MELP_BEGIN' && daysSinceMelpStart >= 2 && daysSinceMelpStart < 9) {
        renderStatus = 'WEEK_ZERO' as MelpStatus;
    }
    // Leitura: uma linha calma com a renovação no lugar do aviso do estado (as ações dele gravam); o painel fica para
    // ver, e o que abre um DEDA ou uma aula leva à renovação.
    const readOnly = access(IMERSO_PRODUCT).state === 'expired';

    const view = VIEWS[renderStatus];
    const { trail, loading, error } = useTrail();

    let body: React.ReactNode;
    if (isMelpSummaryError) body = <SummaryError onRetry={retryMelpSummary} />;
    else if (!melpSummary) body = <NewContentLoading />;
    else if (melpStatus === 'MELP_SUSPENDED') body = <SuspendedNotice />;
    else if (view)
        body = (
            <>
                {!readOnly && view.notice}
                <NowRow withDeda={!!view.deda} trail={trail} error={error} />
                {view.kpis && (
                    <section aria-label="Your numbers">
                        <Kpis />
                    </section>
                )}
                <HpecSection trail={trail} loading={loading} error={error} />
                {view.dedas}
            </>
        );

    return (
        <NewPage className="xwide">
            <Dash>
                <header className="ph">
                    <h1>Welcome, {firstName(user?.name)}</h1>
                </header>
                {readOnly && <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />}
                {body}
            </Dash>
        </NewPage>
    );
};

export default NewImersoHome;
