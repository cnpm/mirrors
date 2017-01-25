'use strict';

/*
CREATE TABLE IF NOT EXISTS `dist_file` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(200) NOT NULL COMMENT 'file name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `category` varchar(200) NOT NULL COMMENT 'dist category',
 `date` varchar(40) COMMENT '02-May-2014 01:06',
 `size` int(10) unsigned NOT NULL COMMENT 'file size' DEFAULT '0',
 `sha1` varchar(40) COMMENT 'sha1 hex value',
 `md5` varchar(40) COMMENT 'md5 hex value',
 `url` varchar(2048),
 PRIMARY KEY (`id`),
 UNIQUE KEY `dist_file_parent_name` (`parent`, `name`),
 KEY `dist_file_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist file info';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('DistFile', {
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
      comment: 'dist category, like node, iojs and so on',
    },
    date: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: '02-May-2014 01:06'
    },
    size: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'file size'
    },
    sha1: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: 'sha1 hex value'
    },
    md5: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: 'md5 hex value'
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false
    }
  }, {
    tableName: 'dist_file',
    comment: 'dist file info',
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
