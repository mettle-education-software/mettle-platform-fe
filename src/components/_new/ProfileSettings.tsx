import { Button, Input, Modal } from 'antd';
import type { InputRef } from 'antd';
import { useProfile, useSaveProfile, useSaveProfilePhoto } from 'hooks/useProfile';
import {
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
    USERNAME_CODES,
    validateProfileField,
    validateProfileImage,
} from 'libs/profile';
import { useAppContext } from 'providers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeSwitch } from './ThemeSwitch';

const savedValues = (data: Profile) =>
    Object.fromEntries(PROFILE_FIELDS.map(({ key }) => [key, fieldValue(key, data[key])])) as ProfileValues;

/**
 * Dados do perfil num formulário só: um Salvar (sempre à vista, apagado sem mudança; Enter grava), um PATCH com só o que
 * mudou, erros embaixo de cada campo e o primeiro inválido em foco. Valor novo vindo de fora (outra sessão,
 * administrador) entra só no campo que o aluno não está editando.
 */
const ProfileForm: React.FC<{ data: Profile }> = ({ data }) => {
    const mutation = useSaveProfile();
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

    const edit = (field: ProfileField, raw: string) => {
        setValues((current) => ({
            ...current,
            // @username só em minúsculas; telefone no formato do país enquanto digita
            [field]: field === 'username' ? raw.toLowerCase() : field === 'phone' ? typePhone(raw, current.phone) : raw,
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
            if (USERNAME_CODES.includes(serverCode(failure) ?? '')) {
                setErrors({ username: profileError(failure) });
                inputs.current.username?.focus();
            } else setFormError(profileError(failure));
        }
    };

    return (
        <form className="rows profile-form" noValidate onSubmit={submit}>
            {PROFILE_FIELDS.map(({ key, label, maxLength }) => {
                const id = `profile-${key}`;
                const error = errors[key];
                const described = [key === 'phone' ? `${id}-hint` : '', error ? `${id}-error` : '']
                    .filter(Boolean)
                    .join(' ');
                return (
                    <div className="row" key={key}>
                        <label htmlFor={id}>{label}</label>
                        <div className="field">
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
                                onChange={(event) => edit(key, event.target.value)}
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
                    </div>
                );
            })}
            <div className="row profile-actions">
                <span className="lab" aria-hidden />
                <div className="field">
                    <button type="submit" className="btn gold" disabled={!changed.length || pending}>
                        {pending ? 'Salvando…' : 'Salvar'}
                    </button>
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
                </div>
            </div>
        </form>
    );
};

const ProfilePhoto: React.FC<{ photo?: string | null; name?: string }> = ({ photo, name }) => {
    const [file, setFile] = useState<File>();
    const [source, setSource] = useState<string>();
    const [zoom, setZoom] = useState(1);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string>();
    const [busy, setBusy] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const image = useRef<HTMLImageElement>(null);
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
        if (!image.current || !loaded || busy) return;
        setBusy(true);
        setError(undefined);
        try {
            const cropped = await cropProfileImage(image.current, zoom);
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
        <div className="row">
            <span className="lab">Foto</span>
            <div className="field">
                <div className="profile-photo">
                    <span className="profile-avatar" aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL da foto do Firebase */}
                        {photo ? <img src={photo} alt="" /> : name?.[0] || '?'}
                    </span>
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
                            setZoom(1);
                            setLoaded(false);
                            setFile(selected);
                        }}
                    />
                    <Button onClick={() => input.current?.click()}>Trocar foto</Button>
                </div>
                {error && !file && (
                    <p className="profile-error" role="alert">
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
                    okButtonProps={{ disabled: !loaded || busy }}
                    cancelButtonProps={{ disabled: busy }}
                    closable={!busy}
                    maskClosable={!busy}
                >
                    <div
                        style={{
                            width: 256,
                            maxWidth: '100%',
                            aspectRatio: '1',
                            overflow: 'hidden',
                            margin: '16px auto',
                        }}
                    >
                        {source && (
                            // eslint-disable-next-line @next/next/no-img-element -- prévia local, removida ao fechar
                            <img
                                ref={image}
                                src={source}
                                alt="Prévia do recorte quadrado"
                                onLoad={() => setLoaded(true)}
                                onError={() => {
                                    setLoaded(false);
                                    setError('Não foi possível abrir esta foto.');
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: `scale(${zoom})`,
                                }}
                            />
                        )}
                    </div>
                    <label htmlFor="profile-photo-zoom">Zoom</label>
                    <input
                        id="profile-photo-zoom"
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        disabled={busy}
                        onChange={(event) => setZoom(Number(event.target.value))}
                        style={{ width: '100%' }}
                    />
                    {error && <p role="alert">{error}</p>}
                </Modal>
            </div>
        </div>
    );
};

export const ProfileSettings: React.FC = () => {
    const { user } = useAppContext();
    const profile = useProfile();
    const data = profile.data;
    return (
        <div className="panel">
            {!data ? (
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
            ) : (
                <>
                    <ProfilePhoto photo={data.photoURL ?? user?.profileImageSrc} name={data.first_name ?? user?.name} />
                    <ProfileForm key={user?.uid} data={data} />
                </>
            )}
            <dl className="rows settings-data">
                <div className="row">
                    <dt className="lab">E-mail</dt>
                    <dd className="field">{data?.email || user?.email || 'Não informado'}</dd>
                </div>
            </dl>
            <div className="row">
                <span className="lab" id="s-theme">
                    Tema
                </span>
                <div className="field" aria-labelledby="s-theme">
                    <ThemeSwitch labels />
                </div>
            </div>
        </div>
    );
};
