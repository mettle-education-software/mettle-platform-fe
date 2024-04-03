import { auth } from 'config/firebase';
import { signOut } from 'firebase/auth';

export const handleLogout = async () => {
    await signOut(auth);
};
