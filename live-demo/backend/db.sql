-- MySQL dump 10.13  Distrib 8.0.17, for Linux (x86_64)
--
-- Host: localhost    Database: confdemo
-- ------------------------------------------------------
-- Server version	8.0.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activation`
--

DROP TABLE IF EXISTS `activation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activation` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `code` varchar(32) DEFAULT '',
  `name` varchar(128) DEFAULT '',
  `email` varchar(128) NOT NULL DEFAULT '',
  `ipaddr` int(11) unsigned NOT NULL DEFAULT '0',
  `attempts` tinyint(4) DEFAULT '0',
  `ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_index` (`email`),
  KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=709 DEFAULT CHARSET=ascii;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groupstable`
--

DROP TABLE IF EXISTS `groupstable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupstable` (
  `gid` int(10) unsigned NOT NULL DEFAULT '0',
  `uid` int(10) unsigned DEFAULT '0',
  `name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `pin` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `spin` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `flag` int(11) unsigned DEFAULT '0',
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `ts` int(10) unsigned DEFAULT '0',
  PRIMARY KEY (`gid`),
  KEY `ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `gid` int(10) unsigned NOT NULL DEFAULT '0',
  `uid` int(20) unsigned NOT NULL DEFAULT '0',
  `role` tinyint(4) DEFAULT '0',
  `pin` varchar(16) DEFAULT '',
  `ts` int(10) unsigned DEFAULT '0',
  UNIQUE KEY `gid_2` (`gid`,`uid`),
  KEY `gid` (`gid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `uid` int(10) unsigned DEFAULT NULL,
  `token` char(128) NOT NULL DEFAULT '0',
  `ipaddr` int(11) unsigned NOT NULL DEFAULT '0',
  `device` int(10) unsigned DEFAULT '0',
  PRIMARY KEY (`token`),
  UNIQUE KEY `uid_index` (`uid`),
  KEY `ip_index` (`ipaddr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `uid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `address` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `email` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `ts` int(10) unsigned DEFAULT '0',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `email` (`email`),
  KEY `ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-07-02  7:24:32
