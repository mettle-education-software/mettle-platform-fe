'use client';

import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useRouter } from 'next/navigation';
import { useMelpContext } from '../../providers/MelpProvider';

// eslint-disable-next-line react/display-name
const withDedaUnlocked = (Component) => (props) => {
    const { isMelpSummaryLoading, melpSummary } = useMelpContext();
    const router = useRouter();

    if (isMelpSummaryLoading || !melpSummary) return <LoadingLayout />;

    if (!melpSummary?.unlocked_dedas.includes(props.params.dedaId)) {
        return router.push('/404');
    } else {
        return <Component {...props} />;
    }
};

withDedaUnlocked.displayName = 'withDedaUnlocked';

export { withDedaUnlocked };
