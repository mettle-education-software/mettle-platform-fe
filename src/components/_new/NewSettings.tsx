'use client';

import { useIsMutating } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { useMelpSummary, usePauseDeda, useResetMelp, useUpdatePassword } from 'hooks';
import { useCachedCourses } from 'hooks/queries/useCourses';
import { passwordRules } from 'libs';
import { EBOOK_PRODUCT } from 'libs/ebook';
import { MASTERCLASS_COURSE } from 'libs/masterclass';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { Info } from 'lucide-react';
import { useAppContext, useProductAccess } from 'providers';
import React, { useEffect } from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';
import { ProfileSettings } from './ProfileSettings';
import { ProgramHistory } from './ProgramHistory';

const AccountSettings: React.FC = () => {
    const { access, accessLoading } = useProductAccess();
    // Só observa o catálogo que a home já carregou: abrir Configurações não inicia outra chamada.
    const { data } = useCachedCourses();
    const masterclass = data?.courseCollection?.items?.find((course) => course.courseSlug === MASTERCLASS_COURSE);
    const products = [
        { id: IMERSO_PRODUCT, name: 'Imerso' },
        ...(masterclass ? [{ id: masterclass.coursePurchaseId, name: 'Masterclass' }] : []),
        { id: EBOOK_PRODUCT, name: 'E-book' },
    ]
        .map((product) => ({ ...product, state: access(product.id).state }))
        .filter((product) => product.state !== 'none');
    const labels = { active: 'Ativo', grace: 'Em carência', expired: 'Leitura', none: '' };

    return (
        <div className="panel" aria-busy={accessLoading}>
            {accessLoading ? (
                <p className="hint" role="status">
                    Carregando…
                </p>
            ) : products.length ? (
                <dl className="rows settings-data">
                    {products.map((product) => (
                        <div className="row" key={product.id}>
                            <dt className="lab">{product.name}</dt>
                            <dd className="field">{labels[product.state]}</dd>
                        </div>
                    ))}
                </dl>
            ) : (
                <p className="hint">Nenhum produto disponível.</p>
            )}
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
        <div className="panel">
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
                    {/* "Salvar" é um só na página (o do perfil) */}
                    <Button loading={updatePassword.isPending} htmlType="submit" type="primary">
                        Trocar senha
                    </Button>
                </div>
            </Form>
        </div>
    );
};

const ImersoSettings: React.FC = () => {
    const programReset = useResetMelp();
    const pauseDeda = usePauseDeda();
    const { user } = useAppContext();
    // leitura: sem reiniciar nem pausar (gravam); o histórico fica
    const readOnly = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
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

    // sem resumo: carregando (nada ainda); conta sem programa ou sem acesso (404/403, consulta desligada): uma linha;
    // outra falha (rede, 500) ou consulta parada sem conexão: mensagem com nova tentativa. Nunca quebra a página.
    if (!melpSummary)
        return (
            <div className="panel">
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

    // uma ação por vez (reiniciar e pausar se excluem enquanto uma está em curso) e nunca sobre um resumo velho: se a
    // atualização depois de uma ação falhou, as ações esperam uma nova tentativa
    const stale = summary.isError;
    const busy = mutating || programReset.isPending || pauseDeda.isPending || stale;

    return (
        <div className="panel">
            {modalHolder}
            {stale && <p className="hint">Não foi possível atualizar o programa IMERSO. {retry}</p>}
            {!readOnly && (
                <div className="rows">
                    <div className="row">
                        <div className="lab">
                            <b>
                                Reiniciar a LAMP
                                <Tooltip title="Zera a sua LAMP. Os seus DEDAs e o HPEC continuam como estão.">
                                    <Info {...ICON} size={16} aria-label="Sobre reiniciar a LAMP" />
                                </Tooltip>
                            </b>
                            <span>
                                Reinícios restantes: <strong>{melpSummary.remaining_resets}</strong>
                            </span>
                        </div>
                        <div className="field">
                            <Button
                                loading={programReset.isPending}
                                disabled={busy}
                                onClick={() =>
                                    modal.confirm({
                                        title: 'Reiniciar a LAMP?',
                                        content: (
                                            <>
                                                <p>
                                                    A sua LAMP é zerada e volta a contar na próxima segunda-feira (no
                                                    mesmo dia, se hoje for segunda).
                                                </p>
                                                <p>
                                                    Os seus DEDAs e o HPEC não mudam: você continua exatamente de onde
                                                    está.
                                                </p>
                                                <p>
                                                    Se você estiver em pausa, a pausa termina junto, sem gastar outra
                                                    pausa.
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
                    {melpSummary.melp_status === 'DEDA_STARTED' && (
                        <div className="row">
                            <div className="lab">
                                <b>
                                    Pausar a LAMP
                                    <Tooltip title="Para a contagem da LAMP enquanto você estiver fora. Os DEDAs e o HPEC continuam sendo liberados.">
                                        <Info {...ICON} size={16} aria-label="Sobre pausar a LAMP" />
                                    </Tooltip>
                                </b>
                                <span>
                                    Pausas restantes: <strong>{melpSummary.remaining_pauses}</strong>
                                </span>
                            </div>
                            <div className="field">
                                <Button
                                    loading={pauseDeda.isPending}
                                    disabled={busy}
                                    onClick={() =>
                                        modal.confirm({
                                            title: 'Pausar a LAMP?',
                                            content: (
                                                <>
                                                    <p>
                                                        A LAMP para de contar a partir de agora. A semana em andamento é
                                                        zerada: a LAMP fica parada no fim da semana passada.
                                                    </p>
                                                    <p>Os DEDAs e o HPEC continuam sendo liberados toda semana.</p>
                                                    <p>
                                                        Para voltar, toque em “Resume LAMP” na página do Imerso. A LAMP
                                                        volta a contar na segunda-feira seguinte (no mesmo dia, se for
                                                        segunda), de onde parou e com as mesmas metas.
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
                </div>
            )}
            <ProgramHistory events={melpSummary.program_events} remainingResets={melpSummary.remaining_resets} />
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
            <PageHead title="Configurações" />
            <section aria-labelledby="settings-profile">
                <div className="sh">
                    <h2 id="settings-profile">Perfil</h2>
                </div>
                <ProfileSettings />
            </section>
            <section aria-labelledby="settings-account">
                <div className="sh">
                    <h2 id="settings-account">Conta</h2>
                </div>
                <AccountSettings />
            </section>
            <section aria-labelledby="settings-password">
                <div className="sh">
                    <h2 id="settings-password">Senha</h2>
                </div>
                <SecuritySettings />
            </section>
            {isUserImerso && (
                <section aria-labelledby="settings-imerso">
                    <div className="sh">
                        <h2 id="settings-imerso">IMERSO</h2>
                    </div>
                    <ImersoSettings />
                </section>
            )}
        </NewPage>
    );
};

export default NewSettings;
