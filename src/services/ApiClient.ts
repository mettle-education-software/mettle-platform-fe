import axios, { AxiosInstance } from 'axios';
import { auth } from 'config/firebase';
import { HTTPOptions, HTTPResponse, HTTPClient } from 'interfaces';

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
