#!/bin/bash

# Script to create the project structure for outdooer-frontend

echo "Creating project structure for outdooer-frontend..."

# Create directories
mkdir -p public/images
mkdir -p src/api
mkdir -p src/assets/styles
mkdir -p src/components/common
mkdir -p src/components/layout
mkdir -p src/components/auth
mkdir -p src/components/activities
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/pages
mkdir -p src/utils

# Create empty files in public directory
touch public/favicon.ico

# Create empty files in api directory
touch src/api/index.js
touch src/api/auth.js
touch src/api/activities.js

# Create empty files in context directory
touch src/context/AuthContext.jsx

# Create empty files in hooks directory
touch src/hooks/useAuth.js

# Create empty files in pages directory
touch src/pages/Home.jsx
touch src/pages/Login.jsx
touch src/pages/Register.jsx
touch src/pages/Activities.jsx

# Create empty files in utils directory
touch src/utils/validators.js
touch src/utils/helpers.js

# Create main application files
touch src/App.jsx
touch src/main.jsx
touch src/Router.jsx

# Create configuration files at the root level
touch .eslintrc.js
touch vite.config.js

echo "Project structure created successfully!"
echo ""
echo "Directory structure:"
find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort
echo ""
echo "Files created:"
find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" -not -path "*/package*" | sort

echo ""
echo "Setup complete! You can now fill in the files with your code."