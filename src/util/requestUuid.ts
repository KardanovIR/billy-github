import {NextFunction, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {IIncomingRequest} from "../types/IncomingRequest";

export const requestUuid = (req: IIncomingRequest, res: Response, next: NextFunction) => {
    req.uuid = uuidv4();
    res.setHeader('X-Request-UUID', req.uuid);
    next();
}
