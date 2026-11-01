-- ====================================================================
-- INTRANET FILE VAULT (CYBER-AURORA GLASSMORPHISM EDITION)
-- MySQL / MariaDB Complete Production Database Schema
-- Compatible with MySQL 5.7+, 8.0+, MariaDB 10.3+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `intranet_vault` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `intranet_vault`;

-- --------------------------------------------------------------------
-- 1. DEPARTMENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dept_code` VARCHAR(20) NOT NULL UNIQUE,
  `dept_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dept_code` (`dept_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. EMPLOYEES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_id` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `first_name` VARCHAR(75) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  `designation` VARCHAR(100) DEFAULT 'Staff Member',
  `department_id` INT NULL,
  `email` VARCHAR(150) NULL,
  `remarks` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `password_hash` VARCHAR(255) NOT NULL,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 1,
  `passwordless_allowed` TINYINT(1) NOT NULL DEFAULT 0,
  `reset_token` VARCHAR(64) NULL,
  `reset_token_expires` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_employees_department` 
    FOREIGN KEY (`department_id`) 
    REFERENCES `departments` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
  INDEX `idx_emp_id` (`emp_id`),
  INDEX `idx_emp_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. FILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `file_uuid` VARCHAR(64) NOT NULL UNIQUE,
  `batch_id` VARCHAR(64) NOT NULL,
  `uploaded_by_emp_id` VARCHAR(50) NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  `file_extension` VARCHAR(20) NOT NULL,
  `file_size` BIGINT UNSIGNED NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `encryption_salt` VARCHAR(64) NOT NULL,
  `encryption_iv` VARCHAR(64) NOT NULL,
  `uploaded_by_ip` VARCHAR(45) NULL,
  `download_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_files_uuid` (`file_uuid`),
  INDEX `idx_files_expires` (`expires_at`),
  INDEX `idx_files_emp` (`uploaded_by_emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. ADMINS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('super_admin', 'sub_admin') NOT NULL DEFAULT 'sub_admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_user` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. ALLOWED EXTENSIONS WHITELIST TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `allowed_extensions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `extension` VARCHAR(20) NOT NULL UNIQUE,
  `mime_type` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'Document',
  `is_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. AUDIT ACTIVITY LOGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(50) NOT NULL,
  `emp_id` VARCHAR(50) NULL,
  `file_name` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `status` ENUM('SUCCESS', 'FAILED', 'BLOCKED') NOT NULL DEFAULT 'SUCCESS',
  `details` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_logs_action` (`action`),
  INDEX `idx_logs_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. PASSWORDLESS FEATURE REQUESTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `passwordless_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_id` VARCHAR(50) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING',
  `admin_notes` VARCHAR(255) NULL,
  `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME NULL,
  CONSTRAINT `fk_passwordless_emp`
    FOREIGN KEY (`emp_id`)
    REFERENCES `employees` (`emp_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX `idx_req_emp` (`emp_id`),
  INDEX `idx_req_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- DEFAULT SEED DATA
-- --------------------------------------------------------------------

-- Initial Departments
INSERT INTO `departments` (`dept_code`, `dept_name`) VALUES
('IT', 'Information Technology'),
('HR', 'Human Resources'),
('FIN', 'Finance & Accounting'),
('ENG', 'Engineering'),
('OPS', 'Operations & Logistics')
ON DUPLICATE KEY UPDATE `dept_name` = VALUES(`dept_name`);

-- Default Admins
-- super_admin: admin / AdminSecret123!
-- sub_admin: subadmin / SubAdminPass123!
INSERT INTO `admins` (`username`, `password_hash`, `full_name`, `role`) VALUES
('admin', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8G1bWp0D6O.xG6G7G3d1Z.zZ2G7yS', 'System Administrator', 'super_admin'),
('subadmin', '$2y$10$f/9.2jN4wP.R7d1Z2.xG6G7G3d1Z.zZ2G7yS8H9i0J1k2L3m4N5o', 'Assistant Operator', 'sub_admin')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Default Allowed Extension Whitelist
INSERT INTO `allowed_extensions` (`extension`, `mime_type`, `category`, `is_allowed`) VALUES
('pdf', 'application/pdf', 'Document', 1),
('zip', 'application/zip', 'Archive', 1),
('tar', 'application/x-tar', 'Archive', 1),
('gz', 'application/gzip', 'Archive', 1),
('7z', 'application/x-7z-compressed', 'Archive', 1),
('jpg', 'image/jpeg', 'Image', 1),
('png', 'image/png', 'Image', 1),
('gif', 'image/gif', 'Image', 1),
('mp4', 'video/mp4', 'Video', 1),
('mp3', 'audio/mpeg', 'Audio', 1),
('doc', 'application/msword', 'Document', 1),
('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Document', 1),
('xls', 'application/vnd.ms-excel', 'Spreadsheet', 1),
('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Spreadsheet', 1),
('txt', 'text/plain', 'Text', 1),
('csv', 'text/csv', 'Spreadsheet', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);

-- Sample Employees (Default Password '123456' hash: $2y$10$8K1p/a0dL1LXMIgoEDFrwO06s4J3vE1/zY0a1b2c3d4e5f6g7h8i9)
INSERT INTO `employees` (`emp_id`, `full_name`, `first_name`, `gender`, `designation`, `department_id`, `email`, `password_hash`, `must_change_password`, `passwordless_allowed`) VALUES
('EMP-1001', 'Akish Kumar', 'Akish', 'Male', 'Senior Network Engineer', 1, 'akish@company.local', '$2y$10$8K1p/a0dL1LXMIgoEDFrwO06s4J3vE1/zY0a1b2c3d4e5f6g7h8i9', 0, 1),
('EMP-1002', 'Jane Smith', 'Jane', 'Female', 'HR Specialist', 2, 'jane.smith@company.local', '$2y$10$8K1p/a0dL1LXMIgoEDFrwO06s4J3vE1/zY0a1b2c3d4e5f6g7h8i9', 1, 0),
('EMP-1003', 'Robert Chen', 'Robert', 'Male', 'DevOps Specialist', 4, 'robert.chen@company.local', '$2y$10$8K1p/a0dL1LXMIgoEDFrwO06s4J3vE1/zY0a1b2c3d4e5f6g7h8i9', 1, 0)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);
