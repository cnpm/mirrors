-- dist_file

ALTER TABLE `dist_file` ADD `category` varchar(200) NOT NULL COMMENT 'dist category';
UPDATE `dist_file` SET `category`='node';
ALTER TABLE `dist_file` ADD `md5` varchar(40) NOT NULL COMMENT 'md5 hex value';
ALTER TABLE `dist_file` ADD UNIQUE KEY `dist_file_category_parent_name` (`category`, `parent`, `name`);
DROP INDEX `dist_file_parent_name` ON `dist_file`;

-- dist_dir

ALTER TABLE `dist_dir` ADD `category` varchar(200) NOT NULL COMMENT 'dist category';
UPDATE `dist_dir` SET `category`='node';
ALTER TABLE `dist_dir` ADD UNIQUE KEY `dist_dir_category_parent_name` (`category`, `parent`, `name`);
DROP INDEX `dist_dir_parent_name` ON `dist_dir`;
