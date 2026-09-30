import axios, { AxiosInstance } from 'axios';
import { auth } from 'config/firebase';
import { HTTPOptions, HTTPResponse, HTTPClient } from 'interfaces';
import { ACCESS_DENIED_EVENT, IMERSO_PRODUCT, IMERSO_SALES_URL } from 'libs/productAccess';

const mettleApiUrl = process.env.METTLE_API_URL;

type TServiceName = 'accounts' | 'emailing' | 'lamp' | 'melp' | 'business' | 'admin' | 'short-list' | string;
const TServiceNameList: TServiceName[] = ['accounts', 'emailing', 'lamp', 'melp', 'business', 'admin', 'short-list'];

class ApiClient implements HTTPClient {
    baseUrl: string | undefined;
    client: AxiosInstance;

    constructor(private readonly serviceName: TServiceName) {
        if (TServiceNameList.includes(serviceName)) {
            this.serviceName = serviceName;
            this.baseUrl = mettleApiUrl;
            this.client = axios.create({
                baseURL: `${this.baseUrl}/${this.serviceName}`,
            });

            this.setAuthInterceptor();
            if (serviceName === 'melp' || serviceName === 'lamp') this.setAccessInterceptor();
        } else {
            this.client = axios.create({
                baseURL: serviceName,
            });
        }
    }

    async getAuthToken() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    user.getIdToken().then((token) => {
                        resolve(token);
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    setAuthInterceptor() {
        this.client.interceptors.request.use(async (config) => {
            const token = await this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // Guardião das ações do Imerso: o backend recusa gravações de quem está expirado (403 ACCESS_EXPIRED → modal de
    // renovação) ou sem o produto (403 NO_ACCESS → página de venda).
    setAccessInterceptor() {
        this.client.interceptors.response.use(undefined, (error) => {
            const code = error?.response?.status === 403 ? error.response.data?.code : undefined;
            if (typeof window !== 'undefined') {
                if (code === 'ACCESS_EXPIRED') {
                    window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: { product: IMERSO_PRODUCT } }));
                } else if (code === 'NO_ACCESS') {
                    window.location.href = IMERSO_SALES_URL;
                }
            }
            return Promise.reject(error);
        });
    }

    get<T>(endpoint: string, options?: HTTPOptions): Promise<HTTPResponse<T>> {
        return this.client.get<T>(endpoint, options);
    }

    post<D, R>(endpoint: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>> {
        return this.client.post<R>(endpoint, data, options);
    }

    patch<D, R>(endpoint: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>> {
        return this.client.patch<R>(endpoint, data, options);
    }

    delete<T>(endpoint: string): Promise<HTTPResponse<T>> {
        return this.client.delete<T>(endpoint);
    }

    put<D, R>(endpoint: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>> {
        return this.client.put<R>(endpoint, data, options);
    }
}

export default ApiClient;
