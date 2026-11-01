# IIS 10, PHP 8.x, MySQL & Secondary Drive Deployment Guide

**Intranet File Vault - Self-Hosted Production Blueprint**
*Designed, Developed & Deployed by Akish | 阿奇什 | அகிஷ்*

---

## 1. Prerequisites
- Windows Server 2019 / 2022 / Windows 10/11 Professional
- IIS 10 with FastCGI / CGI Feature enabled
- PHP 8.1+ NTS (Non-Thread Safe) x64 installed in `C:\php`
- MySQL 8.0 / MariaDB 10.3+ running on port 3306

---

## 2. Windows IIS Application Pool & Permissions
1. Open **IIS Manager** (`inetpub`).
2. Create a new Application Pool named `IntranetVaultPool`:
   - .NET CLR Version: **No Managed Code**
   - Managed Pipeline Mode: **Integrated**
3. Create a secondary storage directory on `D:\`:
   ```cmd
   mkdir D:\EncryptedUploads
   ```
4. Grant full read/write NTFS permissions to the IIS Application Pool identity:
   ```cmd
   icacls "D:\EncryptedUploads" /grant "IIS AppPool\IntranetVaultPool":(OI)(CI)F /T
   ```

---

## 3. Web.config & File Size Limits Configuration
In your `inetpub/wwwroot/IntranetVault/web.config`, configure request limits for 50MB batch file uploads:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <security>
            <requestFiltering>
                <!-- 50MB in Bytes = 52428800 -->
                <requestLimits maxAllowedContentLength="52428800" />
            </requestFiltering>
        </security>
        <defaultDocument>
            <files>
                <add value="index.php" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
```

---

## 4. Automated 48-Hour Purge in Windows Task Scheduler
To automatically delete `.enc` files older than 48 hours:

1. Open **Task Scheduler** (`taskschd.msc`).
2. Click **Create Task** -> Name: `IntranetVault_48Hr_Cleanup`.
3. Set Security options: **Run whether user is logged on or not** with Highest Privileges.
4. Triggers: **Daily at 02:00 AM** (or hourly).
5. Action: **Start a program**:
   - Program/script: `C:\php\php.exe`
   - Add arguments: `C:\inetpub\wwwroot\IntranetVault\cleanup.php`
