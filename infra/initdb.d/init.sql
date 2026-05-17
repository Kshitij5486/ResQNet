-- ResQNet Database initialization
ALTER USER emergency_user WITH PASSWORD 'emergency_pass';
GRANT ALL PRIVILEGES ON DATABASE emergency_db TO emergency_user;
ALTER USER emergency_user CREATEDB;