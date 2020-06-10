import {AccountTypes, IAccount} from "../models/Account";

export interface IInstallation {
    id: number,
    app_id: number,
    events: Array<string>,
    account: IAccount,
    app_slug: string,
    html_url: string,
    target_id: number,
    created_at: string,
    updated_at: string,
    permissions: {
        issues: string,
        metadata: string,
        statuses: string,
        pull_requests: string,
        repository_projects: string
    },
    target_type: AccountTypes,
    repositories_url: string,
    single_file_name: string | null,
    access_tokens_url: string,
    repository_selection: string,
    plain_data?: IInstallation
}