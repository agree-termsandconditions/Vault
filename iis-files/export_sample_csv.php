<?php
/**
 * Intranet File Vault - Sample Employee CSV Exporter
 */
require_once __DIR__ . '/config.php';

// Check Admin Authentication
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(403);
    die("Unauthorized");
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="employee_bulk_import_sample.csv"');

$output = fopen('php://output', 'w');

// CSV Headers
fputcsv($output, ['emp_id', 'full_name', 'department_code', 'email']);

// Sample Rows
fputcsv($output, ['EMP-2001', 'Alice Johnson', 'IT', 'alice.johnson@company.local']);
fputcsv($output, ['EMP-2002', 'Brian Miller', 'HR', 'brian.miller@company.local']);
fputcsv($output, ['EMP-2003', 'Clara Vance', 'ENG', 'clara.vance@company.local']);
fputcsv($output, ['EMP-2004', 'David Wright', 'FIN', 'david.wright@company.local']);

fclose($output);
exit;
