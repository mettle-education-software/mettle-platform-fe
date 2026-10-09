'use client';

import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMelpContext } from '../../providers/MelpProvider';

const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

// eslint-disable-next-line react/display-name
const withDedaUnlocked = (Component) => (props) => {
    const { isMelpSummaryLoading, melpSummary, isMelpSummaryError, retryMelpSummary } = useMelpContext();
    const router = useRouter();
    const newDesign = useNewDesign();

    // resumo fora do ar: tentar de novo em vez de carregar para sempre (plataforma nova)
    if (isMelpSummaryError && newDesign)
        return (
            <NewStatus
                title="Ops!"
                text="We couldn’t load your IMERSO."
                action={
                    <button type="button" className="btn line" onClick={retryMelpSummary}>
                        Try again
                    </button>
                }
            />
        );

    if (isMelpSummaryLoading || !melpSummary) return <LoadingLayout />;

    // suspenso não abre DEDA (a lista já tranca todos); a home do IMERSO mostra o aviso com a saída
    if (melpSummary.melp_status === 'MELP_SUSPENDED') {
        router.replace('/imerso');
        return <LoadingLayout />;
    }

    if (!melpSummary?.unlocked_dedas.includes(props.params.dedaId)) {
        router.push('/404');
        return null;
    }
    return <Component {...props} />;
};

withDedaUnlocked.displayName = 'withDedaUnlocked';

export { withDedaUnlocked };
