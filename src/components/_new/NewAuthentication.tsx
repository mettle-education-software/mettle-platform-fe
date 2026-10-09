'use client';

import styled from '@emotion/styled';
import { Form } from 'antd';
import { Logo } from 'components/atoms/Logo/Logo';
import { LOGIN_IMAGES } from 'libs/newDesign';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { DARK, ICON, LIGHT, tokenText, UI_FONT_CLASS, UI_FONT_VAR } from 'themes/newDesign';
import { Page } from './ui';

// Tokens locais: o login segue o sistema, sem alterar a preferência da casca nem o CSS clássico.
const Screen = styled(Page)`
    ${tokenText(LIGHT)}
    --r-ui-size: 14.5px;
    --r-label-size: 11px;
    --r-label-track: 0.14em;
    --r-ease: 180ms ease;
    color-scheme: light;
    width: 100%;
    max-width: none;
    min-height: 100vh;
    min-height: 100svh;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    align-content: start;
    background: var(--r-bg);
    animation: none;

    &,
    * {
        box-sizing: border-box;
    }

    .auth-visual {
        --auth-shade-rgb: ${DARK['--r-bg-rgb']};
        position: relative;
        isolation: isolate;
        width: 100%;
        min-width: 0;
        height: 38vh;
        height: 38svh;
        overflow: hidden;
        background: rgb(var(--auth-shade-rgb));
    }
    .auth-image {
        object-fit: cover;
        opacity: 0;
        transition: opacity 1200ms ease-in-out;
    }
    .auth-image[data-active='true'] {
        opacity: 1;
    }
    .auth-visual::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(var(--auth-shade-rgb), 0.6), transparent 65%);
    }
    .auth-brand {
        position: absolute;
        z-index: 2;
        top: 28px;
        left: 24px;
        width: 144px;
        max-width: calc(100% - 48px);
    }
    .auth-brand svg {
        display: block;
    }
    .auth-form-panel {
        display: grid;
        place-items: center;
        width: 100%;
        min-width: 0;
        padding: 48px 24px;
    }
    .auth-content {
        width: 100%;
        max-width: 368px;
        min-width: 0;
    }
    h1 {
        font-size: clamp(28px, 3vw, 34px);
        font-weight: 300;
        letter-spacing: -0.035em;
        margin-bottom: 40px;
    }
    .ant-form {
        font: inherit;
        color: inherit;
    }
    .ant-form-item {
        margin-bottom: 24px;
    }
    .ant-form-item-label {
        padding-bottom: 10px;
    }
    .ant-form-item-label > label {
        font: inherit;
        font-size: 13px;
        color: var(--r-muted);
        height: auto;
    }
    .auth-input {
        display: block;
        width: 100%;
        min-width: 0;
        height: 52px;
        padding: 0 16px;
        border: 1px solid var(--r-line-strong);
        border-radius: 10px;
        background: transparent;
        color: var(--r-text);
        font: inherit;
        font-size: 16px;
        box-shadow: none;
    }
    .auth-input:hover {
        border-color: var(--r-muted);
    }
    .auth-input:focus-visible {
        border-color: var(--r-gold-hi);
    }
    .auth-input[aria-invalid='true'] {
        border-color: var(--r-error);
    }
    .auth-input:autofill {
        box-shadow: 0 0 0 1000px var(--r-bg) inset;
        -webkit-text-fill-color: var(--r-text);
    }
    .auth-password {
        position: relative;
    }
    .auth-password input {
        padding-right: 56px;
    }
    .auth-password .ib {
        position: absolute;
        right: 4px;
        top: 4px;
        color: var(--r-muted);
    }
    .ant-form-item-explain-error,
    .auth-error {
        color: var(--r-error);
        font-size: 13px;
        line-height: 1.6;
        overflow-wrap: anywhere;
    }
    .ant-form-item-explain {
        padding-top: 6px;
    }
    .auth-error {
        margin-top: 20px;
    }
    .auth-links {
        display: flex;
        justify-content: flex-end;
        margin: -12px 0 24px;
    }
    .lnk {
        padding-inline: 0;
        white-space: normal;
    }
    .auth-submit {
        width: 100%;
        min-height: 52px;
        justify-content: space-between;
        padding-inline: 22px;
    }
    .auth-back {
        margin-top: 20px;
        gap: 8px;
    }
    .auth-success {
        color: var(--r-gold-hi);
        margin-bottom: 24px;
    }
    .auth-status h1 {
        margin-bottom: 20px;
    }
    .auth-status p {
        line-height: 1.6;
    }

    @media (min-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        .auth-visual {
            position: sticky;
            top: 0;
            height: 100vh;
            height: 100svh;
        }
        .auth-brand {
            top: 48px;
            left: 48px;
            width: 176px;
        }
        .auth-form-panel {
            min-height: 100vh;
            min-height: 100svh;
            padding: 64px 48px;
        }
    }
    @media (prefers-color-scheme: dark) {
        ${tokenText(DARK)}
        color-scheme: dark;
    }
    @media (prefers-reduced-motion: reduce) {
        .auth-image[data-active] {
            transition: none;
            opacity: 0;
        }
        .auth-image:first-of-type {
            opacity: 1;
        }
    }
`;

function LoginVisual() {
    const [active, setActive] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(true);

    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncPreference = () => {
            setReducedMotion(preference.matches);
            setActive(0);
        };
        syncPreference();
        preference.addEventListener('change', syncPreference);
        return () => preference.removeEventListener('change', syncPreference);
    }, []);

    useEffect(() => {
        if (reducedMotion || LOGIN_IMAGES.length < 2) return;
        const timer = window.setInterval(() => setActive((index) => (index + 1) % LOGIN_IMAGES.length), 7000);
        return () => window.clearInterval(timer);
    }, [reducedMotion]);

    return (
        <div className="auth-visual">
            {(reducedMotion ? LOGIN_IMAGES.slice(0, 1) : LOGIN_IMAGES).map((src, index) => (
                <Image
                    key={src}
                    className="auth-image"
                    data-active={index === active}
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority={index === 0}
                    loading={index === 0 ? undefined : 'lazy'}
                />
            ))}
            <div className="auth-brand" role="img" aria-label="Mettle">
                <div aria-hidden="true">
                    <Logo theme="light" />
                </div>
            </div>
        </div>
    );
}

export default function NewAuthentication({ children }: { children: React.ReactNode }) {
    return (
        <Screen className={UI_FONT_CLASS} style={UI_FONT_VAR}>
            <LoginVisual />
            <div className="auth-form-panel">
                <section className="auth-content" aria-labelledby="auth-title">
                    {children}
                </section>
            </div>
        </Screen>
    );
}

const emailRules = [
    { required: true, message: 'Informe seu e-mail.' },
    { type: 'email' as const, message: 'Informe um e-mail válido.' },
];

function EmailField() {
    return (
        <Form.Item name="email" label="E-mail" validateDebounce={800} rules={emailRules}>
            <input className="auth-input" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} />
        </Form.Item>
    );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="auth-password">
            <input
                {...props}
                className="auth-input"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
            />
            <button
                className="ib"
                type="button"
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
            >
                {visible ? <EyeOff {...ICON} aria-hidden="true" /> : <Eye {...ICON} aria-hidden="true" />}
            </button>
        </div>
    );
}

type FormState = { loading: boolean; error: string | null };

export function NewLoginForm({
    loading,
    error,
    preview,
    onFinish,
}: FormState & {
    preview: boolean;
    onFinish: (values: { email: string; password: string }) => void;
}) {
    return (
        <>
            <h1 id="auth-title">Entrar</h1>
            <Form
                name="new-login"
                initialValues={{ email: '', password: '' }}
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                noValidate
                aria-busy={loading}
            >
                <EmailField />
                <Form.Item name="password" label="Senha" rules={[{ required: true, message: 'Informe sua senha.' }]}>
                    <PasswordInput />
                </Form.Item>
                <div className="auth-links">
                    <Link className="lnk" href={preview ? '/senha-esquecida?preview=novo' : '/senha-esquecida'}>
                        Esqueceu a senha?
                    </Link>
                </div>
                <button className="btn gold auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? 'Entrando…' : 'Entrar'}</span>
                    <ArrowRight {...ICON} aria-hidden="true" />
                </button>
                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}
            </Form>
        </>
    );
}

export function NewRecoveryForm({
    loading,
    error,
    emailSent,
    onFinish,
}: FormState & {
    emailSent: boolean;
    onFinish: (values: { email: string }) => void;
}) {
    return (
        <>
            {emailSent ? (
                <div className="auth-status" role="status">
                    <Check className="auth-success" size={32} strokeWidth={1.25} aria-hidden="true" />
                    <h1 id="auth-title">Confira seu e-mail</h1>
                    <p className="hint">Se houver uma conta, você receberá o link de recuperação.</p>
                </div>
            ) : (
                <>
                    <h1 id="auth-title">Recuperar senha</h1>
                    <Form
                        name="new-recovery"
                        initialValues={{ email: '' }}
                        layout="vertical"
                        requiredMark={false}
                        onFinish={onFinish}
                        noValidate
                        aria-busy={loading}
                    >
                        <EmailField />
                        <button className="btn gold auth-submit" type="submit" disabled={loading}>
                            <span>{loading ? 'Enviando…' : 'Recuperar senha'}</span>
                            <ArrowRight {...ICON} aria-hidden="true" />
                        </button>
                        {error && (
                            <p className="auth-error" role="alert">
                                {error}
                            </p>
                        )}
                    </Form>
                </>
            )}
            <Link className="lnk auth-back" href="/">
                <ArrowLeft {...ICON} aria-hidden="true" />
                Voltar para entrar
            </Link>
        </>
    );
}
