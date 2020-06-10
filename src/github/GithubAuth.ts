import {GITHUB_APP_ID, GITHUB_CLIENT_ID, GITHUB_SECRET} from "../util/secrets";
import * as fs from 'fs';
import * as path from 'path';
import moment from "moment";

const {createAppAuth} = require("@octokit/auth-app");

const privateKey = fs.readFileSync(path.resolve(__dirname, '../../keys/billy-app-key-1.pem'), {encoding: 'utf8'});

export const githubAuth = (installationId: string) => createAppAuth({
    id: GITHUB_APP_ID,
    privateKey: privateKey,
    installationId: installationId,
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_SECRET,
});

export class GithubAuth {

    private static installationTokens: Map<string, { token: string, expiresAtTimestamp: number }> = new Map();

    static async getInstallationToken(installationId: string) {
        const installationToken = GithubAuth.installationTokens.get(installationId);
        if (installationToken && installationToken.expiresAtTimestamp > moment().unix()) {
            return installationToken;
        }
        const auth = githubAuth(installationId);
        const newToken = await auth({type: 'installation'});
        newToken.expiresAtTimestamp = moment(newToken.expiresAt).unix();
        GithubAuth.installationTokens.set(installationId, newToken)
        return newToken;
    }

    static async getOauthToken(installationId: string, code: string) {
        const auth = githubAuth(installationId);

        return await auth({type: "oauth", code: code});
    }
}