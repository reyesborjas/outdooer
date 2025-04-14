import psycopg2

# Connection parameters
host = "localhost"
port = "5434"
database = "postgres"  # Use default database first
user = "postgres"
password = "123456789"

try:
    # Attempt connection with explicit specification of SCRAM-SHA-256
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    
    # If successful, print confirmation
    print("Connection successful!")
    
    # Check if our target database exists
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM pg_database WHERE datname='outdooer'")
    exists = cursor.fetchone()
    
    if not exists:
        print("Database 'outdooer' does not exist, creating it...")
        # Need to commit current transaction before creating DB
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor.execute("CREATE DATABASE outdooer")
        print("Database 'outdooer' created successfully!")
    else:
        print("Database 'outdooer' already exists!")
    
    # Close connection
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Connection failed: {e}")