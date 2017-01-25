'use strict';

/*
CREATE TABLE IF NOT EXISTS `dist_dir` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(200) NOT NULL COMMENT 'dir name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `category` varchar(200) COMMENT 'dist category',
 `date` varchar(40) COMMENT '02-May-2014 01:06'
 PRIMARY KEY (`id`),
 UNIQUE KEY `dist_dir_category_parent_name` (`category`, `parent`, `name`),
 KEY `dist_dir_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist dir info';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('DistDir', {
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'dir name',
    },
    parent: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '/',
      comment: 'parent dir',
    },
    category: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'dist category',
    },
    date: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: '02-May-2014 01:06'
    }
  }, {
    tableName: 'dist_dir',
    comment: 'dist dir info',
    indexes: [
      {
        unique: true,
        fields: ['category', 'parent', 'name']
      },
      {
        fields: ['gmt_modified']
      }
    ],
    classMethods: {
    }
  });
};
