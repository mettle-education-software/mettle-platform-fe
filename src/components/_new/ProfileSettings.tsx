import { Button, Input, Modal } from 'antd';
import { useProfile, useSaveProfile, useSaveProfilePhoto } from 'hooks/useProfile';
import {
    cropProfileImage,
    PROFILE_FIELDS,
    ProfileField,
    profileError,
    validateProfileField,
    validateProfileImage,
} from 'libs/profile';
import { useAppContext } from 'providers';
import React, { useEffect, useRef, useState } from 'react';
import { ThemeSwitch } from './ThemeSwitch';

const ProfileInput: React.FC<{ field: ProfileField; label: string; maxLength: number; saved: string }> = ({
    field,
    label,
    maxLength,
    saved,
}) => {
    const [value, setValue] = useState(saved);
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState(false);
    const mutation = useSaveProfile();
    const id = `profile-${field}`;
    const dirty = value.trim() !== saved;
    useEffect(() => {
        setValue(saved);
    }, [saved]);
    return (
        <form
            className="row"
            onSubmit={async (event) => {
                event.preventDefault();
                const invalid = validateProfileField(field, value);
                setError(invalid);
                setSuccess(false);
                if (invalid || mutation.isPending) return;
                try {
                    const { profile } = await mutation.mutateAsync({ field, value });
                    setValue(profile[field] ?? '');
                    setSuccess(true);
                } catch (failure) {
                    setError(profileError(failure));
                }
            }}
        >
            <label htmlFor={id}>{label}</label>
            <div className="field">
                <div className="profile-edit">
                    <Input
                        id={id}
                        type={field === 'birth_date' ? 'date' : 'text'}
                        value={value}
                        maxLength={maxLength}
                        disabled={mutation.isPending}
                        autoCapitalize={field === 'username' || field === 'instagram' ? 'none' : undefined}
                        spellCheck={field === 'username' || field === 'instagram' ? false : undefined}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={(event) => {
                            // username só em minúsculas: o aluno digita como quiser
                            setValue(field === 'username' ? event.target.value.toLowerCase() : event.target.value);
                            setError(undefined);
                            setSuccess(false);
                        }}
                    />
                    {/* "Salvar" só no campo alterado; o espaço fica reservado (o campo não muda de largura) */}
                    <Button
                        htmlType="submit"
                        loading={mutation.isPending}
                        disabled={!dirty || mutation.isPending}
                        aria-label={`Salvar ${label}`}
                        style={dirty || mutation.isPending ? undefined : { visibility: 'hidden' }}
                    >
                        Salvar
                    </Button>
                </div>
                {error && (
                    <p className="profile-error" id={`${id}-error`} role="alert">
                        {error}
                    </p>
                )}
                {success && (
                    <span role="status" className="profile-saved">
                        Salvo
                    </span>
                )}
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
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        aria-label="Escolher foto"
                        onChange={(event) => {
                            const selected = event.target.files?.[0];
                            event.target.value = '';
                            if (!selected) return;
                            const invalid = validateProfileImage(selected);
                            setError(invalid);
                            if (invalid) return;
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
                    okText="Salvar foto"
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
                    <div className="rows">
                        {PROFILE_FIELDS.map(({ key, ...props }) => (
                            <ProfileInput key={`${user?.uid}:${key}`} field={key} saved={data[key] ?? ''} {...props} />
                        ))}
                    </div>
                </>
            )}
            <dl className="rows settings-data">
                <div className="row">
                    <dt className="lab">E-mail</dt>
                    <dd className="field">{data?.email || user?.email || 'Não informado'}</dd>
                </div>
                <div className="row">
                    <dt className="lab">Telefone</dt>
                    <dd className="field">{data?.phone || 'Não informado'}</dd>
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
