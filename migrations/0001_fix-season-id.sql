-- Migration number: 0001 	 2023-02-17T18:50:23.856Z
ALTER TABLE `backlog`
ADD COLUMN `season_id` INTEGER NOT NULL;
UPDATE `backlog`
SET `season_id` = `season`;
CREATE INDEX backlog_season ON `backlog` (`season_id`);