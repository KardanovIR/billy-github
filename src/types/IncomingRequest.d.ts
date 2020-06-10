import {Request} from 'express';

interface IIncomingRequest extends Request {
    uuid: string;
    user?: any
}