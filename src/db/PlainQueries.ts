export const GET_USER_REPO_ACTIVITIES = `
    SELECT DISTINCT user_id,
                    repository_id,
                    gs.t::date,
                    (SELECT COALESCE(count(distinct re.date), 0)
                     from rewardable_events as re
                     where re.user_id = rewardable_events.user_id
                       and re.repository_id = rewardable_events.repository_id
                       and re.date between gs.t - INTERVAL '1 month' and gs.t
                     group by re.user_id) as activities,
                    (SELECT metrics.stars
                     FROM metrics
                     WHERE repository_id = rewardable_events.repository_id
                     ORDER BY ABS(gs.t::date - metrics.date)
                     LIMIT 1),
                    (SELECT metrics.forks
                     FROM metrics
                     WHERE repository_id = rewardable_events.repository_id
                     ORDER BY ABS(gs.t::date - metrics.date)
                     LIMIT 1)
    FROM rewardable_events
             RIGHT OUTER JOIN (SELECT *
                               FROM
                                   generate_series(NOW() - INTERVAL '1 month'
                                       , NOW() - INTERVAL '1 day'
                                       , '1 day'::interval)) AS gs(t)
                              ON user_id = :user_id
    where user_id = :user_id
    group by rewardable_events.user_id, gs.t, repository_id
    order by t;
    ;
`;

export const GET_CLOSEST_METRICS = `
    SELECT :needed_date::DATE - metrics.date,
           ABS(:needed_date::DATE - metrics.date) as a
    FROM metrics
    WHERE repository_id = :repository_id
    ORDER BY a;
`;
