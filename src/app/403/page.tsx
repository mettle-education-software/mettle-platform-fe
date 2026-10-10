'use client';

import { useNewDesign } from 'hooks/useNewDesign';
import { MASTERCLASS_SALES_URL } from 'libs/masterclass';
import { IMERSO_SALES_URL } from 'libs/productAccess';
import dynamic from 'next/dynamic';
import NotFound from '../not-found';

// /403: o conteúdo pedido não faz parte da conta (withRoles e aula de curso sem compra mandam para cá).
const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

/** Sem acesso = convite de compra (modelo de acesso): quem manda para cá diz o produto (`?p=`) (PF2-13). */
const OFFERS: Record<string, { label: string; href: string }> = {
    imerso: { label: 'Conhecer o IMERSO', href: IMERSO_SALES_URL },
    masterclass: { label: 'Conhecer a Masterclass', href: MASTERCLASS_SALES_URL },
};

export default function Forbidden({ searchParams }: { searchParams?: { p?: string } }) {
    const newDesign = useNewDesign();
    // tela atual: a mesma página de sempre (até aqui /403 caía no "não existe")
    if (!newDesign) return <NotFound />;
    const offer = OFFERS[searchParams?.p ?? ''];
    return (
        <NewStatus
            title="Sem acesso"
            text="Este conteúdo não faz parte da sua conta."
            action={
                <>
                    {offer && (
                        <a className="btn gold" href={offer.href}>
                            {offer.label}
                        </a>
                    )}
                    <a className="btn line" href="/">
                        Voltar ao Início
                    </a>
                </>
            }
        />
    );
}
