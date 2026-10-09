'use client';

import styled from '@emotion/styled';
import { Form } from 'antd';
import { Logo } from 'components/atoms/Logo/Logo';
import { LOGIN_COPY } from 'libs/newDesign';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, Headphones, Route, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
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
        --auth-card-top: #f1e9dc;
        --auth-card-bottom: #d5bb94;
        --auth-glass: rgba(255, 250, 241, 0.8);
        --auth-glass-border: rgba(255, 255, 255, 0.65);
        position: relative;
        isolation: isolate;
        min-width: 0;
        height: 160px;
        margin: 16px 16px 0;
        overflow: hidden;
        border-radius: 24px;
        background: linear-gradient(145deg, var(--auth-card-top) 10%, var(--auth-card-bottom));
    }
    .auth-mosaic {
        position: absolute;
        inset: -55% -12%;
        transform: rotate(-9deg);
        opacity: 0.8;
        mask-image: linear-gradient(90deg, transparent 5%, #000 70%);
    }
    .auth-image {
        object-fit: cover;
        filter: brightness(0.72) saturate(0.75);
    }
    .auth-visual-header {
        position: relative;
        z-index: 1;
        display: grid;
        align-content: center;
        height: 100%;
        padding: 28px;
    }
    .auth-logo {
        width: 144px;
        max-width: 100%;
    }
    .auth-logo svg {
        display: block;
    }
    .auth-logo-on-dark {
        display: none;
    }
    .auth-visual-copy,
    .auth-chips {
        display: none;
    }
    .auth-form-brand {
        margin: 0 auto 40px;
    }
    .auth-form-panel {
        display: grid;
        place-items: center;
        width: 100%;
        min-width: 0;
        padding: 32px 24px 40px;
    }
    .auth-content {
        width: 100%;
        max-width: 384px;
        min-width: 0;
    }
    h1 {
        font-size: clamp(25px, 2.2vw, 30px);
        font-weight: 400;
        letter-spacing: -0.035em;
        margin: 0 0 32px;
    }
    .ant-form {
        font: inherit;
        color: inherit;
    }
    .ant-form-item {
        margin-bottom: 24px;
    }
    .ant-form-item-label {
        padding-bottom: 8px;
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
        justify-content: flex-start;
        margin: -12px 0 24px;
    }
    .lnk {
        padding-inline: 0;
        white-space: normal;
    }
    .auth-submit {
        width: 100%;
        min-height: 52px;
        justify-content: center;
        padding-inline: 22px;
    }
    .auth-signup {
        margin: 28px 0 0;
        text-align: center;
        color: var(--r-muted);
        font-size: 13px;
        line-height: 1.8;
    }
    .auth-signup a {
        color: var(--r-gold-hi);
        text-decoration: underline;
        text-underline-offset: 4px;
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
        padding: 24px;
        align-items: stretch;
        .auth-visual {
            position: sticky;
            top: 24px;
            height: calc(100vh - 48px);
            height: calc(100svh - 48px);
            min-height: 640px;
            margin: 0;
            border-radius: 32px;
        }
        .auth-visual-header {
            height: auto;
            justify-items: center;
            padding: clamp(40px, 7vh, 80px) 40px 0;
            text-align: center;
        }
        .auth-visual-copy {
            display: block;
            max-width: 440px;
        }
        .auth-visual-copy h2 {
            margin: 28px 0 0;
            font-size: clamp(32px, 3.2vw, 48px);
            font-weight: 300;
            line-height: 1.2;
            letter-spacing: -0.045em;
            overflow-wrap: anywhere;
        }
        .auth-visual-copy p {
            margin: 16px 0 0;
            font-size: 15px;
            line-height: 1.6;
            color: var(--r-muted);
        }
        .auth-mosaic {
            inset: 34% -12% -18%;
            mask-image: linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent);
        }
        .auth-chips {
            display: block;
            position: absolute;
            inset: 38% 0 0;
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .auth-chip {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            border: 1px solid var(--auth-glass-border);
            border-radius: 999px;
            background: var(--auth-glass);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            box-shadow: 0 12px 40px rgba(36, 27, 17, 0.12);
            font-size: 15px;
            font-weight: 400;
            letter-spacing: 0.04em;
        }
        .auth-chip:nth-child(1) {
            top: 10%;
            left: 9%;
        }
        .auth-chip:nth-child(2) {
            top: 28%;
            right: 8%;
        }
        .auth-chip:nth-child(3) {
            bottom: 27%;
            left: 13%;
        }
        .auth-chip:nth-child(4) {
            bottom: 10%;
            right: 12%;
        }
        .auth-form-panel {
            min-height: calc(100vh - 48px);
            min-height: calc(100svh - 48px);
            padding: 56px 48px;
        }
        .auth-form-brand {
            width: 168px;
            margin-bottom: 48px;
        }
    }
    @media (prefers-color-scheme: dark) {
        ${tokenText(DARK)}
        color-scheme: dark;
        .auth-visual {
            --auth-card-top: #302a24;
            --auth-card-bottom: #796043;
            --auth-glass: rgba(47, 39, 30, 0.78);
            --auth-glass-border: rgba(231, 207, 176, 0.28);
        }
        .auth-logo-on-light {
            display: none;
        }
        .auth-logo-on-dark {
            display: block;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
            animation: none;
            transition: none;
        }
    }
`;

function LoginBrand({ className = '' }: { className?: string }) {
    return (
        <div className={`auth-logo ${className}`} role="img" aria-label="Mettle">
            <div className="auth-logo-on-light" aria-hidden="true">
                <Logo theme="dark" />
            </div>
            <div className="auth-logo-on-dark" aria-hidden="true">
                <Logo theme="light" />
            </div>
        </div>
    );
}

const PROGRAM_CHIPS = [
    { label: 'DEDA', Icon: BookOpen },
    { label: 'LAMP', Icon: Sun },
    { label: 'HPEC', Icon: Headphones },
    { label: 'DEDA Run', Icon: Route },
];

function LoginVisual() {
    return (
        <div className="auth-visual">
            <div className="auth-mosaic" aria-hidden="true">
                <Image
                    className="auth-image"
                    src="/img/deda-grid-bg.webp"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 62vw, 124vw"
                    priority
                />
            </div>
            <div className="auth-visual-header">
                <LoginBrand />
                <div className="auth-visual-copy">
                    <h2>{LOGIN_COPY.title}</h2>
                    {LOGIN_COPY.subtitle && <p>{LOGIN_COPY.subtitle}</p>}
                </div>
            </div>
            <ul className="auth-chips" aria-label="Programa Imerso">
                {PROGRAM_CHIPS.map(({ label, Icon }) => (
                    <li className="auth-chip" key={label}>
                        <Icon size={22} strokeWidth={1.25} aria-hidden="true" />
                        <span>{label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function NewAuthentication({ children }: { children: React.ReactNode }) {
    return (
        <Screen className={UI_FONT_CLASS} style={UI_FONT_VAR}>
            <LoginVisual />
            <div className="auth-form-panel">
                <section className="auth-content" aria-labelledby="auth-title">
                    <LoginBrand className="auth-form-brand" />
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
            <h1 id="auth-title">Acesse sua conta</h1>
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
                        Esqueci minha senha
                    </Link>
                </div>
                <button className="btn gold auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? 'Entrando…' : 'Entrar'}</span>
                </button>
                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}
            </Form>
            <p className="auth-signup">
                Ainda não é aluno?{' '}
                <a
                    href="https://mettle.com.br/programa-imerso/?utm_source=plataforma&utm_medium=login&utm_campaign=imerso"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Conheça o Imerso
                </a>
            </p>
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
