'use client';

import { Button, Form, Input, InputRef, Typography } from 'antd';
import type { MultiFactorResolver } from 'firebase/auth';
import { authCode, cleanCode, mfaErrorMessage, resolveTotp, retryable } from 'libs/authentication/mfa';
import React, { useRef, useState } from 'react';

/**
 * Segundo passo do login (verificação em duas etapas, administradores): o código de 6 dígitos do app autenticador.
 * Código errado, muitas tentativas ou sem conexão: tenta de novo no mesmo desafio; o resto (tempo esgotado, desafio
 * inválido) volta para a senha com a frase. Nada de laço.
 */
export const MfaStep: React.FC<{
    resolver: MultiFactorResolver;
    onBack: (message?: string) => void;
}> = ({ resolver, onBack }) => {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const input = useRef<InputRef>(null);

    const submit = async () => {
        if (busy || code.length !== 6) return;
        setBusy(true);
        setError(null);
        try {
            // depois daqui, o mesmo caminho do login de sempre (o app ouve a sessão e entra)
            await resolveTotp(resolver, code);
        } catch (failure) {
            const reason = authCode(failure);
            setBusy(false);
            setCode('');
            if (!retryable(reason)) return onBack(mfaErrorMessage(reason));
            setError(mfaErrorMessage(reason));
            // o teclado do celular não fecha: o campo segue em foco para o próximo código
            input.current?.focus();
        }
    };

    return (
        // o código não vai para gravações de sessão (Clarity)
        <Form layout="vertical" onFinish={submit} data-clarity-mask="True">
            <Typography.Title level={1} style={{ marginTop: 0, fontSize: 22 }}>
                Verificação em duas etapas
            </Typography.Title>
            <Typography.Paragraph type="secondary">
                Digite o código de 6 dígitos do seu app autenticador.
            </Typography.Paragraph>
            <Form.Item validateStatus={error ? 'error' : undefined} help={error ?? undefined}>
                <Input
                    ref={input}
                    className="input"
                    size="large"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Código de 6 dígitos"
                    aria-invalid={!!error}
                    placeholder="000000"
                    value={code}
                    readOnly={busy}
                    onChange={(event) => {
                        setError(null);
                        setCode(cleanCode(event.target.value));
                    }}
                />
            </Form.Item>
            <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={busy}
                disabled={code.length !== 6}
                style={{ width: '100%', minHeight: 40, height: '3rem' }}
            >
                Confirmar
            </Button>
            <Button type="link" onClick={() => onBack()} disabled={busy} style={{ marginTop: 8, paddingInline: 0 }}>
                Voltar
            </Button>
        </Form>
    );
};
