'use client';

import { withoutAuthentication } from 'libs';

function ActivateAccount() {
    return <div>Activate account</div>;
}

export default withoutAuthentication(ActivateAccount);
