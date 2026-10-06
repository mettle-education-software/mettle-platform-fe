import { validateRecoveryLink } from 'libs/passwordRecovery';
import { redirect } from 'next/navigation';
import { accountService } from 'services';
import ResetPasswordLayout from './ResetPasswordLayout';

interface PageProps {
    searchParams: Record<string, string>;
}

export default async function Page({ searchParams }: PageProps) {
    const isValid = await validateRecoveryLink(accountService, searchParams.token, searchParams.userUid);

    if (isValid) return <ResetPasswordLayout token={searchParams.token} userUid={searchParams.userUid} />;

    redirect('/404');
}
