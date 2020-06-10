import {Request} from "express";
import logger from "../util/logger";
import {PASSPORT_SECRET} from "../util/secrets";

export const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const jwtExtractor = (req: Request) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'] ? req.cookies['jwt'] : null;
    }
    if (token === null && req && req.headers && req.headers['authorization']) {
        token = req.headers['authorization'].replace('Bearer ', '');
    }
    return token;
};
passport.use(new JWTStrategy({
    jwtFromRequest: jwtExtractor,
    secretOrKey: PASSPORT_SECRET
}, (jwtPayload: any, done: Function) => {

    logger.verbose(jwtPayload);

    if (Date.now() > jwtPayload.expires) {
        return done(null, {
            ok: false,
            authorizationRequired: true,
            message: `jwt expired: ${Date.now()} <= ${jwtPayload.expires}`
        });
    }

    return done(null, jwtPayload);
}));

