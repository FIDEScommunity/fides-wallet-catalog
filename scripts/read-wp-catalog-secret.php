<?php
/**
 * Print fides_catalog_invalidate_secret from utrecht-demo (for local import scripts).
 */
declare(strict_types=1);

$socket = '/Users/victorvanderhulst/Library/Application Support/Local/run/buO_mZaLl/mysql/mysqld.sock';
$dbName = 'local';
$dbUser = 'root';
$dbPass = 'root';
$tablePrefix = 'wp_';
$optionName = 'fides_catalog_invalidate_secret';

if (! is_readable($socket)) {
    fwrite(STDERR, "MySQL socket not found (is Local running?): {$socket}\n");
    exit(1);
}

$mysqli = mysqli_init();
if ($mysqli === false) {
    fwrite(STDERR, "mysqli_init failed\n");
    exit(1);
}

if (! $mysqli->real_connect('localhost', $dbUser, $dbPass, $dbName, null, $socket)) {
    fwrite(STDERR, 'MySQL connect failed: ' . $mysqli->connect_error . "\n");
    exit(1);
}

$table = $tablePrefix . 'options';
$stmt = $mysqli->prepare("SELECT option_value FROM `{$table}` WHERE option_name = ? LIMIT 1");
if ($stmt === false) {
    fwrite(STDERR, "Prepare failed: {$mysqli->error}\n");
    exit(1);
}
$stmt->bind_param('s', $optionName);
$stmt->execute();
$result = $stmt->get_result();
$row = $result ? $result->fetch_assoc() : null;
$stmt->close();
$mysqli->close();

$secret = is_array($row) ? trim((string) ($row['option_value'] ?? '')) : '';
if ($secret === '') {
    fwrite(STDERR, "Catalog secret not configured in WordPress (option {$optionName}).\n");
    exit(1);
}

echo $secret;
