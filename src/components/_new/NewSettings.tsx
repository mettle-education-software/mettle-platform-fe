'use client';

import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { usePauseDeda, useResetMelp, useUpdatePassword } from 'hooks';
import { passwordRules } from 'libs';
import { settingsTabFromQuery } from 'libs/newDesign';
import { ExternalLink, Info, Mail } from 'lucide-react';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';
import { ProgramHistory } from './ProgramHistory';
import { ThemeSwitch } from './ThemeSwitch';

/* ---------- abas: mesmos campos, regras, textos e chamadas de app/settings/page.tsx ---------- */

const PersonalInformation: React.FC = () => {
    const { user } = useAppContext();
    return (
        <div className="panel" role="tabpanel">
            <h2>Informações pessoais</h2>
            <p className="hint">Atualize suas informações aqui</p>
            <div className="rows">
                <div className="row">
                    <label htmlFor="s-name">Nome completo</label>
                    <div className="field">
                        <Tooltip
                            placement="topLeft"
                            title="Para alterar o nome completo, por favor entre em contato com o suporte"
                        >
                            <Input id="s-name" placeholder={user?.name} disabled />
                        </Tooltip>
                    </div>
                </div>
                <div className="row">
                    <label htmlFor="s-email">E-mail</label>
                    <div className="field">
                        <Tooltip
                            placement="topLeft"
                            title="Para alterar o email, por favor entre em contato com o suporte"
                        >
                            <Input id="s-email" type="email" placeholder={user?.email} disabled />
                        </Tooltip>
                    </div>
                </div>
                <div className="row">
                    <span className="lab" id="s-theme">
                        Tema
                    </span>
                    <div className="field" aria-labelledby="s-theme">
                        <ThemeSwitch labels />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SecuritySettings: React.FC = () => {
    const [form] = Form.useForm();
    const newPassword = Form.useWatch('newPassword', form);
    useEffect(() => {
        if (!newPassword) form.resetFields(['newPasswordRepeat']);
    }, [newPassword, form]);

    const updatePassword = useUpdatePassword();

    return (
        <div className="panel" role="tabpanel">
            <h2>Segurança</h2>
            <p className="hint">Atualize suas informações de segurança</p>
            <Form
                form={form}
                colon={false}
                onFinish={({ newPasswordRepeat }: { newPasswordRepeat: string }) =>
                    updatePassword.mutate(newPasswordRepeat)
                }
            >
                <div className="rows">
                    <div className="row">
                        <label htmlFor="s-pass">Alterar a senha</label>
                        <div className="field">
                            <Form.Item name="newPassword" rules={passwordRules}>
                                <Input.Password id="s-pass" placeholder="Nova senha" />
                            </Form.Item>
                        </div>
                    </div>
                    <div className="row">
                        <label htmlFor="s-pass2">Insira a nova senha novamente</label>
                        <div className="field">
                            <Form.Item
                                name="newPasswordRepeat"
                                rules={[
                                    { required: true, message: 'Por favor insira uma nova senha' },
                                    { min: 8, message: 'A senha deve ter pelo menos 8 caracteres' },
                                    {
                                        validator: async (_, value) => {
                                            if (value !== newPassword) {
                                                return Promise.reject(new Error('As senhas não coincidem'));
                                            }
                                            const validationRegex = new RegExp(
                                                /^(?!.*\s)(?=.*[a-zA-Z])(?=.*\d)(?=.*\W).{8,}$/,
                                                'g',
                                            );
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
                                <Input.Password
                                    id="s-pass2"
                                    disabled={!newPassword}
                                    placeholder="Insira a senha novamente"
                                />
                            </Form.Item>
                        </div>
                    </div>
                </div>
                <div className="actions">
                    <Button loading={updatePassword.isPending} htmlType="submit" type="primary">
                        Salvar
                    </Button>
                </div>
            </Form>
        </div>
    );
};

const ImersoSettings: React.FC = () => {
    const programReset = useResetMelp();
    const pauseDeda = usePauseDeda();
    const { melpSummary } = useMelpContext();
    const [modal, modalHolder] = Modal.useModal();

    // aba aberta direto (?tab=imerso-settings) antes de o resumo chegar: só o título, sem quebrar a página
    if (!melpSummary)
        return (
            <div className="panel" role="tabpanel">
                <h2>Programa IMERSO</h2>
                <p className="hint">Configurações do programa IMERSO</p>
            </div>
        );

    return (
        <div className="panel" role="tabpanel">
            {modalHolder}
            <h2>Programa IMERSO</h2>
            <p className="hint">Configurações do programa IMERSO</p>
            <div className="rows">
                <div className="row">
                    <div className="lab">
                        <b>
                            Reiniciar o programa
                            <Tooltip title="Você pode reinicar a sua conta e recomeçar o programa IMERSO do início. Seu progresso até agora será inteiramente removido.">
                                <Info {...ICON} size={16} aria-label="Sobre reiniciar" />
                            </Tooltip>
                        </b>
                        <span>
                            Você tem <strong>{melpSummary.remaining_resets}</strong> chances de reiniciar o programa
                        </span>
                    </div>
                    <div className="field">
                        <Button
                            loading={programReset.isPending}
                            onClick={() =>
                                modal.confirm({
                                    title: 'Atenção!',
                                    content:
                                        'Tem certeza que deseja reiniciar? Você perderá todo o seu progresso atual e essa ação não poderá ser revertida.',
                                    onOk: () => programReset.mutate(),
                                })
                            }
                        >
                            Reiniciar
                        </Button>
                    </div>
                </div>
                {melpSummary.melp_status === 'DEDA_STARTED' && (
                    <div className="row">
                        <div className="lab">
                            <b>
                                Pausar DEDA
                                <Tooltip title="Você pode pausar o DEDA 3 vezes. Ao pausar, seu progresso não será contabilizado até que você ative novamente.">
                                    <Info {...ICON} size={16} aria-label="Sobre pausar" />
                                </Tooltip>
                            </b>
                            <span>
                                Você tem <strong>{melpSummary.remaining_pauses}</strong> chances de pausar o programa
                            </span>
                        </div>
                        <div className="field">
                            <Button
                                loading={pauseDeda.isPending}
                                onClick={() =>
                                    modal.confirm({
                                        title: 'Atenção!',
                                        content:
                                            'Tem certeza que deseja pausar? Você não poderá despausar até a próxima semana o progresso desta semana será perdido.',
                                        onOk: () => pauseDeda.mutate(),
                                    })
                                }
                            >
                                Pausar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <ProgramHistory events={melpSummary.program_events} remainingResets={melpSummary.remaining_resets} />
        </div>
    );
};

const Help: React.FC = () => (
    <div className="panel" role="tabpanel">
        <h2>Ajuda</h2>
        <p className="hint">Precisa de ajuda? Entre em contato</p>
        <div className="links">
            <a href="mailto:hello@mettle.com.br">
                <Mail {...ICON} size={18} aria-hidden /> hello@mettle.com.br
            </a>
            <a href="https://mettle.com.br/politica-de-privacidade/" target="_blank" rel="noopener noreferrer">
                <ExternalLink {...ICON} size={18} aria-hidden /> Política de privacidade
            </a>
            <a href="https://mettle.com.br/termos-de-uso/" target="_blank" rel="noopener noreferrer">
                <ExternalLink {...ICON} size={18} aria-hidden /> Termos de uso
            </a>
        </div>
    </div>
);

/**
 * Configurações (/settings) na plataforma nova: as mesmas quatro abas (IMERSO só para alunos), formulários limpos.
 * `?tab=help` abre direto em Ajuda (destino do item "Suporte" quando o chat não está disponível).
 */
export const NewSettings: React.FC = () => {
    const { user } = useAppContext();
    const isUserImerso = !!user && user.roles.includes('METTLE_STUDENT');
    const tabs = [
        { key: 'personal-information', label: 'Dados pessoais', panel: <PersonalInformation /> },
        { key: 'security-settings', label: 'Segurança', panel: <SecuritySettings /> },
        ...(isUserImerso ? [{ key: 'imerso-settings', label: 'IMERSO', panel: <ImersoSettings /> }] : []),
        { key: 'help', label: 'Ajuda', panel: <Help /> },
    ];
    // carregado só no navegador (next/dynamic sem SSR): a query vem direto do endereço
    const [tab, setTab] = useState(() =>
        settingsTabFromQuery(
            typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('tab'),
            tabs.map((t) => t.key),
        ),
    );
    const current = tabs.find((t) => t.key === tab) ?? tabs[0];

    return (
        <NewPage className="narrow">
            <PageHead
                title="Configurações"
                tabs={
                    <div className="seg" role="tablist" aria-label="Configurações">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={t.key === current.key}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                }
            />
            {current.panel}
        </NewPage>
    );
};

export default NewSettings;
