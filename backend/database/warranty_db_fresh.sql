-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: warranty_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `email_otps`
--

DROP TABLE IF EXISTS `email_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_otps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `purpose` enum('verify_email','reset_password') NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email_purpose` (`email`,`purpose`,`is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_otps`
--

LOCK TABLES `email_otps` WRITE;
/*!40000 ALTER TABLE `email_otps` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inquiries`
--

DROP TABLE IF EXISTS `inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inquiries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `kind` enum('service','career','partner','consultation') NOT NULL,
  `reference_no` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `status` enum('new','contacted','in_progress','assigned','technician_visit','under_service','resolved','closed') NOT NULL DEFAULT 'new',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `file_url` varchar(512) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `engineer_name` varchar(150) DEFAULT NULL,
  `engineer_contact` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inquiries_ref` (`reference_no`),
  KEY `idx_inquiries_kind_status` (`kind`,`status`),
  KEY `idx_inquiries_created` (`created_at`),
  CONSTRAINT `inquiries_chk_1` CHECK (json_valid(`details`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inquiries`
--

LOCK TABLES `inquiries` WRITE;
/*!40000 ALTER TABLE `inquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `inquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(150) NOT NULL,
  `name` varchar(150) NOT NULL,
  `model_number` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `warranty_months` smallint(5) unsigned NOT NULL DEFAULT 12,
  `price_inr` decimal(10,2) NOT NULL DEFAULT 0.00,
  `image_url` varchar(512) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  UNIQUE KEY `uq_products_model` (`model_number`),
  KEY `idx_products_category` (`category`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'oli-1h-series-3-6kw','OLI-1H Single-phase Hybrid Inverter','OLI-1H3L','Hybrid Inverters','Solar, storage and backup in one compact 3 to 6 kW unit.','Built for homes, shops, clinics and offices on single-phase supply. Runs loads from solar first, stores surplus in 48V battery.',60,68000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:23'),(2,'oli-1h-series-5kw','OLI-1H Single-phase Hybrid Inverter (5 kW)','OLI-1H5L','Hybrid Inverters','Higher output 5 kW model with dual MPPTs and fast backup.','Up to 6 units in parallel, six-period time-of-use scheduling and quiet fanless operation below 35 dB.',60,84000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:26'),(3,'oli-3h-series-15-30kw','OLI-3H Three-phase Hybrid Inverter','OLI-3H15H','Hybrid Inverters','Commercial-grade three-phase hybrid inverter with unbalanced load support.','Up to 60 kW PV input, dual high-voltage battery ports and full three-phase backup for commercial applications.',60,195000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:28'),(4,'oli-3h-series-30kw','OLI-3H Three-phase Hybrid Inverter (30 kW)','OLI-3H30H','Hybrid Inverters','High-capacity 30 kW industrial hybrid inverter.','Ideal for schools, hospitals, factories, and commercial microgrids.',60,310000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:31'),(5,'olb-512-lfp-battery-wall','OLB-5.12 LFP Battery Storage (Wall-Mount)','OLB-5.12W','Energy Storage','Safe, long-life 5.12 kWh lithium iron phosphate storage.','51.2V 100Ah prismatic LiFePO4 cells certified to BIS and UN 38.3 with integrated intelligent BMS.',120,128000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:21'),(6,'olb-512-lfp-battery-rack','OLB-5.12 LFP Battery Storage (Rack-Mount)','OLB-5.12R','Energy Storage','3U 19-inch rack format 5.12 kWh battery pack.','Modular scalable battery system expandable up to 10 packs in parallel (51.2 kWh total).',120,124000.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:18'),(7,'powermax-1100-inverter','PowerMax 1100 Sine Wave Inverter','PM-1100-SW','Inverters','Pure sine wave home inverter for sensitive electronic appliances.','1100 VA capacity with LCD status display and smart multi-stage charging.',24,7490.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:33'),(8,'tubular-150ah-battery','LongLife 150Ah Tall Tubular Battery','LL-TT-150','Batteries','Tall tubular inverter battery engineered for long power cuts.','High-density active material and low water-loss alloy for maximum cycle longevity.',60,14250.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:17'),(9,'aquapure-ro-plus','AquaPure RO+ Water Purifier','AP-RO-750','Water Purifiers','7-stage RO + UV + UF purification with essential mineral balance.','Delivers safe drinking water up to 2000 ppm TDS with 8L food-grade antimicrobial storage tank.',12,15990.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:02:12'),(10,'breezecool-55l-cooler','BreezeCool 55L Desert Air Cooler','BC-DC-55','Air Coolers','Heavy-duty desert cooler with 3-sided honeycomb pads and 45ft throw.','Powerful airflow with low power consumption and inverter compatibility.',12,10990.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:07'),(11,'aerosilent-bldc-fan','AeroSilent BLDC Ceiling Fan','AS-BLDC-1200','Ceiling Fans','Super energy-efficient 28 W brushless DC ceiling fan with remote.','Saves up to 65% electricity, 5-star BEE rated with timer and reverse modes.',36,3990.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:00:14'),(12,'chefpro-750w-mixer-grinder','ChefPro 750W Mixer Grinder','CP-MG-750','Kitchen Appliances','Heavy-duty 750 W copper motor with 3 stainless steel jars.','Ventilated motor housing and overload protection for demanding daily kitchen prep.',24,4290.00,NULL,0,'2026-11-17 11:51:52','2026-11-18 09:10:09'),(13,'defrtgyui-ertyjjkk','defrtgyui','ertyjjkk','Single-Phase Hybrid Inverter','ertyjuk',NULL,12,0.00,NULL,0,'2026-11-19 06:04:27','2026-11-19 06:13:40'),(14,'pv-module-p-18-series','PV Module','P 18 Series','Battery','All Climate Conditions, Efficient at low light,Positive Power Tolerance','',12,20000.00,'/uploads/products/c07ee697-9d93-4767-9613-6b73c051c411.jpg',1,'2026-11-19 06:17:18','2026-11-19 06:54:49'),(15,'pv-module-p-30-series','PV Module','P 30 Series','Battery','','',12,30000.00,'/uploads/products/34a520a0-f7c5-41d6-8bdf-d24c8954f72d.jpg',1,'2026-11-19 06:18:35','2026-11-19 06:54:57'),(16,'pv-module-p-35-series','PV Module','P 35 Series','Inverter','Efficient At Low Light etc....','',12,45000.00,'/uploads/products/79b5528e-ff85-49e9-a372-9727f95b03e1.jpg',1,'2026-11-19 06:19:47','2026-11-19 06:55:06');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serial_number_batches`
--

DROP TABLE IF EXISTS `serial_number_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `serial_number_batches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `batch_number` varchar(100) NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `production_month` char(7) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_number` (`batch_number`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serial_number_batches`
--

LOCK TABLES `serial_number_batches` WRITE;
/*!40000 ALTER TABLE `serial_number_batches` DISABLE KEYS */;
INSERT INTO `serial_number_batches` VALUES (1,'kjhgfdsdffghk',14,'2026-07',1,1,'2026-11-19 09:42:36'),(2,'3456',16,'2026-06',1,1,'2026-11-19 17:08:04'),(3,'790',14,'2026-04',1,1,'2026-11-19 18:28:37'),(4,'DEMO 1',15,'2026-02',1,1,'2026-11-20 04:47:15'),(5,'demo 2',16,'2026-02',1,1,'2026-11-20 04:53:31'),(6,'Demo 3',14,'2026-02',1,1,'2026-11-20 04:56:29'),(7,'okjlik',16,'2026-02',1,1,'2026-11-20 04:59:14');
/*!40000 ALTER TABLE `serial_number_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serial_numbers`
--

DROP TABLE IF EXISTS `serial_numbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `serial_numbers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `serial_number` varchar(150) NOT NULL,
  `qr_code` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `fk_serial_batch` (`batch_id`),
  CONSTRAINT `fk_serial_batch` FOREIGN KEY (`batch_id`) REFERENCES `serial_number_batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serial_numbers`
--

LOCK TABLES `serial_numbers` WRITE;
/*!40000 ALTER TABLE `serial_numbers` DISABLE KEYS */;
INSERT INTO `serial_numbers` VALUES (1,1,14,'9876rtgfhjk,','fds5tyghjj',1,'2026-11-19 09:42:36'),(2,2,16,'varsh09vk','wert',1,'2026-11-19 17:08:04'),(3,3,14,'OLITEC-005','okjolk',1,'2026-11-19 18:28:37'),(4,4,15,'OLITEC-002','JHGFDDF',1,'2026-11-20 04:47:15'),(5,5,16,'varsh09vkkkk','svgbhjk,l.',1,'2026-11-20 04:53:31'),(6,6,14,'OLITEC-001','sfrgthyjukilo',1,'2026-11-20 04:56:29'),(7,7,16,'PVMODULE001','sadsfdghj',1,'2026-11-20 04:59:14');
/*!40000 ALTER TABLE `serial_numbers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtp_settings`
--

DROP TABLE IF EXISTS `smtp_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smtp_settings` (
  `id` int(10) unsigned NOT NULL DEFAULT 1,
  `host` varchar(191) NOT NULL DEFAULT 'smtp.gmail.com',
  `port` int(10) unsigned NOT NULL DEFAULT 587,
  `secure` tinyint(1) NOT NULL DEFAULT 0,
  `username` varchar(191) NOT NULL DEFAULT 'arish@amvionlabs.com',
  `password` varchar(255) DEFAULT NULL,
  `from_email` varchar(191) NOT NULL DEFAULT 'arish@amvionlabs.com',
  `from_name` varchar(191) NOT NULL DEFAULT 'Olitec Clean Energy',
  `admin_email` varchar(191) NOT NULL DEFAULT 'arish@amvionlabs.com',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtp_settings`
--

LOCK TABLES `smtp_settings` WRITE;
/*!40000 ALTER TABLE `smtp_settings` DISABLE KEYS */;
INSERT INTO `smtp_settings` VALUES (1,'smtp.hostinger.com',587,0,'arish@amvionlabs.com','Amvion.321','arish@amvionlabs.com','Olitec Clean Energy','training2@amvionlabs.com',1,'2026-11-20 09:35:30');
/*!40000 ALTER TABLE `smtp_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(50) NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `contact_name` varchar(150) NOT NULL,
  `contact_email` varchar(191) NOT NULL,
  `contact_mobile` varchar(20) NOT NULL,
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_support_ticket` (`ticket_number`),
  KEY `idx_support_user` (`user_id`),
  KEY `idx_support_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_requests`
--

LOCK TABLES `support_requests` WRITE;
/*!40000 ALTER TABLE `support_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_mobile` (`mobile`),
  KEY `idx_users_role_status` (`role`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Olitec Administrator','admin@olitec.in','9840644034','scrypt$16384$8$1$D3jIsA67iW6bqQYjOcTxwQ==$ui3zSfWtGjtXbiQvX7KWf5gfmXaxRtcGpc7405YOg2Lm/vtlGi1bzupcvHz5mZXhvgaRSmsg6wj5bpqJpUkFYA==','admin','active',0,NULL,'Chennai','Tamil Nadu',NULL,'2026-11-21 05:03:30','2026-11-17 11:52:01','2026-11-21 05:03:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warranties`
--

DROP TABLE IF EXISTS `warranties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warranties` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `warranty_number` varchar(50) NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `installation_address` text NOT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `product_model` varchar(100) NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `purchase_date` date NOT NULL,
  `installation_date` date DEFAULT NULL,
  `dealer_name` varchar(150) NOT NULL,
  `dealer_contact` varchar(50) DEFAULT NULL,
  `invoice_file` varchar(500) DEFAULT NULL,
  `installation_file` varchar(500) DEFAULT NULL,
  `status` enum('pending','active','expired','rejected') NOT NULL DEFAULT 'pending',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `admin_remark` text DEFAULT NULL,
  `reviewed_by` int(10) unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warranties_number` (`warranty_number`),
  KEY `idx_warranties_user` (`user_id`),
  KEY `idx_warranties_product` (`product_id`),
  KEY `idx_warranties_serial_mobile` (`serial_number`,`mobile`),
  KEY `idx_warranties_status` (`status`),
  KEY `fk_warranties_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_warranties_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warranties_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warranties_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranties`
--

LOCK TABLES `warranties` WRITE;
/*!40000 ALTER TABLE `warranties` DISABLE KEYS */;
/*!40000 ALTER TABLE `warranties` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-21 10:41:50
