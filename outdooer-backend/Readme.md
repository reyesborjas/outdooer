# Outdooer Backend API

Outdooer is a platform for outdoor activity guides to manage their activities, expeditions, and teams.

## Features

- **User Management**: Registration, authentication, and profile management
- **Team Management**: Create and manage teams of guides with different role levels
- **Activities**: Create, update, and manage outdoor activities
- **Activity Dates**: Schedule available dates for activities
- **Resources**: Track equipment and resources needed for activities
- **Expeditions**: Create multi-day, multi-activity adventures
- **Locations**: Manage activity locations with geographic data

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL 13+
- pip

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/outdooer-backend.git
   cd outdooer-backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables in a `.env` file:
   ```
   FLASK_APP=run.py
   FLASK_ENV=development
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   
   # Database connection
   DB_USER=postgres
   DB_PASSWORD=123456789
   DB_HOST=localhost
   DB_PORT=5434
   DB_NAME=outdooer
   ```

### Database Setup

1. Make sure PostgreSQL is running

2. Test the database connection:
   ```
   python test_db_connection.py
   ```

3. Initialize the database:
   ```
   python scripts/init_db.py
   ```

   For development with sample data:
   ```
   python scripts/init_db.py --sample-data
   ```

### Running the Application

```
python run.py
```

The API will be available at `http://localhost:5000/`.

## API Documentation

### Authentication Endpoints

#### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```
POST /api/auth/register
```
Request body:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "invitation_code": "GD-ABCD1234"
}
```

#### Get Current User
```
GET /api/auth/me
```
Headers:
```
Authorization: Bearer {token}
```

### Activities Endpoints

#### Get All Activities
```
GET /api/activities/
```

#### Get Activity by ID
```
GET /api/activities/{activity_id}
```

#### Create Activity
```
POST /api/activities/
```
Request body:
```json
{
  "title": "Mountain Hike",
  "description": "A beautiful mountain hike with stunning views",
  "location_id": 1,
  "activity_type_id": 1,
  "difficulty_level": "moderate",
  "price": 49.99,
  "min_participants": 2,
  "max_participants": 10,
  "team_id": 1
}
```

#### Update Activity
```
PUT /api/activities/{activity_id}
```

#### Delete Activity
```
DELETE /api/activities/{activity_id}
```

#### Get Team Activities
```
GET /api/activities/team/{team_id}
```

#### Get My Activities
```
GET /api/activities/my-activities
```

### Activity Dates Endpoints

#### Get Activity Dates
```
GET /api/activity-dates/for-activity/{activity_id}
```

#### Add Activity Date
```
POST /api/activity-dates/add-date
```
Request body:
```json
{
  "activity_id": 1,
  "date": "2025-06-15",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "max_reservations": 10,
  "location": "Trailhead parking lot"
}
```

#### Update Activity Date
```
PUT /api/activity-dates/activity-dates/{date_id}
```

#### Delete Activity Date
```
DELETE /api/activity-dates/activity-dates/{date_id}
```

#### Get Guide Activity Instances
```
GET /api/activity-dates/guide-instances
```

#### Create Guide Activity Instance
```
POST /api/activity-dates/guide-instances
```
Request body:
```json
{
  "activity_id": 1
}
```

#### Get My Activity Dates
```
GET /api/activity-dates/my-dates
```

### Team Endpoints

#### Get My Teams
```
GET /api/teams/my-teams
```

#### Get Team Members
```
GET /api/teams/{team_id}/members
```

### Resources Endpoints

#### Get Resources
```
GET /api/resources/
```

#### Get Team Resources
```
GET /api/resources/team/{team_id}
```

#### Create Resource
```
POST /api/resources/
```
Request body:
```json
{
  "team_id": 1,
  "category_id": 1,
  "resource_name": "Climbing Rope",
  "description": "50m dynamic climbing rope",
  "quantity": 5,
  "unit_cost": 89.99
}
```

#### Get Resource Categories
```
GET /api/resources/categories
```

#### Get Team Resource Categories
```
GET /api/resources/categories/team/{team_id}
```

#### Create Resource Category
```
POST /api/resources/categories
```
Request body:
```json
{
  "team_id": 1,
  "category_name": "Climbing Equipment",
  "description": "Equipment used for climbing activities"
}
```

### Expedition Endpoints

#### Get All Expeditions
```
GET /api/expeditions
```

#### Get Expedition by ID
```
GET /api/expeditions/{expedition_id}
```

#### Create Expedition
```
POST /api/expeditions
```
Request body:
```json
{
  "title": "Mountain Adventure Week",
  "description": "A week-long adventure in the mountains",
  "start_date": "2025-07-01",
  "end_date": "2025-07-07",
  "min_participants": 4,
  "max_participants": 12,
  "price": 1299.99,
  "team_id": 1
}
```

#### Update Expedition
```
PUT /api/expeditions/{expedition_id}
```

#### Delete Expedition
```
DELETE /api/expeditions/{expedition_id}
```

#### Get Expedition Activities
```
GET /api/expeditions/{expedition_id}/activities
```

#### Add/Update Expedition Activities
```
POST /api/expeditions/{expedition_id}/activities
```
Request body:
```json
{
  "activities": [
    {
      "activity_id": 1,
      "sequence_order": 1,
      "day_number": 1,
      "is_optional": false
    },
    {
      "activity_id": 2,
      "sequence_order": 2,
      "day_number": 2,
      "is_optional": true
    }
  ]
}
```

### Location Endpoints

#### Get All Locations
```
GET /api/locations
```

#### Search Locations
```
GET /api/locations/search?q=mountain
```

### Activity Types Endpoints

#### Get Activity Types
```
GET /api/activity-types
```

### Invitation Endpoints

#### Generate Invitation Code
```
POST /api/invitations/generate
```
Request body:
```json
{
  "role_type": "guide",
  "team_id": 1,
  "max_uses": 1,
  "expires_in_days": 30
}
```

#### Validate Invitation Code
```
GET /api/invitations/validate/{code}
```

#### Get Invitation Details
```
GET /api/invitations/details/{code}
```

## Role-Based Access Control

The system defines several role levels for team members:

1. **Master Guide** (Level 1): Team owner with full permissions
2. **Tactical Guide** (Level 2): Can manage most aspects of the team
3. **Technical Guide** (Level 3): Can create activities and lead activities
4. **Base Guide** (Level 4): Limited permissions, can create activities

Different endpoints enforce these access levels to ensure users can only perform actions they're authorized for.

## Database Models

The application uses the following main models:

- **User**: Application users
- **UserRole**: Roles assigned to users (admin, guide, explorer)
- **Team**: Groups of guides
- **TeamMember**: User membership in teams with role levels
- **Activity**: Outdoor activities offered by guides
- **ActivityType**: Categories of activities
- **ActivityDate**: Scheduled dates for activities
- **Location**: Geographic locations for activities
- **Resource**: Equipment and supplies for activities
- **Expedition**: Multi-day, multi-activity adventures

## Development

### Running Tests

To run the test suite:
```
pytest
```

### Scripts

The repository includes several helpful scripts:

- `scripts/init_db.py`: Initialize the database
- `scripts/generate_invitations.py`: Generate test invitation codes
- `scripts/fix_user_roles.py`: Fix inconsistencies in user roles

## License

This project is licensed under the MIT License - see the LICENSE file for details.