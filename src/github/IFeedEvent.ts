import {IUser} from "../models/User";

export enum FeedEventTypesEnum {
    PushEvent = 'PushEvent',
    PullRequestEvent = 'PullRequestEvent',
    CreateEvent = 'CreateEvent',
    IssueCommentEvent = 'IssueCommentEvent',
    IssuesEvent = 'IssuesEvent',
    ReleaseEvent = 'ReleaseEvent',
    DeleteEvent = 'DeleteEvent',
    WatchEvent = 'WatchEvent',
    ForkEvent = 'ForkEvent',
}

interface IPushEventPayload {
    push_id: number;
    size: number;
    distinct_size: number;
    ref: string;
    head: string;
    before: string;
    commits: Array<{
        sha: string;
        author: {
            email: string;
            name: string;
        };
        message: string;
        distinct: boolean;
        url: string;
    }>;
}

interface IPullRequestPayload {
    action: string;
    number: number;
    pull_request: {
        url: string;
        id: number;
        html_url: string;
        diff_url: string;
        patch_url: string;
        issue_url: string;
        number: number;
        state: string;
        locked: boolean;
        title: string;
        user: IUser,
        body: string;
        created_at: string;
        updated_at: string;
        closed_at: null;
        merged_at: null;
        merge_commit_sha: null;
        assignee: null;
        assignees: [];
        requested_reviewers: [];
        requested_teams: [];
        labels: [];
        milestone: null;
        draft: boolean;
        commits_url: string;
        review_comments_url: string;
        review_comment_url: string;
        comments_url: string;
        statuses_url: string;
        head: {};
        base: {};
        _links: {};
        author_association: string;
        merged: boolean;
        mergeable: null;
        rebaseable: null;
        mergeable_state: string;
        merged_by: null;
        comments: number;
        review_comments: number;
        maintainer_can_modify: boolean;
        commits: number;
        additions: number;
        deletions: number;
        changed_files: number;
    }
}

export interface IActor {
    id: number;
    login: string;
    display_login: string;
    gravatar_id: string;
    url: string;
    avatar_url: string;
    installation_id?: number;
}


export interface IGenericFeedEvent {
    id: string;
    type: FeedEventTypesEnum;
    actor: IActor,
    repo: {
        id: number;
        name: string;
        url: string;
    };
    payload: IPushEventPayload | IPullRequestPayload;
    public: boolean;
    created_at: string;
    org: {
        id: number;
        login: string;
        gravatar_id: string;
        url: string;
        avatar_url: string;
    };
}

export interface IIssueEvent {
    id: number;
    node_id: string;
    url: string;
    actor: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
    };
    event: string;
    commit_id: string;
    commit_url: string;
    created_at: string;
}

export interface IPushEvent extends IGenericFeedEvent {
    payload: IPushEventPayload
}

export interface IPullRequestEvent extends IGenericFeedEvent {
    payload: IPullRequestPayload
}