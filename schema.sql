CREATE TABLE `total` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
);
CREATE TABLE `today` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    `expire` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
);
CREATE TABLE `backlog` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    `season_id` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`, `season_id`)
);
CREATE INDEX backlog_season ON `backlog` (`season_id`);
CREATE TABLE `seasons` (
    `season_id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL
)