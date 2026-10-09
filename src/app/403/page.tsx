'use client';

import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import NotFound from '../not-found';

// /403: o conteúdo pedido não faz parte da conta (withRoles e aula de curso sem compra mandam para cá).
const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

export default function Forbidden() {
    const newDesign = useNewDesign();
    // tela atual: a mesma página de sempre (até aqui /403 caía no "não existe")
    if (!newDesign) return <NotFound />;
    return (
        <NewStatus
            title="Sem acesso"
            text="Este conteúdo não faz parte da sua conta."
            action={
                <a className="btn line" href="/">
                    Voltar ao Início
                </a>
            }
        />
    );
}
