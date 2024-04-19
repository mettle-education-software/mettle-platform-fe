'use client';

import { withoutAuthentication } from 'libs';

function ForgottenPassword() {
    return <h1>Forgotten password</h1>;
}

export default withoutAuthentication(ForgottenPassword);
