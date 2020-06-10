import {NextFunction, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {IIncomingRequest} from "../types/IncomingRequest";
import {IErrorType} from "./InternalErrorCodes";


export interface IErrorResponseParams extends IErrorType{
    statusCode: number
}

export const requestUuid = (req: IIncomingRequest, res: Response, next: NextFunction) => {
    req.uuid = uuidv4();
    res.setHeader('X-Request-UUID', req.uuid);
    next();
}


export const sendError = (res: Response, req: IIncomingRequest, responseParams: IErrorResponseParams) => {
    res.status(responseParams.statusCode).json({
        ...responseParams
    }).end();
}