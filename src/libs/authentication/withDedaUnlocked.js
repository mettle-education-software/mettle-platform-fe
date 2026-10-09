'use client';

import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMelpContext } from '../../providers/MelpProvider';

const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

// eslint-disable-next-line react/display-name
const withDedaUnlocked = (Component) => (props) => {
    const { isMelpSummaryLoading, melpSummary, isMelpSummaryError, retryMelpSummary } = useMelpContext();
    const router = useRouter();
    const newDesign = useNewDesign();
    // suspenso não abre DEDA (a lista já tranca todos; a home do IMERSO mostra o aviso); DEDA não liberado = 404
    const away = !melpSummary
        ? null
        : melpSummary.melp_status === 'MELP_SUSPENDED'
          ? '/imerso'
          : !melpSummary.unlocked_dedas?.includes(props.params.dedaId)
            ? '/404'
            : null;
    useEffect(() => {
        if (away) router.replace(away);
    }, [away, router]);

    // resumo fora do ar: tentar de novo em vez de carregar para sempre (plataforma nova)
    if (isMelpSummaryError && newDesign)
        return (
            <NewStatus
                title="Oops!"
                text="We couldn’t load your IMERSO."
                action={
                    <button type="button" className="btn line" onClick={retryMelpSummary}>
                        Try again
                    </button>
                }
            />
        );

    if (isMelpSummaryLoading || !melpSummary || away) return <LoadingLayout />;
    return <Component {...props} />;
};

withDedaUnlocked.displayName = 'withDedaUnlocked';

export { withDedaUnlocked };
