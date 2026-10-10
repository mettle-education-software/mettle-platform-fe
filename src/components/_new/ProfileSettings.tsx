import { css, Global } from '@emotion/react';
import { Button, Input, Modal } from 'antd';
import type { InputRef } from 'antd';
import { useProfile, useSaveProfile, useSaveProfilePhoto } from 'hooks/useProfile';
import {
    type CropArea,
    cropProfileImage,
    fieldChanged,
    fieldValue,
    PHONE_HINT,
    PHONE_PLACEHOLDER,
    Profile,
    PROFILE_FIELDS,
    ProfileField,
    profileError,
    ProfileValues,
    sameValue,
    serverCode,
    typePhone,
    USERNAME_ERRORS,
    validateProfileField,
    validateProfileImage,
} from 'libs/profile';
import { Camera, Minus, Plus } from 'lucide-react';
import { useAppContext } from 'providers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';

const ZOOM_ROW: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
const ZOOM_BUTTON: React.CSSProperties = {
    display: 'inline-grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    flex: 'none',
    padding: 0,
    border: 0,
    borderRadius: '50%',
    background: 'none',
    color: 'var(--r-muted)',
    cursor: 'pointer',
};

/** Caixa do recorte: altura fixa (sem pulo a 360 px), cantos como os cards. */
const CROP_BOX: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 'min(72vw, 320px)',
    margin: '16px 0',
    overflow: 'hidden',
    borderRadius: 12,
    background: '#111',
};

/** O formulário leva o próprio estilo (Configurações e a conta no Admin): rótulos acima, duas colunas no computador. */
const formStyles = css`
    .pf-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px 18px;
    }
    .pf-field {
        min-width: 0;
    }
    .pf-field label {
        display: block;
        margin: 0 0 6px 2px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .pf-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px 16px;
        margin-top: 20px;
    }
    .pf-actions .profile-error {
        margin: 0;
    }
    @media (max-width: 860px) {
        .pf-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

/** Quem grava: o próprio aluno (useSaveProfile) ou o administrador (useSaveStudentProfile); devolvem o que ficou salvo. */
export type SaveProfile = {
    mutateAsync: (changes: Partial<ProfileValues>) => Promise<{ saved: Partial<Profile> }>;
    isPending: boolean;
};

const savedValues = (data: Profile) =>
    Object.fromEntries(PROFILE_FIELDS.map(({ key }) => [key, fieldValue(key, data[key])])) as ProfileValues;

/**
 * Dados do perfil num formulário só: um Salvar (sempre à vista, apagado sem mudança; Enter grava), um PATCH com só o que
 * mudou, erros embaixo de cada campo e o primeiro inválido em foco. Valor novo vindo de fora (outra sessão,
 * administrador) entra só no campo que o aluno não está editando.
 */
export const ProfileForm: React.FC<{ data: Profile; save: SaveProfile }> = ({ data, save: mutation }) => {
    const saved = useMemo(() => savedValues(data), [data]);
    const [values, setValues] = useState<ProfileValues>(saved);
    const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
    const [formError, setFormError] = useState<string>();
    const [success, setSuccess] = useState(false);
    const inputs = useRef<Partial<Record<ProfileField, InputRef | null>>>({});
    const lastSaved = useRef(saved);
    useEffect(() => {
        const before = lastSaved.current;
        setValues((current) => {
            const next = { ...current };
            for (const { key } of PROFILE_FIELDS) if (sameValue(key, current[key], before[key])) next[key] = saved[key];
            return next;
        });
        lastSaved.current = saved;
    }, [saved]);
    const changed = PROFILE_FIELDS.map(({ key }) => key).filter((key) => fieldChanged(key, values[key], data[key]));
    const pending = mutation.isPending;

    const edit = (field: ProfileField, raw: string, atEnd: boolean) => {
        setValues((current) => ({
            ...current,
            // @username só em minúsculas; telefone no formato do país enquanto digita no fim
            [field]:
                field === 'username'
                    ? raw.toLowerCase()
                    : field === 'phone'
                      ? typePhone(raw, current.phone, atEnd)
                      : raw,
        }));
        setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
        setFormError(undefined);
        setSuccess(false);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!changed.length || pending) return;
        const invalid: Partial<Record<ProfileField, string>> = {};
        for (const key of changed) {
            const problem = validateProfileField(key, values[key]);
            if (problem) invalid[key] = problem;
        }
        setErrors(invalid);
        setFormError(undefined);
        setSuccess(false);
        const first = PROFILE_FIELDS.find(({ key }) => invalid[key]);
        if (first) {
            inputs.current[first.key]?.focus();
            return;
        }
        try {
            const { saved: back } = await mutation.mutateAsync(
                Object.fromEntries(changed.map((key) => [key, values[key]])) as Partial<ProfileValues>,
            );
            // o que o servidor devolveu (nomes com maiúsculas, telefone formatado) volta para os campos
            setValues((current) => {
                const next = { ...current };
                for (const key of changed) next[key] = fieldValue(key, back[key] ?? null);
                return next;
            });
            setSuccess(true);
        } catch (failure) {
            const code = serverCode(failure);
            if (code && USERNAME_ERRORS[code]) {
                const message = (failure as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
                setErrors({ username: typeof message === 'string' && message ? message : USERNAME_ERRORS[code] });
                inputs.current.username?.focus();
            } else setFormError(profileError(failure));
        }
    };

    return (
        <form className="card pf" noValidate onSubmit={submit}>
            <Global styles={formStyles} />
            <div className="pf-grid">
                {PROFILE_FIELDS.map(({ key, label, maxLength }) => {
                    const id = `profile-${key}`;
                    const error = errors[key];
                    const described = [key === 'phone' ? `${id}-hint` : '', error ? `${id}-error` : '']
                        .filter(Boolean)
                        .join(' ');
                    return (
                        <div className="pf-field" key={key}>
                            <label htmlFor={id}>{label}</label>
                            <Input
                                id={id}
                                ref={(input) => {
                                    inputs.current[key] = input;
                                }}
                                type={key === 'birth_date' ? 'date' : key === 'phone' ? 'tel' : 'text'}
                                inputMode={key === 'phone' ? 'tel' : undefined}
                                autoComplete={key === 'phone' ? 'tel' : undefined}
                                placeholder={key === 'phone' ? PHONE_PLACEHOLDER : undefined}
                                value={values[key]}
                                maxLength={maxLength}
                                readOnly={pending}
                                autoCapitalize={key === 'username' || key === 'instagram' ? 'none' : undefined}
                                spellCheck={key === 'username' || key === 'instagram' ? false : undefined}
                                aria-invalid={!!error}
                                aria-describedby={described || undefined}
                                onChange={(event) =>
                                    edit(
                                        key,
                                        event.target.value,
                                        (event.target.selectionStart ?? event.target.value.length) >=
                                            event.target.value.length,
                                    )
                                }
                            />
                            {key === 'phone' && (
                                <p className="profile-hint" id={`${id}-hint`}>
                                    {PHONE_HINT}
                                </p>
                            )}
                            {error && (
                                <p className="profile-error" id={`${id}-error`} role="alert">
                                    {error}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="pf-actions profile-actions">
                {success && (
                    <span role="status" className="profile-saved">
                        Salvo
                    </span>
                )}
                {formError && (
                    <span role="alert" className="profile-error">
                        {formError}
                    </span>
                )}
                <button type="submit" className="btn gold" disabled={!changed.length || pending}>
                    {pending ? 'Salvando…' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

/** Recorte como no iPhone: arrastar para posicionar, pinça ou roda (e a barra) para o zoom, círculo como o avatar. */
const PhotoPicker: React.FC<{ photo?: string | null; name?: string }> = ({ photo, name }) => {
    const [file, setFile] = useState<File>();
    const [source, setSource] = useState<string>();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [area, setArea] = useState<CropArea | null>(null);
    const [error, setError] = useState<string>();
    const [busy, setBusy] = useState(false);
    // o recorte mede a caixa ao carregar: só depois de o modal terminar de abrir (a animação encolhe a caixa)
    const [shown, setShown] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const mutation = useSaveProfilePhoto();
    useEffect(() => {
        if (!file) {
            setSource(undefined);
            return;
        }
        const url = URL.createObjectURL(file);
        setSource(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    const close = () => {
        if (!busy) {
            setFile(undefined);
            setError(undefined);
        }
    };
    const save = async () => {
        if (!source || !area || busy) return;
        setBusy(true);
        setError(undefined);
        try {
            const cropped = await cropProfileImage(source, area);
            const invalid = validateProfileImage(cropped);
            if (invalid) {
                setError(invalid);
                return;
            }
            await mutation.mutateAsync(cropped);
            setFile(undefined);
        } catch (failure) {
            setError(profileError(failure));
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            {/* a foto inteira é o botão (como no iPhone); o selo da câmera diz que dá para trocar */}
            <button type="button" className="idh-av" aria-label="Trocar foto" onClick={() => input.current?.click()}>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL da foto do Firebase */}
                {photo ? <img src={photo} alt="" /> : <span aria-hidden>{name?.[0] || '?'}</span>}
                <span className="idh-cam" aria-hidden>
                    <Camera size={15} strokeWidth={1.8} />
                </span>
            </button>
            <input
                ref={input}
                type="file"
                accept="image/*"
                hidden
                aria-label="Escolher foto"
                onChange={(event) => {
                    const selected = event.target.files?.[0];
                    event.target.value = '';
                    if (!selected) return;
                    // qualquer tamanho ou formato que o navegador abra: o recorte reduz para 1024 px em JPEG
                    setError(undefined);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setArea(null);
                    setFile(selected);
                }}
            />
            {error && !file && (
                <p className="profile-error idh-error" role="alert">
                    {error}
                </p>
            )}
            <Modal
                title="Recortar foto"
                open={!!file}
                onCancel={close}
                onOk={save}
                okText="Usar foto"
                cancelText="Cancelar"
                confirmLoading={busy}
                okButtonProps={{ disabled: !area || busy }}
                cancelButtonProps={{ disabled: busy }}
                closable={!busy}
                maskClosable={!busy}
                afterOpenChange={setShown}
            >
                {/* altura fixa: nada pula quando a foto carrega; o recorte não deixa a página rolar ao arrastar */}
                <div className="profile-crop" style={CROP_BOX}>
                    {source && shown && (
                        <Cropper
                            image={source}
                            crop={crop}
                            zoom={zoom}
                            minZoom={1}
                            maxZoom={3}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            keyboardStep={8}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, pixels) => setArea(pixels)}
                            mediaProps={{
                                alt: 'Prévia do recorte',
                                onError: () => {
                                    setArea(null);
                                    setError('Não foi possível abrir esta foto.');
                                },
                            }}
                            cropperProps={{
                                role: 'group',
                                'aria-label': 'Recorte: arraste para posicionar; setas ajustam',
                            }}
                        />
                    )}
                </div>
                {/* zoom como no iOS: menos e mais nas pontas (também ajustam), a barra na cor da marca */}
                <div style={ZOOM_ROW}>
                    <button
                        type="button"
                        aria-label="Diminuir zoom"
                        disabled={busy || zoom <= 1}
                        onClick={() => setZoom((current) => Math.max(1, +(current - 0.2).toFixed(2)))}
                        style={ZOOM_BUTTON}
                    >
                        <Minus size={16} strokeWidth={1.8} aria-hidden />
                    </button>
                    <input
                        id="profile-photo-zoom"
                        type="range"
                        aria-label="Zoom"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        disabled={busy}
                        onChange={(event) => setZoom(Number(event.target.value))}
                        style={{ flex: 1, minWidth: 0, accentColor: 'var(--r-gold)' }}
                    />
                    <button
                        type="button"
                        aria-label="Aumentar zoom"
                        disabled={busy || zoom >= 3}
                        onClick={() => setZoom((current) => Math.min(3, +(current + 0.2).toFixed(2)))}
                        style={ZOOM_BUTTON}
                    >
                        <Plus size={16} strokeWidth={1.8} aria-hidden />
                    </button>
                </div>
                {error && <p role="alert">{error}</p>}
            </Modal>
        </>
    );
};

/** Cabeçalho da conta: a foto grande (toque para trocar), o nome e "@username · e-mail". */
export const ProfileIdentity: React.FC = () => {
    const { user } = useAppContext();
    const data = useProfile().data;
    const name = [data?.first_name, data?.last_name].filter(Boolean).join(' ') || user?.name || '';
    const sub = [data?.username ? `@${data.username}` : '', data?.email || user?.email || '']
        .filter(Boolean)
        .join(' · ');
    return (
        <header className="idh">
            <PhotoPicker photo={data?.photoURL ?? user?.profileImageSrc} name={data?.first_name ?? user?.name} />
            <div className="idh-text">
                <p className="idh-name">{name}</p>
                {sub && <p className="idh-sub">{sub}</p>}
            </div>
        </header>
    );
};

/** "Dados pessoais": o formulário do perfil (ou o carregando / a falha com nova tentativa). */
export const ProfileDataCard: React.FC = () => {
    const { user } = useAppContext();
    const profile = useProfile();
    const save = useSaveProfile();
    if (!profile.data)
        return (
            <p className="hint" role="status">
                {profile.isError ? (
                    <>
                        Não foi possível carregar o perfil.{' '}
                        <Button onClick={() => profile.refetch()}>Tentar novamente</Button>
                    </>
                ) : (
                    'Carregando…'
                )}
            </p>
        );
    return <ProfileForm key={user?.uid} data={profile.data} save={save} />;
};

/** Cabeçalho e dados (usado nos testes do perfil). */
export const ProfileSettings: React.FC = () => (
    <>
        <ProfileIdentity />
        <ProfileDataCard />
    </>
);
