import { auth } from 'config/firebase';
import { signOut } from 'firebase/auth';
import { rememberNewDesign } from 'libs/theme';

export const handleLogout = async () => {
    rememberNewDesign(false); // a próxima conta neste aparelho começa sem o fundo da plataforma nova
    await signOut(auth);
};
