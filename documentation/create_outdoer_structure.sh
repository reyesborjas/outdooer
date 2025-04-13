#!/bin/bash

# Define the root directory
ROOT_DIR="C:\Users\reyes\OneDrive\Documents\Proyectos Propios\outdooer beta"

# Convert Windows path to Unix-style for bash
ROOT_DIR=$(echo "$ROOT_DIR" | sed 's/\\/\//g')

# Create the main project directory
mkdir -p "$ROOT_DIR/outdooer-backend"
cd "$ROOT_DIR/outdooer-backend"

# Create root files
touch .env .gitignore requirements.txt config.py run.py

# Create app directory and its subdirectories
mkdir -p app/{models,schemas,api,services,utils,tasks,storage}
touch app/__init__.py app/extensions.py

# Create model files
mkdir -p app/models
touch app/models/__init__.py
touch app/models/{user,team,microsite,certification,location,activity,expedition,resource,reservation,payment,earnings,committee,metrics,audit}.py

# Create schema files
mkdir -p app/schemas
touch app/schemas/__init__.py
touch app/schemas/{user,team,microsite,activity,expedition,reservation,payment}.py

# Create API endpoints and controllers
mkdir -p app/api/{auth,users,teams,microsites,activities,expeditions,reservations,payments,earnings,admin}
for dir in app/api/*; do
    if [ -d "$dir" ]; then
        touch "$dir/__init__.py" "$dir/routes.py" "$dir/controllers.py"
    fi
done
touch app/api/__init__.py

# Create service files
mkdir -p app/services
touch app/services/__init__.py
touch app/services/{auth_service,user_service,team_service,microsite_service,activity_service,expedition_service,reservation_service,payment_service,earnings_service,committee_service}.py

# Create utility files
mkdir -p app/utils
touch app/utils/__init__.py
touch app/utils/{security,validators,formatters,geo_utils,errors}.py

# Create task files
mkdir -p app/tasks
touch app/tasks/__init__.py
touch app/tasks/{payment_processing,metrics_calculation,notification_jobs}.py

# Create storage files
mkdir -p app/storage
touch app/storage/__init__.py
touch app/storage/{file_manager,cloud_storage}.py

# Create migrations directory
mkdir -p migrations

# Create test directory and files
mkdir -p tests
touch tests/__init__.py tests/conftest.py
touch tests/{test_auth,test_users,test_teams,test_microsites,test_activities,test_expeditions,test_reservations,test_payments}.py

# Create scripts directory and files
mkdir -p scripts
touch scripts/{init_db,generate_test_data}.py scripts/deploy.sh

echo "outdooer backend project structure has been created at $ROOT_DIR/outdooer-backend"