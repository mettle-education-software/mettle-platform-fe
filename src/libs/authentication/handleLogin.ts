import { auth } from 'config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React from 'react';

type HandleLoginType = (params: {
    email: string;
    password: string;
    setLoginErrorMessage: React.Dispatch<React.SetStateAction<null | string>>;
    setIsSignInLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => void;

export const handleLogin: HandleLoginType = async ({ email, password, setLoginErrorMessage, setIsSignInLoading }) => {
    await signInWithEmailAndPassword(auth, email, password).catch((error) => {
        setIsSignInLoading(false);
        switch (error.code) {
            case 'auth/user-disabled':
                setLoginErrorMessage('Oops! Parece que algo deu errado. Tente mais tarde!');
                break;
            case 'auth/invalid-email':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                setLoginErrorMessage('Oops! Parece que o email ou a senha estão incorretos');
                break;
            default:
                setLoginErrorMessage('Oops! Parece que algo deu errado. Tente mais tarde!');
        }
    });
};
