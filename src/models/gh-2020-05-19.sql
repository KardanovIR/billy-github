CREATE TABLE gh_installs
(
    id         INT NOT NULL PRIMARY KEY,
    login      TEXT,
    avatar_url TEXT,
    type       VARCHAR(100),
    created_at timestamp default now(),
    updated_at timestamp default now(),
    plain_data JSONB
);

CREATE TABLE gh_repositories
(
    id         INT NOT NULL PRIMARY KEY,
    full_name  TEXT,
    name       TEXT,
    node_id    VARCHAR(100),
    private    BOOLEAN,
    created_at timestamp default now(),
    updated_at timestamp default now(),
    plain_data JSONB
);

CREATE TABLE gh_users
(
    id         INT NULL UNIQUE,
    login      TEXT PRIMARY KEY,
    avatar_url TEXT,
    seed       TEXT,
    created_at timestamp default now(),
    updated_at timestamp default now(),
    plain_data JSONB
);

CREATE TABLE gh_metric_types
(
    id   SERIAL PRIMARY KEY,
    name VARCHAR(20)
);

INSERT INTO gh_metric_types (id, name)
VALUES (1, 'STARS'),
       (2, 'FORKS'),
       (3, 'COMMITS'),
       (4, 'WATCHERS');

CREATE TABLE gh_metrics
(
    id         SERIAL PRIMARY KEY,
    gh_repository_id  INT NOT NULL REFERENCES gh_repositories (id),
    gh_metric_type_id INT NOT NULL REFERENCES gh_metric_types (id),
    value             INT NOT NULL,
    created_at        timestamp default now(),
    updated_at        timestamp default now(),
    plain_data        JSONB
);

CREATE TABLE gh_rewards
(
    id         SERIAL PRIMARY KEY,
    gh_repository_id INT NOT NULL REFERENCES gh_repositories (id),
    gh_user_id       INT NOT NULL REFERENCES gh_users (id),
    amount           INT NOT NULL,
    created_at       timestamp default now(),
    updated_at       timestamp default now(),
    plain_data       JSONB
);

CREATE TABLE gh_transfers
(
    id         SERIAL PRIMARY KEY,
    gh_repository_id INT NOT NULL REFERENCES gh_repositories (id),
    gh_sender_id     INT NOT NULL REFERENCES gh_users (id),
    gh_recipient_id  INT NOT NULL REFERENCES gh_users (id),
    url              TEXT,
    executed         BOOLEAN,
    amount           INT NOT NULL,
    created_at       timestamp default now(),
    updated_at       timestamp default now(),
    plain_data       JSONB
);


CREATE TABLE gh_bounties
(
    id         SERIAL PRIMARY KEY,
    gh_repository_id INT NOT NULL REFERENCES gh_repositories (id),
    gh_sender_id     INT NOT NULL REFERENCES gh_users (id),
    gh_recipient_id  INT NOT NULL REFERENCES gh_users (id),
    url              TEXT,
    executed         BOOLEAN,
    amount           INT NOT NULL,
    created_at       timestamp default now(),
    updated_at       timestamp default now(),
    plain_data       JSONB
);

