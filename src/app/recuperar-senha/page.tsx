import { redirect } from 'next/navigation';
import { accountService } from 'services';
import ResetPasswordLayout from './ResetPasswordLayout';

interface PageProps {
    searchParams: Record<string, string>;
}

export default async function Page({ searchParams }: PageProps) {
    const { data } = await accountService.get<{ isValid: boolean }>(`/passwords/v2/forgot/validate`, {
        params: {
            token: searchParams.token,
            userUid: searchParams.userUid,
        },
    });

    if (data.isValid) return <ResetPasswordLayout token={searchParams.token} userUid={searchParams.userUid} />;

    redirect('/404');
}
