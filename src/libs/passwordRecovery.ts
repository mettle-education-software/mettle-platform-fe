// Validação do link de recuperação de senha. O token vai no CORPO (POST), porque a URL de uma chamada à API fica
// no log do Cloud Run e do API Gateway. Enquanto o backend/gateway não tiver o POST publicado (resposta 404/405),
// cai no GET antigo com o token na query. TODO: remover o fallback depois que o POST estiver no ar.
type RecoveryClient = {
    post<D, R>(endpoint: string, data?: D): Promise<{ data: R }>;
    get<T>(endpoint: string, options?: { params?: Record<string, string> }): Promise<{ data: T }>;
};

const ENDPOINT = '/passwords/v2/forgot/validate';

export const validateRecoveryLink = async (client: RecoveryClient, token?: string, userUid?: string) => {
    if (!token || !userUid) return false;
    try {
        const { data } = await client.post<{ token: string; userUid: string }, { isValid: boolean }>(ENDPOINT, {
            token,
            userUid,
        });
        return data.isValid === true;
    } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 405) throw error;
        const { data } = await client.get<{ isValid: boolean }>(ENDPOINT, { params: { token, userUid } });
        return data.isValid === true;
    }
};
