'use client';

import { Button, Form, Input, Typography } from 'antd';
import type { MultiFactorResolver } from 'firebase/auth';
import { authCode, challengeExpired, cleanCode, mfaErrorMessage, resolveTotp } from 'libs/authentication/mfa';
import React, { useState } from 'react';

/**
 * Segundo passo do login (verificação em duas etapas, administradores): o código de 6 dígitos do app autenticador.
 * Código errado: tenta de novo no mesmo desafio; tempo esgotado: volta para a senha (nada de laço).
 */
export const MfaStep: React.FC<{
    resolver: MultiFactorResolver;
    onBack: (message?: string) => void;
}> = ({ resolver, onBack }) => {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            if (challengeExpired(reason)) onBack(mfaErrorMessage(reason));
            else setError(mfaErrorMessage(reason));
        }
    };

    return (
        <Form layout="vertical" onFinish={submit}>
            <Typography.Title level={4} style={{ marginTop: 0 }}>
                Verificação em duas etapas
            </Typography.Title>
            <Typography.Paragraph type="secondary">
                Digite o código de 6 dígitos do seu app autenticador.
            </Typography.Paragraph>
            <Form.Item validateStatus={error ? 'error' : undefined} help={error ?? undefined}>
                <Input
                    className="input"
                    size="large"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Código de 6 dígitos"
                    placeholder="000000"
                    maxLength={7}
                    value={code}
                    disabled={busy}
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
