import axios, {AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance} from "axios";
import {IUser} from "../models/User";
import Repository, {IGithubRepoDetails, IRepository} from "../models/Repository";
import {IGenericFeedEvent} from "./IFeedEvent";
import logger from "../util/logger";

export interface IGithubSecrets {
    clientId: string,
    clientSecret: string,
    apiBaseURI: string,
    accessTokenExchangeURI: string,
}

export interface IUserAccessToken {
    access_token: string,
    expires_in: string,
    refresh_token: string,
    refresh_token_expires_in: string,
    scope: string,
    token_type: string
}

export enum ReactionTypesEnum {
    Heart = 'heart',
    Eyes = 'eyes',
    Confused = 'confused',
    Rocket = 'rocket'
}


export class GithubAPIConnector {

    private readonly secrets: IGithubSecrets;
    private readonly axiosInstance: AxiosInstance;

    constructor(secrets: IGithubSecrets) {
        this.secrets = secrets;
        this.axiosInstance = axios.create({
            timeout: 30000,
            baseURL: this.secrets.apiBaseURI,
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.axiosInstance.interceptors.request.use((config) => {
            // logger.verbose(`Github API connector config:`, config);
            return config;
        }, function (error) {
            logger.error(`Axios interceptor error on request:`, error);
            // Do something with request error
            return Promise.reject(error);
        })

        this.axiosInstance.interceptors.response.use((res) => {
            // logger.verbose(`Axios response:`, res);
            return res;
        }, function (error) {
            logger.error(`Axios interceptor error on response:`, error);
            // Do something with request error
            return Promise.reject(error);
        });
    }

    private async callPrivateApi<T>(endpoint: string, token: string, requestOptions?: AxiosRequestConfig): Promise<T> {
        const headers = requestOptions && requestOptions.headers ? requestOptions.headers : {};
        const result = await this.axiosInstance.get<T>(endpoint, {
            ...requestOptions,
            headers: {
                'Authorization': `token ${token}`,
                ...headers
            }
        });
        return result.data;
    }

    private async sendPrivateApi<T>(endpoint: string, token: string, requestOptions?: AxiosRequestConfig): Promise<T> {
        const headers = requestOptions && requestOptions.headers ? requestOptions.headers : {};
        const data = requestOptions && requestOptions.data ? requestOptions.data : {};
        const result = await this.axiosInstance.post<T>(endpoint, data, {
            ...requestOptions,
            headers: {
                'Authorization': `token ${token}`,
                ...headers
            }
        });
        return result.data;
    }

    private async callPublicApi<T>(endpoint: string, token?: string, requestOptions?: AxiosRequestConfig): Promise<T> {
        let headers = requestOptions && requestOptions.headers ? requestOptions.headers : {};
        if (token) {
            headers = {
                'Authorization': `token ${token}`,
                ...headers
            }
        }
        const result = await this.axiosInstance.get<T>(endpoint, {
            ...requestOptions,
            headers: headers
        });
        return result.data;
    }

    // Replaced by GithubApp authentication
    // async exchangeCodeToAccessToken(code: string): Promise<string> {
    //     const userAccessToken = await axios.post<string>(this.secrets.accessTokenExchangeURI, {
    //         code: code,
    //         client_id: this.secrets.clientId,
    //         client_secret: this.secrets.clientSecret
    //     });
    //     return userAccessToken.data;
    // }

    async getUser(token: string): Promise<IUser> {
        return await this.callPrivateApi<IUser>('/user', token);
    }

    async getRepoFeed(repository: Repository, page: number = 1, token?: string): Promise<Array<IGenericFeedEvent>> {
        return this.callPublicApi<Array<IGenericFeedEvent>>(`/repos/${repository.full_name}/events`, token, {
            params: {
                page: page,
                per_page: 100
            }
        })
    }

    async getRepoStats(repository: Repository, token?: string) {
        return await this.callPublicApi<IGithubRepoDetails>(`/repos/${repository.full_name}`, token);
    }

    async getUserPublicInfo(login: string, token?: string): Promise<IUser> {
        return await this.callPublicApi<IUser>(`/users${login}`, token);
    }

    addReaction(endpoint: string, reaction: ReactionTypesEnum, token: string) {
        return this.sendPrivateApi(endpoint, token, {
            headers: {
                'Accept': 'application/vnd.github.squirrel-girl-preview+json',
                'Content-Type': 'application/json',
            },
            data: {
                "content": reaction
            }
        })
    }


}