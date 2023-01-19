DROP TABLE IF EXISTS `total`;
CREATE TABLE `total` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
);
DROP TABLE IF EXISTS `today`;
CREATE TABLE `today` (
    `user_id` TEXT NOT NULL,
    `sent` INTEGER NOT NULL,
    `received` INTEGER NOT NULL,
    `expire` INTEGER NOT NULL,
    PRIMARY KEY (`user_id`)
);