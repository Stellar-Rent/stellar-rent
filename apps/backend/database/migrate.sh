#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute path of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the backend root directory (one level up)
BACKEND_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Checking environment variables..."

# Source the .env file from backend root if it exists
if [ -f "$BACKEND_ROOT/.env" ]; then
    set -a # automatically export all variables
    source "$BACKEND_ROOT/.env"
    set +a
    echo "✅ Loaded .env file"
else
    echo "${RED}❌ No .env file found${NC}"
    exit 1
fi

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in $BACKEND_ROOT/.env${NC}"
    echo "You can find these in your Supabase dashboard under Project Settings > API"
    exit 1
fi

echo "🔍 Validating database URL format..."

# Extract database connection details from SUPABASE_URL
# Expected format: postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
if [[ ! "$SUPABASE_URL" =~ ^postgresql://postgres:.*@.*\.supabase\.co:5432/postgres$ ]]; then
    echo -e "${RED}Error: Invalid SUPABASE_URL format${NC}"
    echo "Format should be: postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
    exit 1
fi

echo "✅ URL format is valid"

# Extract password from URL for psql
SUPABASE_DB_PASSWORD=$(echo "$SUPABASE_URL" | sed -n 's/.*:\/\/postgres:\([^@]*\)@.*/\1/p')

# Function to run a migration file
run_migration() {
    local file=$1
    local name=$(basename "$file" .sql)

    echo -e "\n${GREEN}Running migration: $name${NC}"

    echo "🔍 Checking if migration was already applied..."

    # Check if migration was already applied
    local check_query="SELECT EXISTS(SELECT 1 FROM migrations WHERE name='$name')"
    echo "Running query: $check_query"

    if ! PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "$SUPABASE_URL" -t -A -c "$check_query" 2>/dev/null; then
        echo "Creating migrations table..."
        # If migrations table doesn't exist, create it
        PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "$SUPABASE_URL" -c "
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );" 2>/dev/null
    fi

    local exists=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "$SUPABASE_URL" -t -A -c "$check_query" 2>/dev/null)

    if [ "$exists" = "t" ]; then
        echo "Migration $name already applied, skipping..."
        return 0
    fi

    echo "📄 Applying migration file: $file"

    # Run the migration with verbose output
    if PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "$SUPABASE_URL" -v ON_ERROR_STOP=1 -f "$file"; then
        echo -e "${GREEN}✓ Migration $name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Migration $name failed${NC}"
        return 1
    fi
}

# Main migration process
echo -e "\n🚀 Starting migrations..."

# Run each migration file in order
for file in "$SCRIPT_DIR"/migrations/*.sql; do
    if [ -f "$file" ]; then
        if ! run_migration "$file"; then
            echo -e "${RED}❌ Migration process failed${NC}"
            exit 1
        fi
    fi
done

echo -e "\n${GREEN}✅ All migrations completed successfully${NC}"
