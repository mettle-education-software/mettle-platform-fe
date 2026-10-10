'use client';

import { css, Global } from '@emotion/react';
import { useIsMutating } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { useMelpSummary, usePauseDeda, useResetMelp, useUpdatePassword } from 'hooks';
import { useProfile } from 'hooks/useProfile';
import { passwordRules, saoPauloWeekday } from 'libs';
import { longDate, productLines } from 'libs/myProducts';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { brLongDate, programHistory } from 'libs/programHistory';
import { Info } from 'lucide-react';
import { useAppContext, useProductAccess } from 'providers';
import React, { useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';
import { ProfileDataCard, ProfileIdentity } from './ProfileSettings';
import { ThemeSwitch } from './ThemeSwitch';

// Configurações no desenho de 10-Out-2026 (página "Apple ID"): leve, arejada, conteúdo primeiro. Cartões agrupados
// (cantos 16 px, superfície, divisórias finas por dentro), títulos pequenos, ~32 px entre cartões, sem linhas entre
// seções; até 720 px, alinhado à esquerda. Os tokens são os de ui.ts (dois temas).
const styles = css`
    .ui-new-page.settings {
        max-width: 720px;
        margin-left: 0;
    }
    .settings .idh {
        display: flex;
        align-items: center;
        gap: 20px;
        margin: 8px 0 36px;
        min-width: 0;
    }
    .settings .idh-av {
        position: relative;
        flex: none;
        display: grid;
        place-items: center;
        width: 92px;
        height: 92px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--r-surf);
        color: var(--r-text);
        font: inherit;
        font-size: 34px;
        font-weight: 300;
        cursor: pointer;
    }
    .settings .idh-av img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
    .settings .idh-av:focus-visible {
        outline: 2px solid var(--r-gold);
        outline-offset: 3px;
    }
    .settings .idh-cam {
        position: absolute;
        right: 0;
        bottom: 0;
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 2px solid var(--r-bg);
        border-radius: 50%;
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .settings .idh-text {
        min-width: 0;
    }
    .settings .idh-name {
        margin: 0;
        font-size: 26px;
        font-weight: 400;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .settings .idh-sub {
        margin: 4px 0 0;
        font-size: 14px;
        color: var(--r-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .settings .idh-error {
        flex-basis: 100%;
    }
    .settings > section + section {
        margin-top: 32px;
    }
    .settings .st {
        margin: 0 0 10px 4px;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    .settings .card {
        margin: 0;
        padding: 0;
        list-style: none;
        border-radius: 16px;
        background: var(--r-surf);
    }
    .settings .cr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px 16px;
        min-height: 56px;
        padding: 14px 18px;
    }
    .settings .cr + .cr {
        border-top: 1px solid var(--r-line);
    }
    .settings .cr-main {
        min-width: 0;
        flex: 1 1 auto;
    }
    .settings .cr-name {
        display: block;
        font-size: 15px;
        font-weight: 500;
    }
    .settings .cr-sub {
        display: block;
        margin-top: 3px;
        font-size: 13.5px;
        line-height: 1.45;
        color: var(--r-muted);
        overflow-wrap: anywhere;
    }
    .settings .prod-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 10px;
    }
    .settings .cr-alert {
        display: block;
        margin-top: 4px;
        font-size: 13.5px;
        line-height: 1.45;
        color: var(--r-text);
    }
    .settings .cr-alert.soon {
        color: var(--r-gold-hi);
    }
    .settings .cr-side {
        flex: none;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .settings .cr.stack .cr-side {
        flex: 0 1 auto;
        min-width: 0;
    }
    .settings .cr-value {
        min-width: 0;
        font-size: 14.5px;
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .settings .pill {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--r-line-strong);
        font-size: 12.5px;
        color: var(--r-muted);
        white-space: nowrap;
    }
    .settings .pill.on {
        border-color: transparent;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .settings .pill.warn {
        border-color: var(--r-gold);
        color: var(--r-gold-hi);
    }
    .settings .btn.sm {
        min-height: 36px;
        padding: 0 16px;
        font-size: 13.5px;
    }
    .settings .cr-info {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .settings .cr-info svg {
        color: var(--r-faint);
    }
    .settings .tl {
        padding: 6px 18px 14px;
        border-top: 1px solid var(--r-line);
    }
    .settings .tl ol {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .settings .tl h3 {
        margin: 10px 0 6px;
        font-size: 13px;
        font-weight: 500;
        color: var(--r-muted);
    }
    .settings .tl li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 7px 0;
        font-size: 14px;
    }
    .settings .tl li span {
        flex: none;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    /* Dados pessoais (o formulário traz a grade): o respiro do card */
    .settings .pf {
        padding: 18px;
    }
    .settings .card .hint {
        margin: 0;
        padding: 16px 18px;
    }
    @media (max-width: 860px) {
        .settings .idh {
            gap: 16px;
            margin-bottom: 28px;
        }
        .settings .idh-av {
            width: 84px;
            height: 84px;
        }
        .settings .idh-name {
            font-size: 22px;
        }
        .settings .cr {
            padding: 14px 16px;
        }
        .settings .cr.stack {
            flex-direction: column;
            align-items: flex-start;
        }
        .settings .cr.stack .cr-side {
            max-width: 100%;
        }
    }
`;

// "warn" (não "grace": a casca já tem uma faixa global .grace)
const PILL_TONE: Record<string, string> = { Ativo: ' on', Carência: ' warn', Leitura: '' };

/** "Meus produtos": um cartão com uma linha por produto, só do modelo de acesso (GET /accounts/me). */
const ProductsCard: React.FC = () => {
    const profile = useProfile();
    if (!profile.data)
        return (
            <div className="card">
                <p className="hint" role="status">
                    {profile.isError ? 'Não foi possível carregar os seus produtos.' : 'Carregando…'}
                </p>
            </div>
        );
    const lines = productLines(profile.data.accessDetails);
    if (!lines.length)
        return (
            <div className="card">
                <p className="hint">Nenhum produto nesta conta.</p>
            </div>
        );
    return (
        <ul className="card" aria-label="Meus produtos">
            {lines.map((line) => (
                <li className={`cr${line.renew ? ' stack' : ''}`} key={line.key}>
                    <div className="cr-main">
                        <div className="prod-head">
                            <b className="cr-name">{line.name}</b>
                            <span className={`pill${PILL_TONE[line.pill]}`}>{line.pill}</span>
                        </div>
                        {line.details && <span className="cr-sub">{line.details}</span>}
                        {line.alert && <span className={`cr-alert${line.soon ? ' soon' : ''}`}>{line.alert}</span>}
                    </div>
                    {line.renew && (
                        <div className="cr-side">
                            <a className="btn line sm" href={line.renew} target="_blank" rel="noopener noreferrer">
                                Renovar
                            </a>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};

/** "Programa Imerso": semana e início, pausar e reiniciar a LAMP, e o histórico. */
const ProgramCard: React.FC = () => {
    const programReset = useResetMelp();
    const pauseDeda = usePauseDeda();
    const { user } = useAppContext();
    // leitura (pela claim ou pelo modelo de acesso, como em Meus produtos): sem pausar nem reiniciar (o servidor
    // recusaria); a LAMP fica pausada pelo sistema. A semana e o histórico ficam.
    const claimReadOnly = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
    const imersoRow = useProfile().data?.accessDetails?.find((row) => row?.product === 'imerso');
    const readOnly = claimReadOnly || imersoRow?.state === 'leitura';
    // a mesma consulta (e o mesmo cache) do MelpProvider, com o estado completo: dados, carregando, erro, nova tentativa
    const summary = useMelpSummary(user?.uid);
    const melpSummary = summary.data;
    // Mutações em curso no app inteiro, inclusive ao sair da página e voltar.
    const mutating = useIsMutating() > 0;
    const [modal, modalHolder] = Modal.useModal();
    const status = (summary.error as { response?: { status?: number } } | null)?.response?.status;
    const retry = (
        <Button type="link" size="small" onClick={() => summary.refetch()}>
            Tentar de novo
        </Button>
    );

    // sem resumo: carregando; conta sem programa ou sem acesso (404/403): uma linha; outra falha: nova tentativa
    if (!melpSummary)
        return (
            <div className="card">
                {summary.isLoading ? (
                    <p className="hint" role="status">
                        Carregando…
                    </p>
                ) : (summary.isError && status !== 404 && status !== 403) || summary.isPaused ? (
                    <p className="hint">Não foi possível carregar o programa IMERSO. {retry}</p>
                ) : (
                    <p className="hint">Programa IMERSO indisponível nesta conta.</p>
                )}
            </div>
        );

    // uma ação por vez e nunca sobre um resumo velho (se a atualização falhou, as ações esperam nova tentativa)
    const stale = summary.isError;
    const busy = mutating || programReset.isPending || pauseDeda.isPending || stale;
    const history = programHistory(melpSummary.program_events, melpSummary.remaining_resets, undefined, brLongDate);
    const started = longDate(melpSummary.deda_first_monday ?? melpSummary.melp_start_date);

    return (
        <div className="card">
            {modalHolder}
            <div className="cr">
                <div className="cr-main">
                    <b className="cr-name">
                        Semana {melpSummary.current_deda_week} · Dia {saoPauloWeekday()}
                    </b>
                    {started && <span className="cr-sub">Início em {started}</span>}
                </div>
            </div>
            {readOnly && (
                <div className="cr">
                    <p className="cr-sub">A LAMP fica pausada enquanto o seu acesso estiver em Leitura.</p>
                </div>
            )}
            {stale && (
                <div className="cr">
                    <p className="cr-sub">Não foi possível atualizar o programa IMERSO. {retry}</p>
                </div>
            )}
            {!readOnly && melpSummary.melp_status === 'DEDA_STARTED' && (
                <div className="cr">
                    <div className="cr-main">
                        <b className="cr-name cr-info">
                            Pausar a LAMP
                            <Tooltip title="Para a contagem da LAMP enquanto você estiver fora. Os DEDAs e o HPEC continuam sendo liberados.">
                                <Info {...ICON} size={15} aria-label="Sobre pausar a LAMP" />
                            </Tooltip>
                        </b>
                        <span className="cr-sub">Pausas restantes: {melpSummary.remaining_pauses}</span>
                    </div>
                    <div className="cr-side">
                        <Button
                            loading={pauseDeda.isPending}
                            disabled={busy}
                            onClick={() =>
                                modal.confirm({
                                    title: 'Pausar a LAMP?',
                                    content: (
                                        <>
                                            <p>
                                                A LAMP para de contar a partir de agora. A semana em andamento é zerada:
                                                a LAMP fica parada no fim da semana passada.
                                            </p>
                                            <p>Os DEDAs e o HPEC continuam sendo liberados toda semana.</p>
                                            <p>
                                                Para voltar, toque em “Resume LAMP” na página do Imerso. A LAMP volta a
                                                contar na segunda-feira seguinte (no mesmo dia, se for segunda), de onde
                                                parou e com as mesmas metas.
                                            </p>
                                            <p>Você usa 1 das suas {melpSummary.remaining_pauses} pausas.</p>
                                        </>
                                    ),
                                    okText: 'Pausar a LAMP',
                                    cancelText: 'Cancelar',
                                    onOk: () => pauseDeda.mutateAsync().catch(() => undefined),
                                })
                            }
                        >
                            Pausar
                        </Button>
                    </div>
                </div>
            )}
            {!readOnly && (
                <div className="cr">
                    <div className="cr-main">
                        <b className="cr-name cr-info">
                            Reiniciar a LAMP
                            <Tooltip title="Zera a sua LAMP. Os seus DEDAs e o HPEC continuam como estão.">
                                <Info {...ICON} size={15} aria-label="Sobre reiniciar a LAMP" />
                            </Tooltip>
                        </b>
                        <span className="cr-sub">Reinícios restantes: {melpSummary.remaining_resets}</span>
                    </div>
                    <div className="cr-side">
                        <Button
                            loading={programReset.isPending}
                            disabled={busy}
                            onClick={() =>
                                modal.confirm({
                                    title: 'Reiniciar a LAMP?',
                                    content: (
                                        <>
                                            <p>
                                                A sua LAMP é zerada e volta a contar na próxima segunda-feira (no mesmo
                                                dia, se hoje for segunda).
                                            </p>
                                            <p>
                                                Os seus DEDAs e o HPEC não mudam: você continua exatamente de onde está.
                                            </p>
                                            <p>
                                                Se você estiver em pausa, a pausa termina junto, sem gastar outra pausa.
                                            </p>
                                            <p>
                                                Você usa 1 dos seus {melpSummary.remaining_resets} reinícios. Não dá
                                                para desfazer.
                                            </p>
                                        </>
                                    ),
                                    okText: 'Reiniciar a LAMP',
                                    cancelText: 'Cancelar',
                                    onOk: () => programReset.mutateAsync().catch(() => undefined),
                                })
                            }
                        >
                            Reiniciar
                        </Button>
                    </div>
                </div>
            )}
            {history.length > 0 && (
                <div className="tl">
                    <h3 id="s-history">Histórico do programa</h3>
                    <ol aria-labelledby="s-history">
                        {history.map((row) => (
                            <li key={row.key}>
                                {row.label}
                                <span>{row.when}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

/** Troca de senha (dentro do modal: fechar desmonta e limpa o que foi digitado). */
const PasswordForm: React.FC = () => {
    const [form] = Form.useForm();
    const newPassword = Form.useWatch('newPassword', form);
    useEffect(() => {
        if (!newPassword) form.resetFields(['newPasswordRepeat']);
    }, [newPassword, form]);
    const updatePassword = useUpdatePassword();
    return (
        <Form
            form={form}
            layout="vertical"
            colon={false}
            onFinish={({ newPasswordRepeat }: { newPasswordRepeat: string }) =>
                updatePassword.mutate(newPasswordRepeat)
            }
        >
            <Form.Item name="newPassword" label="Nova senha" rules={passwordRules}>
                <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
                name="newPasswordRepeat"
                label="Repita a nova senha"
                rules={[
                    { required: true, message: 'Por favor insira uma nova senha' },
                    { min: 8, message: 'A senha deve ter pelo menos 8 caracteres' },
                    {
                        validator: async (_, value) => {
                            if (value !== newPassword) {
                                return Promise.reject(new Error('As senhas não coincidem'));
                            }
                            const validationRegex = new RegExp(/^(?!.*\s)(?=.*[a-zA-Z])(?=.*\d)(?=.*\W).{8,}$/, 'g');
                            if (!validationRegex.test(value)) {
                                return Promise.reject(
                                    new Error(
                                        'A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
                                    ),
                                );
                            }
                        },
                    },
                ]}
            >
                <Input.Password autoComplete="new-password" disabled={!newPassword} />
            </Form.Item>
            <Button loading={updatePassword.isPending} htmlType="submit" type="primary" block>
                Alterar senha
            </Button>
        </Form>
    );
};

/** "Acesso e segurança": o e-mail (só leitura) e a senha, que troca num modal. */
const SecurityCard: React.FC = () => {
    const { user } = useAppContext();
    const email = useProfile().data?.email || user?.email || 'Não informado';
    const [open, setOpen] = useState(false);
    return (
        <div className="card">
            <div className="cr stack">
                <div className="cr-main">
                    <b className="cr-name">E-mail</b>
                    <span className="cr-sub">E-mail da compra</span>
                </div>
                <div className="cr-side">
                    <span className="cr-value" title={email}>
                        {email}
                    </span>
                </div>
            </div>
            <div className="cr">
                <div className="cr-main">
                    <b className="cr-name">Senha</b>
                </div>
                <div className="cr-side">
                    <button type="button" className="btn line sm" onClick={() => setOpen(true)}>
                        Alterar senha
                    </button>
                </div>
            </div>
            <Modal title="Alterar senha" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
                <PasswordForm />
            </Modal>
        </div>
    );
};

/** Configurações novas em uma página; a versão clássica continua em app/settings/page.tsx. */
export const NewSettings: React.FC = () => {
    const { user } = useAppContext();
    const imerso = useProductAccess().access(IMERSO_PRODUCT);
    // Preserva a elegibilidade atual, inclusive contas sem a claim roles (PR #181); o modelo novo (claims) manda.
    const isUserImerso = imerso.final ? imerso.state !== 'none' : !!user?.roles?.includes('METTLE_STUDENT');

    return (
        <NewPage className="narrow settings">
            <Global styles={styles} />
            <h1 className="sr">Configurações</h1>
            <ProfileIdentity />
            <section aria-labelledby="settings-products">
                <h2 className="st" id="settings-products">
                    Meus produtos
                </h2>
                <ProductsCard />
            </section>
            {isUserImerso && (
                <section aria-labelledby="settings-imerso">
                    <h2 className="st" id="settings-imerso">
                        Programa Imerso
                    </h2>
                    <ProgramCard />
                </section>
            )}
            <section aria-labelledby="settings-profile">
                <h2 className="st" id="settings-profile">
                    Dados pessoais
                </h2>
                <ProfileDataCard />
            </section>
            <section aria-labelledby="settings-security">
                <h2 className="st" id="settings-security">
                    Acesso e segurança
                </h2>
                <SecurityCard />
            </section>
            <section aria-labelledby="settings-appearance">
                <h2 className="st" id="settings-appearance">
                    Aparência
                </h2>
                <div className="card">
                    {/* no celular o seletor (três opções com nome) desce para baixo de "Tema" */}
                    <div className="cr stack">
                        <div className="cr-main">
                            <b className="cr-name" id="s-theme">
                                Tema
                            </b>
                        </div>
                        <div className="cr-side" aria-labelledby="s-theme">
                            <ThemeSwitch labels />
                        </div>
                    </div>
                </div>
            </section>
        </NewPage>
    );
};

export default NewSettings;
