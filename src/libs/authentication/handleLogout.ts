import { auth } from 'config/firebase';
import { signOut } from 'firebase/auth';
import { rememberNewDesign } from 'libs/theme';
import { clearAdminMfa } from './mfa';

export const handleLogout = async () => {
    rememberNewDesign(false); // a próxima conta neste aparelho começa sem o fundo da plataforma nova
    clearAdminMfa(); // a próxima conta nesta aba não herda o aviso do Admin
    await signOut(auth);
};
