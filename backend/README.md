# SafeWalk Backend
Spring Boot 3.2.5 / Java 21 / MySQL (Aiven).

Required environment variables:
MYSQL_HOST
MYSQL_PORT
MYSQL_DATABASE
MYSQL_USERNAME
MYSQL_PASSWORD

Optional:
SAFEWALK_ADMIN_PASSWORD (default 1234567890)
PORT (default 10000)

Local PowerShell:
$env:MYSQL_HOST="your-aiven-host"
$env:MYSQL_PORT="14504"
$env:MYSQL_DATABASE="defaultdb"
$env:MYSQL_USERNAME="avnadmin"
$env:MYSQL_PASSWORD="your-aiven-password"

Then:
mvn clean
mvn compile
mvn spring-boot:run

Health: http://localhost:10000/health
Demo user on an empty DB: PIN 1234, recovery code 123456.
Never commit secrets.
