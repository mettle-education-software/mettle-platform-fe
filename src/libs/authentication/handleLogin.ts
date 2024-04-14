import { auth, googleProvider, microsoftProvider } from 'config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, AuthError, AuthErrorCodes } from 'firebase/auth';
import React from 'react';

type HandleLoginType = (params: {
    email: string;
    password: string;
    setLoginErrorMessage: React.Dispatch<React.SetStateAction<null | string>>;
    setIsSignInLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => Promise<void>;

export const handleLogin: HandleLoginType = async ({ email, password, setLoginErrorMessage, setIsSignInLoading }) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
        setIsSignInLoading(false);
        if (error instanceof Error) {
            const authError = error as AuthError;
            switch (authError.code) {
                case AuthErrorCodes.USER_DISABLED:
                    setLoginErrorMessage('Oops! Parece que algo deu errado. Tente mais tarde!');
                    break;
                case AuthErrorCodes.INVALID_EMAIL:
                case AuthErrorCodes.NULL_USER:
                case AuthErrorCodes.INVALID_PASSWORD:
                    setLoginErrorMessage('Oops! Parece que o email ou a senha estão incorretos');
                    break;
                default:
                    setLoginErrorMessage('Oops! Parece que algo deu errado. Tente mais tarde!');
            }
        }
    }
};

export const handleGoogleLogin = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error(error);
    }
};

export const handleMicrosoftLogin = async () => {
    try {
        await signInWithPopup(auth, microsoftProvider);
    } catch (error) {
        console.error(error);
    }
};
