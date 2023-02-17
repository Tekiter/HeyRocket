-- Migration number: 0000 	 2023-02-17T17:10:02.165Z
CREATE TABLE `seasons` (
    `season_id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL
);
CREATE TABLE `backlog` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    `season` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
);