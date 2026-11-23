-- ==============================================================================
-- Campus Multi-Container Database Initialization Script
-- 1. shared_user_db: Shared authentication and user accounts for both apps
-- 2. notespace_logs_db: Dedicated logs, audit trail, and records for Notes Space
-- 3. app2_logs_db: Dedicated logs, session history, and gateway records for App 2
-- ==============================================================================

-- 1. Create the 3 individual databases
CREATE DATABASE shared_user_db;
CREATE DATABASE notespace_logs_db;
CREATE DATABASE app2_logs_db;

GRANT ALL PRIVILEGES ON DATABASE shared_user_db TO vault_admin;
GRANT ALL PRIVILEGES ON DATABASE notespace_logs_db TO vault_admin;
GRANT ALL PRIVILEGES ON DATABASE app2_logs_db TO vault_admin;

-- ==============================================================================
-- 2. SHARED USER DATABASE (shared_user_db)
-- ==============================================================================
\connect shared_user_db

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'regular',
    is_admin BOOLEAN DEFAULT FALSE,
    is_master_admin BOOLEAN DEFAULT FALSE,
    passwordless_allowed BOOLEAN DEFAULT FALSE,
    printer_access_allowed BOOLEAN DEFAULT TRUE,
    password_hash TEXT,
    password_salt TEXT,
    quick_pin_hash TEXT,
    quick_pin_salt TEXT,
    is_activated BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    last_password_reset TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_sessions (
    session_token VARCHAR(255) PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    app_source VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial production administrators
INSERT INTO users (emp_id, full_name, department, email, designation, user_type, is_admin, is_master_admin, passwordless_allowed, printer_access_allowed, password_hash, password_salt, quick_pin_hash, quick_pin_salt, is_activated, is_active)
VALUES 
('Akish', 'Akish', 'IT', 'akish@campus.edu', 'Master Administrator', 'master_admin', TRUE, TRUE, TRUE, TRUE, '4bdd9f06d57891ab41e5aa51d50ec60b307cc55ae5157fd6ea27842f0ac07772', '9209f6890c9487e30daf0dc8ca705f5c', '0ff6deecc841132f9be9398ad4aadd85ebec4d1b3d2516bf5f3ec97165bd40d4', '856548395a8c27df90324d5367f1d69c', TRUE, TRUE),
('Meera', 'Dr. Meera Nair', 'Science', 'meera.nair@campus.edu', 'Senior Science Teacher', 'superuser', FALSE, FALSE, TRUE, TRUE, '635f230fd2b6a5f149a81153484bb23a6e1a217feb623f5edf83f2bdcc7d4f1d', 'd0fcedeb509bba9b8a3aba2479dc318d', '0f00cea29c6ddd7efb60f67ff9edbf7c170b15807f3ed4514aed0ae782020030', '571cab2ec2c7f05cbc823c9c3bd3eb93', TRUE, TRUE)
ON CONFLICT (emp_id) DO NOTHING;

-- ==============================================================================
-- 3. NOTES SPACE LOGS & AUDIT DATABASE (notespace_logs_db)
-- ==============================================================================
\connect notespace_logs_db

CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    file_id INT,
    file_uuid VARCHAR(100),
    batch_id VARCHAR(100),
    original_name TEXT NOT NULL,
    file_extension VARCHAR(50),
    file_size BIGINT,
    file_size_formatted VARCHAR(50),
    department VARCHAR(100),
    tags TEXT[],
    uploaded_by_emp_id VARCHAR(50),
    uploader_name VARCHAR(150),
    access_mode VARCHAR(50),
    upload_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    emp_id VARCHAR(50),
    user_name VARCHAR(150),
    target VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS system_sessions (
    token VARCHAR(255) PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. APP 2 GATEWAY & SESSION LOGS DATABASE (app2_logs_db)
-- ==============================================================================
\connect app2_logs_db

CREATE TABLE IF NOT EXISTS session_logs (
    id SERIAL PRIMARY KEY,
    client_ip VARCHAR(50) NOT NULL,
    username VARCHAR(100),
    pin_used VARCHAR(50),
    allocated_seconds INT,
    status VARCHAR(50),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gateway_firewall_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    client_ip VARCHAR(50),
    rule_applied TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id SERIAL PRIMARY KEY,
    voucher_code VARCHAR(50) NOT NULL,
    redeemed_by_ip VARCHAR(50) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
