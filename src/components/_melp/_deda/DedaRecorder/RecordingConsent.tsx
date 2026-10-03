'use client';

import styled from '@emotion/styled';
import { Drawer, Modal } from 'antd';
import { useDeviceSize } from 'hooks';
import React from 'react';
import { RecButton } from './ui';

// Texto da versão CONSENT_VERSION (libs/dedaRecording). Decisão do André em 02-Out-2026: guardar por tempo
// indeterminado e poder usar para melhorar o método e criar ferramentas, inclusive de IA. Revisar com o jurídico.
const Body = styled.div`
    color: #2b2b2b;
    font-size: 1rem;
    line-height: 1.5;

    h2 {
        font-size: 1.25rem;
        margin: 0 0 0.75rem;
        color: #1f1b16;
    }

    ul {
        padding-left: 1.25rem;
        margin: 0.75rem 0 1.25rem;
    }

    li {
        margin-bottom: 0.5rem;
    }

    .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        flex-wrap: wrap;
    }

    .actions .ghost {
        color: #2b2b2b;
        border-color: #6b6258;
    }

    .actions .ghost:focus-visible {
        outline-color: #2b2b2b;
    }

    @media (max-width: 480px) {
        .actions {
            flex-direction: column-reverse;
        }
        .actions button {
            width: 100%;
            min-height: 48px;
        }
    }
`;

interface Props {
    open: boolean;
    loading: boolean;
    failed: boolean;
    onAccept(): void;
    onDecline(): void;
}

export const RecordingConsent: React.FC<Props> = ({ open, loading, failed, onAccept, onDecline }) => {
    const isMobile = useDeviceSize() === 'mobile';

    const content = (
        <Body>
            <h2 id="recording-consent-title">Gravação da sua leitura</h2>
            <p>No passo 2 do DEDA, a Plataforma grava a sua leitura em voz alta e guarda o áudio na sua conta.</p>
            <ul>
                <li>
                    <strong>Quem ouve:</strong> você e os administradores da Mettle. Nenhum outro aluno tem acesso. Cada
                    vez que um administrador ouve, fica registrado.
                </li>
                <li>
                    <strong>Onde fica:</strong> em armazenamento privado, no Brasil.
                </li>
                <li>
                    <strong>Por quanto tempo:</strong> por tempo indeterminado.
                </li>
                <li>
                    <strong>Para quê:</strong> acompanhar a sua evolução, melhorar o método Mettle e criar ferramentas,
                    inclusive de inteligência artificial.
                </li>
                <li>
                    <strong>O que não fazemos:</strong> não publicamos a sua gravação nem a usamos em divulgação.
                </li>
            </ul>
            {failed && (
                <p role="alert" style={{ color: '#a1271d', fontWeight: 600 }}>
                    Não deu para registrar a sua resposta. Confira a internet e tente de novo.
                </p>
            )}
            <div className="actions">
                <RecButton type="button" className="ghost" onClick={onDecline} disabled={loading}>
                    Agora não
                </RecButton>
                <RecButton type="button" onClick={onAccept} disabled={loading} aria-busy={loading}>
                    {loading ? 'Registrando…' : 'Concordo e quero gravar'}
                </RecButton>
            </div>
        </Body>
    );

    if (isMobile)
        return (
            <Drawer
                open={open}
                placement="bottom"
                height="auto"
                closable={false}
                onClose={onDecline}
                aria-labelledby="recording-consent-title"
                styles={{ body: { padding: '1.5rem 1rem calc(1.5rem + env(safe-area-inset-bottom))' } }}
            >
                {content}
            </Drawer>
        );

    return (
        <Modal
            open={open}
            width={480}
            centered
            footer={null}
            closable={false}
            onCancel={onDecline}
            aria-labelledby="recording-consent-title"
        >
            {content}
        </Modal>
    );
};
