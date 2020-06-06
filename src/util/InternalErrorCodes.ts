export interface IErrorType {
    code: string,
    message: string
}

export enum ErrorTypesEnum{
    BAD_AUTH_ARGUMENTS = 'BAD_AUTHORIZATION_ARGUMENTS',
    OAUTH_FLOW_ERROR = 'OAUTH_FLOW_ERROR'
}