-- Part 1: Core Tables - Users, Locations, Teams

-- Users Table (Base table for all user types)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    profile_visibility BOOLEAN DEFAULT TRUE, -- TRUE for public, FALSE for private
    profile_image_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    national_id VARCHAR(20), -- National ID or Passport number
    phone_number VARCHAR(20),
    account_status VARCHAR(20) DEFAULT 'active' -- active, suspended, banned
);

-- Profile Visibility Settings (fine-grained control for private profiles)
CREATE TABLE ProfileVisibilitySettings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) UNIQUE,
    show_name BOOLEAN DEFAULT TRUE,
    show_age BOOLEAN DEFAULT TRUE,
    show_specialties BOOLEAN DEFAULT TRUE,
    show_certifications_count INTEGER DEFAULT 3,
    show_activity_count BOOLEAN DEFAULT TRUE,
    show_full_qualifications BOOLEAN DEFAULT TRUE,
    show_expedition_count BOOLEAN DEFAULT TRUE,
    show_team_affiliation BOOLEAN DEFAULT TRUE,
    show_role_level BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles (Explorer, Guide, Admin)
CREATE TABLE UserRoles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    role_type VARCHAR(20) NOT NULL, -- 'explorer', 'guide', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_type)
);

-- Locations table for standardized location management
CREATE TABLE Locations (
    location_id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) NOT NULL, -- city, region, country, park, mountain, lake, trail, etc.
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    elevation_meters DECIMAL(8, 2), -- optional elevation data
    parent_location_id INTEGER REFERENCES Locations(location_id), -- for hierarchical locations
    country_code CHAR(2), -- ISO country code
    region_code VARCHAR(10), -- state/province/region code
    postal_code VARCHAR(20),
    formatted_address TEXT, -- complete formatted address if applicable
    is_verified BOOLEAN DEFAULT FALSE, -- if location data has been verified
    geojson TEXT, -- for complex geographic features like trails, areas, etc.
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location aliases (alternative names for the same location)
CREATE TABLE LocationAliases (
    alias_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES Locations(location_id),
    alias_name VARCHAR(255) NOT NULL,
    language_code CHAR(2), -- ISO language code for language-specific names
    is_primary BOOLEAN DEFAULT FALSE, -- primary name in this language
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE Teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) UNIQUE NOT NULL,
    master_guide_id INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    team_status VARCHAR(20) DEFAULT 'active' -- active, dissolved
);

-- Team Roles Configuration
CREATE TABLE TeamRoleConfigurations (
    role_config_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    level_1_name VARCHAR(100) DEFAULT 'Master Guide',
    level_2_name VARCHAR(100) DEFAULT 'Tactical Guide',
    level_3_name VARCHAR(100) DEFAULT 'Technical Guide',
    level_4_name VARCHAR(100) DEFAULT 'Base Guide',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE TeamMembers (
    team_member_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    user_id INTEGER REFERENCES Users(user_id),
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 4),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Certifications
CREATE TABLE Certifications (
    certification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    certification_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    document_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guide Registration Requests
CREATE TABLE GuideRegistrationRequests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    team_id INTEGER REFERENCES Teams(team_id),
    request_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    tactical_guide_approval BOOLEAN DEFAULT FALSE,
    master_guide_approval BOOLEAN DEFAULT FALSE,
    request_message TEXT,
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_by INTEGER REFERENCES Users(user_id)
);

-- Create some basic indexes
CREATE INDEX idx_team_members_team_id ON TeamMembers(team_id);
CREATE INDEX idx_team_members_user_id ON TeamMembers(user_id);
CREATE INDEX idx_locations_lat_long ON Locations(latitude, longitude);
CREATE INDEX idx_locations_parent_id ON Locations(parent_location_id);
CREATE INDEX idx_locations_country_region ON Locations(country_code, region_code);

-- Part 2: Activities and Expeditions

-- Activities Table
CREATE TABLE Activities (
    activity_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    location_id INTEGER REFERENCES Locations(location_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    difficulty_level VARCHAR(50), -- easy, moderate, difficult, extreme
    created_by INTEGER REFERENCES Users(user_id),
    leader_id INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activity_status VARCHAR(20) DEFAULT 'active' -- draft, active, canceled, completed
    activity_type_id INTEGER REFERENCES ActivityTypes(activity_type_id),
    ); 

alter table activities ADD column activity_type_id integer references activity_types(activity_type_id);

CREATE TABLE activity_types (
    activity_type_id SERIAL PRIMARY KEY,
    activity_type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Locations (linking activities to locations)
CREATE TABLE ActivityLocations (
    activity_location_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id),
    location_id INTEGER REFERENCES Locations(location_id),
    location_type VARCHAR(50) NOT NULL, -- start, end, checkpoint, rest area, etc.
    sequence_order INTEGER, -- for ordered locations (like checkpoints)
    estimated_arrival_time TIMESTAMP, -- for scheduled arrivals
    estimated_departure_time TIMESTAMP, -- for scheduled departures
    is_public BOOLEAN DEFAULT TRUE, -- whether this location is shown publicly
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expeditions
CREATE TABLE Expeditions (
    expedition_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_by INTEGER REFERENCES Users(user_id),
    leader_id INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expedition_status VARCHAR(20) DEFAULT 'active' -- draft, active, canceled, completed
);

-- Expedition Locations (linking expeditions to locations)
CREATE TABLE ExpeditionLocations (
    expedition_location_id SERIAL PRIMARY KEY,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id),
    location_id INTEGER REFERENCES Locations(location_id),
    location_type VARCHAR(50) NOT NULL, -- basecamp, start, end, overnight, etc.
    sequence_order INTEGER, -- for the expedition itinerary
    arrival_date DATE,
    departure_date DATE,
    accommodation_details TEXT, -- where participants stay
    is_public BOOLEAN DEFAULT TRUE, -- whether this location is shown publicly
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes (for trails, paths, and complex routes)
CREATE TABLE Routes (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    route_type VARCHAR(50) NOT NULL, -- hiking_trail, cycling_path, kayaking_route, climbing_route, etc.
    total_distance_km DECIMAL(8, 2),
    elevation_gain_m DECIMAL(8, 2),
    elevation_loss_m DECIMAL(8, 2),
    difficulty_level VARCHAR(20), -- easy, moderate, difficult, extreme
    estimated_duration_minutes INTEGER,
    start_location_id INTEGER REFERENCES Locations(location_id),
    end_location_id INTEGER REFERENCES Locations(location_id),
    geojson TEXT, -- GeoJSON LineString or MultiLineString for the route path
    is_loop BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing invitation codes
CREATE TABLE invitation_codes (
    code_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    role_type VARCHAR(20) NOT NULL, -- 'master_guide', 'guide'
    team_id INTEGER REFERENCES teams(team_id),
    created_by INTEGER REFERENCES users(user_id),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by code
CREATE INDEX idx_invitation_codes_code ON invitation_codes(code);

-- Table for tracking invitation code usage
CREATE TABLE invitation_usages (
    usage_id SERIAL PRIMARY KEY,
    code_id INTEGER REFERENCES invitation_codes(code_id),
    user_id INTEGER REFERENCES users(user_id),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups
CREATE INDEX idx_invitation_usages_code_id ON invitation_usages(code_id);
CREATE INDEX idx_invitation_usages_user_id ON invitation_usages(user_id);

-- Activity Routes (linking activities to routes)
CREATE TABLE ActivityRoutes (
    activity_route_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id),
    route_id INTEGER REFERENCES Routes(route_id),
    direction VARCHAR(20) DEFAULT 'normal', -- normal, reverse, custom
    include_full_route BOOLEAN DEFAULT TRUE, -- false if only using a segment
    start_point_km DECIMAL(8, 2), -- distance from route start if not using full route
    end_point_km DECIMAL(8, 2), -- distance from route start if not using full route
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location Features (points of interest, dangers, facilities)
CREATE TABLE LocationFeatures (
    feature_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES Locations(location_id),
    feature_type VARCHAR(50) NOT NULL, -- water_source, danger, shelter, viewpoint, etc.
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_start_month INTEGER,
    season_end_month INTEGER,
    last_verified_date DATE,
    verified_by INTEGER REFERENCES Users(user_id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    elevation_meters DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expedition Activities with explicit order for route generation
CREATE TABLE ExpeditionActivities (
    expedition_activity_id SERIAL PRIMARY KEY,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id),
    activity_id INTEGER REFERENCES Activities(activity_id),
    sequence_order INTEGER NOT NULL, -- determines the route path
    day_number INTEGER NOT NULL, -- day of the expedition
    start_time TIME,
    end_time TIME,
    is_optional BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expedition_id, activity_id)
);

-- Calculated expedition routes (derived from activity locations)
CREATE TABLE ExpeditionRoutes (
    expedition_route_id SERIAL PRIMARY KEY,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) UNIQUE,
    total_distance_km DECIMAL(8, 2),
    total_travel_time_hours DECIMAL(6, 2),
    route_points TEXT, -- JSON array of ordered [lat, lng] coordinates
    route_summary TEXT, -- Textual summary of the route
    map_image_url VARCHAR(255),
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources Categories
CREATE TABLE ResourceCategories (
    category_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, category_name)
);

-- Resources
CREATE TABLE Resources (
    resource_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    category_id INTEGER REFERENCES ResourceCategories(category_id),
    resource_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Resources
CREATE TABLE ActivityResources (
    activity_resource_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id),
    resource_id INTEGER REFERENCES Resources(resource_id),
    quantity_required INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expedition Resources
CREATE TABLE ExpeditionResources (
    expedition_resource_id SERIAL PRIMARY KEY,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id),
    resource_id INTEGER REFERENCES Resources(resource_id),
    quantity_required INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Guide_Activity_Instance (
    instance_id SERIAL PRIMARY KEY,
    guide_id INT NOT NULL REFERENCES Users(user_id),
    activity_id INT NOT NULL REFERENCES Activities(activity_id),
    team_id INT REFERENCES Teams(team_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Activity_Available_Date (
    available_date_id SERIAL PRIMARY KEY,
    activity_instance_id INT NOT NULL REFERENCES Guide_Activity_Instance(instance_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_reservations INT DEFAULT 10,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' -- valores esperados: 'open', 'closed', 'canceled'
);



-- Create indexes for activities and expeditions
CREATE INDEX idx_activities_team_id ON Activities(team_id);
CREATE INDEX idx_activities_leader_id ON Activities(leader_id);
CREATE INDEX idx_activities_location_id ON Activities(location_id);
CREATE INDEX idx_activities_status ON Activities(activity_status);
CREATE INDEX idx_activities_date_range ON Activities(start_date, end_date);

CREATE INDEX idx_expeditions_team_id ON Expeditions(team_id);
CREATE INDEX idx_expeditions_leader_id ON Expeditions(leader_id);
CREATE INDEX idx_expeditions_status ON Expeditions(expedition_status);
CREATE INDEX idx_expeditions_date_range ON Expeditions(start_date, end_date);

CREATE INDEX idx_expedition_activities_expedition_id ON ExpeditionActivities(expedition_id);
CREATE INDEX idx_expedition_activities_activity_id ON ExpeditionActivities(activity_id);
CREATE INDEX idx_expedition_activities_sequence ON ExpeditionActivities(sequence_order);
CREATE INDEX idx_expedition_routes_expedition_id ON ExpeditionRoutes(expedition_id);

-- Part 3: Microsite and Social Features

-- Team Microsite
CREATE TABLE TeamMicrosites (
    microsite_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id) UNIQUE,
    site_title VARCHAR(255) NOT NULL,
    site_description TEXT,
    theme_color VARCHAR(20),
    logo_url VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Microsite Content Sections
CREATE TABLE MicrositeContentSections (
    section_id SERIAL PRIMARY KEY,
    microsite_id INTEGER REFERENCES TeamMicrosites(microsite_id),
    section_type VARCHAR(50) NOT NULL, -- about, services, safety_certifications, etc.
    title VARCHAR(255),
    content TEXT,
    display_order INTEGER,
    is_visible BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Microsite Posts (social media style)
CREATE TABLE MicrositePosts (
    post_id SERIAL PRIMARY KEY,
    microsite_id INTEGER REFERENCES TeamMicrosites(microsite_id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) NOT NULL, -- 'news', 'activity_promo', 'expedition_promo', 'announcement', etc.
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0, -- Added missing column
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Images (limited gallery, up to 5 per post)
CREATE TABLE PostImages (
    image_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES MicrositePosts(post_id),
    image_url VARCHAR(255) NOT NULL, -- URL to stored image (cloud storage)
    storage_provider VARCHAR(50) NOT NULL, -- 'aws_s3', 'cloudinary', etc.
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 5),
    alt_text VARCHAR(255),
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, display_order) -- Ensures ordered images without duplicates
);

-- Post Interactions (likes, saves)
CREATE TABLE PostInteractions (
    interaction_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES MicrositePosts(post_id),
    user_id INTEGER REFERENCES Users(user_id),
    interaction_type VARCHAR(20) NOT NULL, -- 'like', 'save', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, interaction_type) -- A user can only like or save once
);

-- Post Comments
CREATE TABLE PostComments (
    comment_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES MicrositePosts(post_id),
    user_id INTEGER REFERENCES Users(user_id),
    parent_comment_id INTEGER REFERENCES PostComments(comment_id) NULL, -- For nested comments
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hashtags for posts
CREATE TABLE Hashtags (
    hashtag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Hashtags (many-to-many relationship)
CREATE TABLE PostHashtags (
    post_hashtag_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES MicrositePosts(post_id),
    hashtag_id INTEGER REFERENCES Hashtags(hashtag_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, hashtag_id)
);

-- Trigger function for incremental counter updates
CREATE OR REPLACE FUNCTION update_post_interaction_counts_incremental()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment the appropriate counter
        IF NEW.interaction_type = 'like' THEN
            UPDATE MicrositePosts
            SET likes_count = likes_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = NEW.post_id;
        ELSIF NEW.interaction_type = 'save' THEN
            UPDATE MicrositePosts
            SET saves_count = saves_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement the appropriate counter
        IF OLD.interaction_type = 'like' THEN
            UPDATE MicrositePosts
            SET likes_count = GREATEST(0, likes_count - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = OLD.post_id;
        ELSIF OLD.interaction_type = 'save' THEN
            UPDATE MicrositePosts
            SET saves_count = GREATEST(0, saves_count - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = OLD.post_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER after_post_interaction_change_incremental
AFTER INSERT OR DELETE ON PostInteractions
FOR EACH ROW
EXECUTE FUNCTION update_post_interaction_counts_incremental();

-- Create indexes for social features
CREATE INDEX idx_micrositeposts_microsite_id ON MicrositePosts(microsite_id);
CREATE INDEX idx_micrositeposts_activity_id ON MicrositePosts(activity_id);
CREATE INDEX idx_micrositeposts_expedition_id ON MicrositePosts(expedition_id);
CREATE INDEX idx_micrositeposts_created_date ON MicrositePosts(created_at);
CREATE INDEX idx_micrositeposts_featured ON MicrositePosts(is_featured);
CREATE INDEX idx_postimages_post_id ON PostImages(post_id);
CREATE INDEX idx_postcomments_post_id ON PostComments(post_id);
CREATE INDEX idx_postinteractions_post_id ON PostInteractions(post_id);
CREATE INDEX idx_postinteractions_user_id ON PostInteractions(user_id);
CREATE INDEX idx_hashtags_name ON Hashtags(name);

-- Part 4: Reservations and Payments

-- Reservations
CREATE TABLE Reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id), -- explorer making the reservation
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    participant_count INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied, canceled
    denial_reason VARCHAR(100), -- required if status is 'denied'
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, processing, paid, refunded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (activity_id IS NOT NULL OR expedition_id IS NOT NULL)
);

ALTER TABLE Reservations
ADD COLUMN available_date_id INTEGER REFERENCES Activity_Available_Date(available_date_id);

CREATE TABLE Guide_Activity_Instance (
    instance_id SERIAL PRIMARY KEY,
    guide_id INTEGER NOT NULL REFERENCES Users(user_id),
    activity_id INTEGER NOT NULL REFERENCES Activities(activity_id),
    team_id INTEGER REFERENCES Teams(team_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Activity_Available_Date (
    available_date_id SERIAL PRIMARY KEY,
    activity_instance_id INTEGER NOT NULL REFERENCES Guide_Activity_Instance(instance_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_reservations INTEGER DEFAULT 10,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' -- valores esperados: open, closed, canceled
);

-- Reservation Participants
CREATE TABLE ReservationParticipants (
    participant_id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES Reservations(reservation_id),
    user_id INTEGER REFERENCES Users(user_id) NULL, -- NULL for non-registered participants
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50)
);

-- Payments Table
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES Reservations(reservation_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- credit_card, bank_transfer, paypal, etc.
    transaction_id VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) NOT NULL, -- processing, completed, failed, refunded, partially_refunded
    gateway_response TEXT, -- JSON response from payment gateway
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refund_date TIMESTAMP,
    refund_transaction_id VARCHAR(255),
    refund_status VARCHAR(20), -- processing, completed, failed
    refund_initiated_by INTEGER REFERENCES Users(user_id),
    refund_method VARCHAR(50), -- original_payment, credit, bank_transfer
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_country VARCHAR(100),
    billing_postal_code VARCHAR(20),
    eligible_for_auto_refund BOOLEAN DEFAULT TRUE,
    is_test_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refund Policies
CREATE TABLE RefundPolicies (
    policy_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id) NULL, -- NULL for system-wide policies
    policy_name VARCHAR(100) NOT NULL,
    cancellation_window_hours INTEGER NOT NULL, -- Hours before event start when full refund is available
    full_refund_cutoff_hours INTEGER NOT NULL, -- Hours before event when full refund ends
    partial_refund_percentage INTEGER, -- Percentage refunded after full refund cutoff
    partial_refund_cutoff_hours INTEGER, -- Hours before event when partial refund ends
    no_refund_message TEXT,
    exceptions_allowed BOOLEAN DEFAULT TRUE, -- Whether guides can make exceptions
    exception_approval_required BOOLEAN DEFAULT TRUE, -- Whether exceptions need approval
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Refund Policies (links specific events to refund policies)
CREATE TABLE EventRefundPolicies (
    event_policy_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    policy_id INTEGER REFERENCES RefundPolicies(policy_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (activity_id IS NOT NULL OR expedition_id IS NOT NULL)
);

-- Payment Disputes
CREATE TABLE PaymentDisputes (
    dispute_id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES Payments(payment_id),
    reservation_id INTEGER REFERENCES Reservations(reservation_id),
    user_id INTEGER REFERENCES Users(user_id), -- user who filed the dispute
    dispute_type VARCHAR(50) NOT NULL, -- refund_request, service_not_provided, quality_issue, etc.
    status VARCHAR(20) DEFAULT 'open', -- open, under_review, resolved, closed
    dispute_details TEXT NOT NULL,
    evidence_urls TEXT[], -- Array of URLs to evidence files
    dispute_amount DECIMAL(10, 2) NOT NULL, -- Amount being disputed
    filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to INTEGER REFERENCES Users(user_id) NULL, -- committee member handling the dispute
    resolution_type VARCHAR(50), -- full_refund, partial_refund, no_refund, credit, replacement_service
    resolution_details TEXT,
    resolution_date TIMESTAMP,
    is_auto_approved BOOLEAN DEFAULT FALSE, -- For automatic approvals based on criteria
    notified_parties TEXT[], -- Array tracking who has been notified
    last_notification_date TIMESTAMP,
    response_deadline TIMESTAMP, -- When a response is required by
    escalation_level INTEGER DEFAULT 1, -- 1=initial, 2=escalated to higher committee level, 3=final review
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute Responses
CREATE TABLE DisputeResponses (
    response_id SERIAL PRIMARY KEY,
    dispute_id INTEGER REFERENCES PaymentDisputes(dispute_id),
    responder_id INTEGER REFERENCES Users(user_id), -- Could be guide, explorer, or committee member
    responder_role VARCHAR(50) NOT NULL, -- explorer, guide, committee_member
    response_text TEXT NOT NULL,
    evidence_urls TEXT[], -- Array of URLs to evidence files
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute Resolution Templates
CREATE TABLE DisputeResolutionTemplates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    dispute_type VARCHAR(50) NOT NULL, -- Maps to PaymentDisputes.dispute_type
    resolution_type VARCHAR(50) NOT NULL, -- Maps to PaymentDisputes.resolution_type
    template_text TEXT NOT NULL,
    auto_approval_threshold DECIMAL(10, 2), -- Amount below which disputes are auto-approved
    required_committee_level INTEGER DEFAULT 3, -- Minimum committee level required to use this template
    created_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reservations
CREATE INDEX idx_reservations_user_id ON Reservations(user_id);
CREATE INDEX idx_reservations_activity_id ON Reservations(activity_id);
CREATE INDEX idx_reservations_expedition_id ON Reservations(expedition_id);
CREATE INDEX idx_reservations_status ON Reservations(status);
CREATE INDEX idx_reservations_payment_status ON Reservations(payment_status);
CREATE INDEX idx_payments_reservation_id ON Payments(reservation_id);
CREATE INDEX idx_payments_transaction_id ON Payments(transaction_id);
CREATE INDEX idx_payment_disputes_payment_id ON PaymentDisputes(payment_id);
CREATE INDEX idx_payment_disputes_user_id ON PaymentDisputes(user_id);

-- Part 5: Committee and Admin Features

-- Communications
CREATE TABLE Communications (
    communication_id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES Users(user_id),
    recipient_id INTEGER REFERENCES Users(user_id) NULL, -- NULL for team-wide communications
    team_id INTEGER REFERENCES Teams(team_id) NULL,
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    message_type VARCHAR(50), -- notification, message, announcement
    subject VARCHAR(255),
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- outdooer Committee
CREATE TABLE CommitteeRoles (
    committee_role_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 4),
    appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Team Metrics (for reservation limits tracking)
CREATE TABLE TeamMetrics (
    metric_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id) UNIQUE,
    current_reservation_count INTEGER DEFAULT 0,
    reservation_limit INTEGER DEFAULT 100,
    total_events_count INTEGER DEFAULT 0,
    total_activities_count INTEGER DEFAULT 0,
    total_expeditions_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_commission_paid DECIMAL(12, 2) DEFAULT 0,
    custom_commission_rate DECIMAL(5, 2) NULL, -- NULL means standard 10% rate
    commission_rate_negotiated BOOLEAN DEFAULT FALSE,
    limit_negotiation_date TIMESTAMP,
    limit_approved_by INTEGER REFERENCES Users(user_id), -- Admin who approved increased limit
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reported Issues
CREATE TABLE ReportedIssues (
    issue_id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES Users(user_id),
    reported_user_id INTEGER REFERENCES Users(user_id) NULL,
    reported_team_id INTEGER REFERENCES Teams(team_id) NULL,
    related_activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    related_expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    issue_type VARCHAR(50) NOT NULL, -- policy_violation, dispute, safety_concern, etc.
    description TEXT NOT NULL,
    severity_level INTEGER DEFAULT 1, -- 1: minor, 2: moderate, 3: severe, 4: critical
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_review, resolved, closed
    assigned_to INTEGER REFERENCES Users(user_id) NULL, -- Committee member handling the issue
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions Table for granular control
CREATE TABLE RolePermissions (
    permission_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 4),
    permission_type VARCHAR(100) NOT NULL, -- create_activity, edit_expedition, approve_reservation, etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    modified_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, role_level, permission_type)
);

-- Enforcement Actions 
CREATE TABLE EnforcementActions (
    action_id SERIAL PRIMARY KEY,
    reported_issue_id INTEGER REFERENCES ReportedIssues(issue_id) NULL, -- NULL if proactive enforcement
    user_id INTEGER REFERENCES Users(user_id) NULL, -- user being acted upon
    team_id INTEGER REFERENCES Teams(team_id) NULL, -- team being acted upon
    action_type VARCHAR(50) NOT NULL, -- warning, temporary_suspension, permanent_ban, team_dissolution, etc.
    reason TEXT NOT NULL,
    evidence TEXT, -- links or references to evidence
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP NULL, -- NULL for permanent actions
    committee_member_id INTEGER REFERENCES Users(user_id) NOT NULL, -- committee member who took action
    committee_role_level INTEGER NOT NULL, -- to enforce action permission by role level
    review_date TIMESTAMP, -- date when action should be reviewed
    appeal_status VARCHAR(20) DEFAULT 'not_appealed', -- not_appealed, appealed, appeal_approved, appeal_denied
    appeal_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- User Activity Tracking
CREATE TABLE UserActivityLogs (
    activity_log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    activity_type VARCHAR(50) NOT NULL, -- login, logout, profile_update, etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    location_data TEXT, -- JSON with geolocation data if available
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Guide Activity Monitor
CREATE TABLE MasterGuideActivityMonitor (
    monitor_id SERIAL PRIMARY KEY,
    master_guide_id INTEGER REFERENCES Users(user_id),
    team_id INTEGER REFERENCES Teams(team_id),
    last_login TIMESTAMP,
    last_event_created TIMESTAMP,
    last_reservation_managed TIMESTAMP,
    inactivity_warning_sent BOOLEAN DEFAULT FALSE,
    inactivity_warning_date TIMESTAMP,
    inactive_status BOOLEAN DEFAULT FALSE,
    inactive_since TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(master_guide_id, team_id)
);

-- Audit Log for tracking important changes
CREATE TABLE AuditLogs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    action_type VARCHAR(50) NOT NULL, -- create, update, delete, approve, deny, etc.
    entity_type VARCHAR(50) NOT NULL, -- user, team, activity, expedition, etc.
    entity_id INTEGER NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for committee and admin tables
CREATE INDEX idx_communications_recipient_id ON Communications(recipient_id);
CREATE INDEX idx_communications_team_id ON Communications(team_id);
CREATE INDEX idx_user_activity_logs_user_id ON UserActivityLogs(user_id);
CREATE INDEX idx_master_guide_activity_monitor_guide_id ON MasterGuideActivityMonitor(master_guide_id);
CREATE INDEX idx_master_guide_activity_inactive ON MasterGuideActivityMonitor(inactive_status);
CREATE INDEX idx_role_permissions_team_role ON RolePermissions(team_id, role_level);
CREATE INDEX idx_enforcement_actions_user_id ON EnforcementActions(user_id);
CREATE INDEX idx_enforcement_actions_team_id ON EnforcementActions(team_id);

-- Trigger to check committee role level for enforcement actions
CREATE OR REPLACE FUNCTION check_committee_enforcement_authority()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure committee_role_level is not null and within the valid range
    IF NEW.committee_role_level IS NULL OR NEW.committee_role_level NOT BETWEEN 1 AND 4 THEN
        RAISE EXCEPTION 'Invalid committee_role_level: must be between 1 and 4';
    END IF;

    -- Check if the committee member has appropriate authority based on action type
    IF NEW.action_type = 'permanent_ban' OR NEW.action_type = 'team_dissolution' THEN
        IF NEW.committee_role_level > 1 THEN -- Only outdooer CEO (level 1) can permanently ban or dissolve teams
            RAISE EXCEPTION 'Only the outdooer CEO has authority to % users or teams', 
                           CASE WHEN NEW.action_type = 'permanent_ban' THEN 'permanently ban' 
                                ELSE 'dissolve' END;
        END IF;
    ELSIF NEW.action_type = 'temporary_suspension' AND NEW.committee_role_level > 2 THEN 
        -- Only Committee Chief (level 2) or CEO can issue temporary suspensions
        RAISE EXCEPTION 'Only Committee Chiefs or higher can issue temporary suspensions';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_enforcement_action
BEFORE INSERT ON EnforcementActions
FOR EACH ROW
EXECUTE FUNCTION check_committee_enforcement_authority();

-- Trigger to automatically create a TeamMetrics record for new teams
CREATE OR REPLACE FUNCTION initialize_team_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO TeamMetrics (
        team_id,
        current_reservation_count,
        reservation_limit,
        total_events_count,
        total_activities_count,
        total_expeditions_count,
        total_revenue,
        total_commission_paid,
        last_updated
    ) VALUES (
        NEW.team_id,
        0,
        100, -- Default 100 participant limit
        0,
        0,
        0,
        0,
        0,
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_team_creation_metrics
AFTER INSERT ON Teams
FOR EACH ROW
EXECUTE FUNCTION initialize_team_metrics();

-- Part 6: Guide Metrics and Ratings

-- Guide Metrics Table
CREATE TABLE GuideMetrics (
    metric_id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES Users(user_id) UNIQUE,
    total_activities_led INTEGER DEFAULT 0,
    total_expeditions_led INTEGER DEFAULT 0,
    total_participants_led INTEGER DEFAULT 0,
    activities_completed INTEGER DEFAULT 0,
    activities_canceled INTEGER DEFAULT 0,
    expeditions_completed INTEGER DEFAULT 0,
    expeditions_canceled INTEGER DEFAULT 0,
    total_rating_sum INTEGER DEFAULT 0,
    total_ratings_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) GENERATED ALWAYS AS (
        CASE WHEN total_ratings_count > 0 
             THEN total_rating_sum::DECIMAL / total_ratings_count 
             ELSE 0 
        END
    ) STORED,
    safety_incidents_count INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guide Ratings Table
CREATE TABLE GuideRatings (
    rating_id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES Users(user_id),
    reservation_id INTEGER REFERENCES Reservations(reservation_id),
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (activity_id IS NOT NULL OR expedition_id IS NOT NULL OR reservation_id IS NOT NULL)
);

-- Trigger to update guide metrics when an activity/expedition is updated
CREATE OR REPLACE FUNCTION update_guide_metrics_on_event_update()
RETURNS TRIGGER AS $$
BEGIN
    -- For this example, we'll focus on status changes
    -- This would be expanded with more specific business logic in production
    
    -- Handle activity status updates
    IF TG_TABLE_NAME = 'activities' AND NEW.activity_status != OLD.activity_status THEN
        IF NEW.activity_status = 'completed' THEN
            -- Increment completed activities count
            UPDATE GuideMetrics
            SET activities_completed = activities_completed + 1,
                total_activities_led = total_activities_led + 1,
                last_activity_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE guide_id = NEW.leader_id;
        ELSIF NEW.activity_status = 'canceled' AND OLD.activity_status != 'completed' THEN
            -- Increment canceled activities count
            UPDATE GuideMetrics
            SET activities_canceled = activities_canceled + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE guide_id = NEW.leader_id;
        END IF;
    
    -- Handle expedition status updates
    ELSIF TG_TABLE_NAME = 'expeditions' AND NEW.expedition_status != OLD.expedition_status THEN
        IF NEW.expedition_status = 'completed' THEN
            -- Increment completed expeditions count
            UPDATE GuideMetrics
            SET expeditions_completed = expeditions_completed + 1,
                total_expeditions_led = total_expeditions_led + 1, 
                last_activity_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE guide_id = NEW.leader_id;
        ELSIF NEW.expedition_status = 'canceled' AND OLD.expedition_status != 'completed' THEN
            -- Increment canceled expeditions count
            UPDATE GuideMetrics
            SET expeditions_canceled = expeditions_canceled + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE guide_id = NEW.leader_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activities and expeditions
CREATE TRIGGER after_activity_update
AFTER UPDATE OF activity_status ON Activities
FOR EACH ROW
EXECUTE FUNCTION update_guide_metrics_on_event_update();

CREATE TRIGGER after_expedition_update
AFTER UPDATE OF expedition_status ON Expeditions
FOR EACH ROW
EXECUTE FUNCTION update_guide_metrics_on_event_update();

-- Trigger to update guide metrics when a rating is added
CREATE OR REPLACE FUNCTION update_guide_metrics_on_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if guide record exists in metrics
    IF NOT EXISTS (SELECT 1 FROM GuideMetrics WHERE guide_id = NEW.guide_id) THEN
        -- Create a new metrics record for this guide
        INSERT INTO GuideMetrics (guide_id, total_rating_sum, total_ratings_count)
        VALUES (NEW.guide_id, NEW.rating, 1);
    ELSE
        -- Update the existing metrics record
        UPDATE GuideMetrics
        SET total_rating_sum = total_rating_sum + NEW.rating,
            total_ratings_count = total_ratings_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE guide_id = NEW.guide_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_guide_rating_insert
AFTER INSERT ON GuideRatings
FOR EACH ROW
EXECUTE FUNCTION update_guide_metrics_on_rating();

-- Create indexes for guide metrics and ratings
CREATE INDEX idx_guide_metrics_guide_id ON GuideMetrics(guide_id);
CREATE INDEX idx_guide_ratings_guide_id ON GuideRatings(guide_id);
CREATE INDEX idx_guide_ratings_reservation_id ON GuideRatings(reservation_id);
CREATE INDEX idx_guide_ratings_activity_id ON GuideRatings(activity_id);
CREATE INDEX idx_guide_ratings_expedition_id ON GuideRatings(expedition_id);

-- Part 7: Financial Calculation System

-- Guide Earnings
CREATE TABLE GuideEarnings (
    earning_id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES Users(user_id),
    team_id INTEGER REFERENCES Teams(team_id),
    payment_id INTEGER REFERENCES Payments(payment_id),
    reservation_id INTEGER REFERENCES Reservations(reservation_id),
    activity_id INTEGER REFERENCES Activities(activity_id) NULL,
    expedition_id INTEGER REFERENCES Expeditions(expedition_id) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    team_share_amount DECIMAL(10, 2) NOT NULL, -- Amount shared with team
    commission_amount DECIMAL(10, 2) NOT NULL, -- Platform commission
    earnings_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, disputed
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (activity_id IS NOT NULL OR expedition_id IS NOT NULL)
);

-- Team Revenue Sharing
CREATE TABLE TeamRevenueSharing (
    sharing_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(team_id),
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 4),
    percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    modified_by INTEGER REFERENCES Users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, role_level)
);

-- Trigger function to validate total percentage
CREATE OR REPLACE FUNCTION validate_team_revenue_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage DECIMAL(5, 2);
BEGIN
    SELECT COALESCE(SUM(percentage), 0) INTO total_percentage
    FROM TeamRevenueSharing
    WHERE team_id = NEW.team_id AND sharing_id != COALESCE(NEW.sharing_id, -1);

    IF total_percentage + NEW.percentage > 100.0 THEN
        RAISE EXCEPTION 'Total revenue sharing percentage for team % exceeds 100%%', NEW.team_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce validation
CREATE TRIGGER validate_team_revenue_percentage_trigger
BEFORE INSERT OR UPDATE ON TeamRevenueSharing
FOR EACH ROW
EXECUTE FUNCTION validate_team_revenue_percentage();

-- Guide Payouts
CREATE TABLE GuidePayouts (
    payout_id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES Users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- bank_transfer, paypal, etc.
    reference_number VARCHAR(255),
    status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
    notes TEXT,
    payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guide Payout Details
CREATE TABLE GuidePayoutDetails (
    detail_id SERIAL PRIMARY KEY,
    payout_id INTEGER REFERENCES GuidePayouts(payout_id),
    earning_id INTEGER REFERENCES GuideEarnings(earning_id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Earnings Summaries (for faster reporting)
CREATE TABLE EarningsSummaries (
    summary_id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES Users(user_id) NULL,
    team_id INTEGER REFERENCES Teams(team_id) NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_earnings DECIMAL(12, 2) NOT NULL,
    total_team_share DECIMAL(12, 2) NOT NULL,
    total_commission DECIMAL(12, 2) NOT NULL,
    activity_count INTEGER DEFAULT 0,
    expedition_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guide_id, team_id, year, month)
);

-- Trigger to calculate guide earnings when payment is made
CREATE OR REPLACE FUNCTION calculate_guide_earnings()
RETURNS TRIGGER AS $$
DECLARE
    reservation_record RECORD;
    guide_id INTEGER;
    team_id INTEGER;
    commission_rate DECIMAL(5, 2);
    team_share_percentage DECIMAL(5, 2) := 0.20; -- Default 20% to team
    guide_role_level INTEGER;
    payment_amount DECIMAL(10, 2);
    commission_amount DECIMAL(10, 2);
    guide_amount DECIMAL(10, 2);
    team_amount DECIMAL(10, 2);
BEGIN
    -- Only process completed payments
    IF NEW.payment_status = 'completed' THEN
        -- Get reservation details
        SELECT r.* INTO reservation_record
        FROM Reservations r
        WHERE r.reservation_id = NEW.reservation_id;
        
        -- Get guide and team information
        IF reservation_record.activity_id IS NOT NULL THEN
            SELECT a.leader_id, a.team_id INTO guide_id, team_id
            FROM Activities a
            WHERE a.activity_id = reservation_record.activity_id;
        ELSE
            SELECT e.leader_id, e.team_id INTO guide_id, team_id
            FROM Expeditions e
            WHERE e.expedition_id = reservation_record.expedition_id;
        END IF;
        
        -- Get guide's role level in the team
        SELECT role_level INTO guide_role_level
        FROM TeamMembers
        WHERE user_id = guide_id AND team_id = team_id;
        
        -- Get commission rate (standard 10% unless negotiated)
        SELECT COALESCE(custom_commission_rate, 10.0) INTO commission_rate
        FROM TeamMetrics
        WHERE team_id = team_id;
        
        payment_amount := NEW.amount;
        commission_amount := (payment_amount * commission_rate / 100);
        
        -- Calculate guide earnings
        guide_amount := payment_amount - commission_amount;
        team_amount := guide_amount * team_share_percentage;
        guide_amount := guide_amount - team_amount;
        
        -- Create guide earnings record
        INSERT INTO GuideEarnings (
            guide_id, 
            team_id, 
            payment_id, 
            reservation_id,
            activity_id,
            expedition_id,
            amount,
            team_share_amount,
            commission_amount,
            earnings_status,
            created_at
        ) VALUES (
            guide_id,
            team_id,
            NEW.payment_id,
            NEW.reservation_id,
            reservation_record.activity_id,
            reservation_record.expedition_id,
            guide_amount,
            team_amount,
            commission_amount,
            'pending',
            CURRENT_TIMESTAMP
        );
        
        -- Update team metrics
        UPDATE TeamMetrics
        SET total_revenue = total_revenue + payment_amount,
            total_commission_paid = total_commission_paid + commission_amount,
            last_updated = CURRENT_TIMESTAMP
        WHERE team_id = team_id;
        
        -- Distribute team share among team members according to role levels
        PERFORM distribute_team_revenue(team_id, team_amount, NEW.payment_id, NEW.reservation_id, 
                                       reservation_record.activity_id, reservation_record.expedition_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_insert_update
AFTER INSERT OR UPDATE OF payment_status ON Payments
FOR EACH ROW
EXECUTE FUNCTION calculate_guide_earnings();

-- Function to distribute team revenue share
CREATE OR REPLACE FUNCTION distribute_team_revenue(
    p_team_id INTEGER,
    p_team_amount DECIMAL(10, 2),
    p_payment_id INTEGER,
    p_reservation_id INTEGER,
    p_activity_id INTEGER,
    p_expedition_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    team_member_rec RECORD;
    total_percentage DECIMAL(5, 2) := 0;
    member_percentage DECIMAL(5, 2);
    member_amount DECIMAL(10, 2);
BEGIN
    -- Get total percentage to validate configuration
    SELECT SUM(percentage) INTO total_percentage
    FROM TeamRevenueSharing
    WHERE team_id = p_team_id;
    
    -- Check if percentages add up to 100%
    IF total_percentage <> 100.0 THEN
        RAISE EXCEPTION 'Team revenue sharing percentages do not add up to 100%% for team %', p_team_id;
    END IF;
    
    -- Distribute to each team member by role
    FOR team_member_rec IN (
        SELECT tm.user_id, tm.role_level, trs.percentage
        FROM TeamMembers tm
        JOIN TeamRevenueSharing trs ON tm.team_id = trs.team_id AND tm.role_level = trs.role_level
        WHERE tm.team_id = p_team_id
    )
    LOOP
        -- Calculate this member's portion
        member_percentage := team_member_rec.percentage;
        member_amount := (p_team_amount * member_percentage / 100);
        
        -- Create earnings record for this team member
        IF member_amount > 0 THEN
            INSERT INTO GuideEarnings (
                guide_id,
                team_id,
                payment_id,
                reservation_id,
                activity_id,
                expedition_id,
                amount,
                team_share_amount,
                commission_amount,
                earnings_status,
                created_at
            ) VALUES (
                team_member_rec.user_id,
                p_team_id,
                p_payment_id,
                p_reservation_id,
                p_activity_id,
                p_expedition_id,
                member_amount,
                0, -- No further team sharing
                0, -- Commission already taken
                'pending',
                CURRENT_TIMESTAMP
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize default team revenue sharing percentages
CREATE OR REPLACE FUNCTION initialize_team_revenue_sharing()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default revenue sharing percentages by role level
    INSERT INTO TeamRevenueSharing (team_id, role_level, percentage, modified_by)
    VALUES 
        (NEW.team_id, 1, 50.0, NEW.master_guide_id), -- Master Guide gets 50% of team share
        (NEW.team_id, 2, 30.0, NEW.master_guide_id), -- Tactical Guide gets 30% of team share
        (NEW.team_id, 3, 15.0, NEW.master_guide_id), -- Technical Guide gets 15% of team share
        (NEW.team_id, 4, 5.0, NEW.master_guide_id);  -- Base Guide gets 5% of team share
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_team_creation_revenue_sharing
AFTER INSERT ON Teams
FOR EACH ROW
EXECUTE FUNCTION initialize_team_revenue_sharing();

-- Function to update earnings summaries
CREATE OR REPLACE FUNCTION update_earnings_summary()
RETURNS TRIGGER AS $$
DECLARE
    year_val INTEGER;
    month_val INTEGER;
    participant_count_val INTEGER;
BEGIN
    year_val := EXTRACT(YEAR FROM NEW.created_at);
    month_val := EXTRACT(MONTH FROM NEW.created_at);
    
    -- Get the participant count from reservation
    SELECT participant_count INTO participant_count_val
    FROM Reservations 
    WHERE reservation_id = NEW.reservation_id;
    
    -- If no participants, default to 1
    IF participant_count_val IS NULL THEN
        participant_count_val := 1;
    END IF;
    
    -- Update guide summary
    INSERT INTO EarningsSummaries (
        guide_id,
        team_id,
        year,
        month,
        total_earnings,
        total_team_share,
        total_commission,
        activity_count,
        expedition_count,
        participant_count,
        created_at,
        updated_at
    ) VALUES (
        NEW.guide_id,
        NEW.team_id,
        year_val,
        month_val,
        NEW.amount,
        NEW.team_share_amount,
        NEW.commission_amount,
        CASE WHEN NEW.activity_id IS NOT NULL THEN 1 ELSE 0 END,
        CASE WHEN NEW.expedition_id IS NOT NULL THEN 1 ELSE 0 END,
        participant_count_val,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (guide_id, team_id, year, month)
    DO UPDATE SET
        total_earnings = EarningsSummaries.total_earnings + NEW.amount,
        total_team_share = EarningsSummaries.total_team_share + NEW.team_share_amount,
        total_commission = EarningsSummaries.total_commission + NEW.commission_amount,
        activity_count = EarningsSummaries.activity_count + 
                        CASE WHEN NEW.activity_id IS NOT NULL THEN 1 ELSE 0 END,
        expedition_count = EarningsSummaries.expedition_count + 
                          CASE WHEN NEW.expedition_id IS NOT NULL THEN 1 ELSE 0 END,
        participant_count = EarningsSummaries.participant_count + participant_count_val,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_guide_earnings_insert
AFTER INSERT ON GuideEarnings
FOR EACH ROW
EXECUTE FUNCTION update_earnings_summary();

-- Create indexes for financial tables
CREATE INDEX idx_guide_earnings_guide_id ON GuideEarnings(guide_id);
CREATE INDEX idx_guide_earnings_team_id ON GuideEarnings(team_id);
CREATE INDEX idx_guide_earnings_payment_id ON GuideEarnings(payment_id);
CREATE INDEX idx_guide_earnings_reservation_id ON GuideEarnings(reservation_id);
CREATE INDEX idx_guide_earnings_status ON GuideEarnings(earnings_status);

CREATE INDEX idx_team_revenue_sharing_team_id ON TeamRevenueSharing(team_id);
CREATE INDEX idx_guide_payouts_guide_id ON GuidePayouts(guide_id);
CREATE INDEX idx_guide_payouts_status ON GuidePayouts(status);
CREATE INDEX idx_guide_payout_details_payout_id ON GuidePayoutDetails(payout_id);
CREATE INDEX idx_guide_payout_details_earning_id ON GuidePayoutDetails(earning_id);
CREATE INDEX idx_earnings_summaries_guide_id ON EarningsSummaries(guide_id);
CREATE INDEX idx_earnings_summaries_team_id ON EarningsSummaries(team_id);
CREATE INDEX idx_earnings_summaries_year_month ON EarningsSummaries(year, month);
-- Add to your database migrations
CREATE INDEX idx_locations_search ON locations (location_name, country_code, region_code, formatted_address);
ALTER TABLE Activities 
ADD CONSTRAINT unique_activity_title_per_team 
UNIQUE (team_id, title);

CREATE OR REPLACE FUNCTION calculate_expedition_route()
RETURNS TRIGGER AS $$
DECLARE
    lat_lng_array TEXT := '[]';
    total_dist DECIMAL(8, 2) := 0;
    total_time DECIMAL(6, 2) := 0;
    loc_record RECORD;
    prev_lat DECIMAL(10, 8);
    prev_lng DECIMAL(11, 8);
    curr_lat DECIMAL(10, 8);
    curr_lng DECIMAL(11, 8);
    dist_km DECIMAL(8, 2);
    activity_recs CURSOR FOR
        SELECT a.activity_id, l.latitude, l.longitude, l.location_name
        FROM ExpeditionActivities ea
        JOIN Activities a ON ea.activity_id = a.activity_id
        JOIN Locations l ON a.location_id = l.location_id
        WHERE ea.expedition_id = NEW.expedition_id
        ORDER BY ea.sequence_order;
BEGIN
    -- Initialize variables for route calculation
    OPEN activity_recs;
    FETCH activity_recs INTO loc_record;
    
    -- Set first location as previous point
    IF FOUND THEN
        prev_lat := loc_record.latitude;
        prev_lng := loc_record.longitude;
        
        -- Start building the JSON array of coordinates
        lat_lng_array := '[' || 
            jsonb_build_object(
                'lat', prev_lat,
                'lng', prev_lng,
                'location', loc_record.location_name,
                'activity_id', loc_record.activity_id
            )::text;
    END IF;
    
    -- Loop through remaining locations
    LOOP
        FETCH activity_recs INTO loc_record;
        EXIT WHEN NOT FOUND;
        
        curr_lat := loc_record.latitude;
        curr_lng := loc_record.longitude;
        
        -- Calculate distance using Haversine formula (approximation)
        -- This is a simplified version - production would use PostGIS or more accurate calculation
        WITH haversine AS (
            SELECT 6371 * 2 * asin(
                sqrt(
                    sin(radians((curr_lat - prev_lat)/2))^2 + 
                    cos(radians(prev_lat)) * cos(radians(curr_lat)) * 
                    sin(radians((curr_lng - prev_lng)/2))^2
                )
            ) AS distance
        )
        SELECT distance INTO dist_km FROM haversine;
        
        -- Accumulate distance
        total_dist := total_dist + dist_km;
        
        -- Estimate travel time (very basic - 5km/h average walking speed)
        total_time := total_time + (dist_km / 5);
        
        -- Add this point to the array
        lat_lng_array := lat_lng_array || ', ' || 
            jsonb_build_object(
                'lat', curr_lat,
                'lng', curr_lng,
                'location', loc_record.location_name,
                'activity_id', loc_record.activity_id
            )::text;
        
        -- Set current point as previous for next iteration
        prev_lat := curr_lat;
        prev_lng := curr_lng;
    END LOOP;
    CLOSE activity_recs;
    
    -- Finalize the JSON array
    lat_lng_array := lat_lng_array || ']';
    
    -- Create or update the expedition route record
    IF EXISTS (SELECT 1 FROM ExpeditionRoutes WHERE expedition_id = NEW.expedition_id) THEN
        UPDATE ExpeditionRoutes
        SET 
            total_distance_km = total_dist,
            total_travel_time_hours = total_time,
            route_points = lat_lng_array,
            route_summary = 'Route through ' || (SELECT COUNT(*) FROM ExpeditionActivities WHERE expedition_id = NEW.expedition_id) || ' locations',
            last_calculated = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE expedition_id = NEW.expedition_id;
    ELSE
        INSERT INTO ExpeditionRoutes (
            expedition_id,
            total_distance_km,
            total_travel_time_hours,
            route_points,
            route_summary,
            last_calculated
        ) VALUES (
            NEW.expedition_id,
            total_dist,
            total_time,
            lat_lng_array,
            'Route through ' || (SELECT COUNT(*) FROM ExpeditionActivities WHERE expedition_id = NEW.expedition_id) || ' locations',
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_expedition_activity_insert_update
AFTER INSERT OR UPDATE ON ExpeditionActivities
FOR EACH ROW
EXECUTE FUNCTION calculate_expedition_route();

-- Trigger to update team status when Master Guide leaves
CREATE OR REPLACE FUNCTION dissolve_team_on_master_guide_leave()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role_level = 1 THEN -- If a Master Guide is leaving
        UPDATE Teams
        SET team_status = 'dissolved',
            updated_at = CURRENT_TIMESTAMP
        WHERE team_id = OLD.team_id;
        
        -- Set all team members' records to reflect the team dissolution
        DELETE FROM TeamMembers
        WHERE team_id = OLD.team_id;
        
        -- Log this significant event
        INSERT INTO AuditLogs (user_id, action_type, entity_type, entity_id, description)
        VALUES (OLD.user_id, 'dissolve', 'team', OLD.team_id, 'Team dissolved due to Master Guide departure');
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_team_member_delete
AFTER DELETE ON TeamMembers
FOR EACH ROW
EXECUTE FUNCTION dissolve_team_on_master_guide_leave();

-- Trigger to update team metrics when a new reservation is made
CREATE OR REPLACE FUNCTION update_team_metrics_after_reservation()
RETURNS TRIGGER AS $$
DECLARE
    team_id_var INTEGER;
    current_count INTEGER;
    team_limit INTEGER;
BEGIN
    -- Determine which team is affected
    IF NEW.activity_id IS NOT NULL THEN
        SELECT a.team_id INTO team_id_var
        FROM Activities a
        WHERE a.activity_id = NEW.activity_id;
    ELSIF NEW.expedition_id IS NOT NULL THEN
        SELECT e.team_id INTO team_id_var
        FROM Expeditions e
        WHERE e.expedition_id = NEW.expedition_id;
    END IF;
    
    -- Get current reservation count and limit
    SELECT current_reservation_count, reservation_limit 
    INTO current_count, team_limit
    FROM TeamMetrics
    WHERE team_id = team_id_var;
    
    -- Check if this reservation would exceed the team's limit
    IF current_count + NEW.participant_count > team_limit THEN
        RAISE EXCEPTION 'This reservation would exceed the team''s limit of % participants', team_limit;
    END IF;
    
    -- Update the metrics
    UPDATE TeamMetrics
    SET current_reservation_count = current_reservation_count + NEW.participant_count,
        last_updated = CURRENT_TIMESTAMP
    WHERE team_id = team_id_var;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_reservation_insert
BEFORE INSERT ON Reservations
FOR EACH ROW
EXECUTE FUNCTION update_team_metrics_after_reservation();

-- Trigger to monitor Master Guide inactivity
CREATE OR REPLACE FUNCTION monitor_master_guide_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the master guide activity monitor
    IF NEW.role_type = 'guide' THEN
        -- Check if this user is a Master Guide
        IF EXISTS (SELECT 1 FROM TeamMembers WHERE user_id = NEW.user_id AND role_level = 1) THEN
            -- Update last login timestamp
            UPDATE MasterGuideActivityMonitor
            SET last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE master_guide_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_login
AFTER UPDATE OF last_login ON Users
FOR EACH ROW
EXECUTE FUNCTION monitor_master_guide_activity();

-- Function to update user activity logs
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_activity_type VARCHAR(50),
    p_ip_address VARCHAR(45),
    p_user_agent TEXT,
    p_device_info TEXT DEFAULT NULL,
    p_location_data TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO UserActivityLogs (
        user_id,
        activity_type,
        ip_address,
        user_agent,
        device_info,
        location_data
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_ip_address,
        p_user_agent,
        p_device_info,
        p_location_data
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id INTEGER,
    p_action_type VARCHAR(50),
    p_entity_type VARCHAR(50),
    p_entity_id INTEGER,
    p_description TEXT,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO AuditLogs (
        user_id,
        action_type,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_description,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Create index for optimized route calculations
CREATE INDEX idx_expedition_activities_seq_expedition ON ExpeditionActivities(expedition_id, sequence_order);