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

-- LocationFeatures (points of interest, dangers, facilities)
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

-- Outdoer Committee
CREATE TABLE CommitteeRoles (
    committee_role_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 4),
    appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
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

-- System Triggers for maintaining integrity

-- Trigger to monitor Master Guide inactivity
CREATE OR REPLACE FUNCTION monitor_master_guide_activity()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_login
AFTER UPDATE OF last_login ON Users
FOR EACH ROW
EXECUTE FUNCTION monitor_master_guide_activity();

-- Trigger to create default permissions when a team is created
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $
DECLARE
    permission_types TEXT[] := ARRAY[
        'create_activity', 'edit_activity', 'delete_activity', 
        'create_expedition', 'edit_expedition', 'delete_expedition',
        'approve_reservation', 'deny_reservation', 'manage_resource',
        'set_pricing', 'invite_user', 'manage_microsite',
        'approve_guide', 'assign_role', 'assign_leader'
    ];
    ptype TEXT;
    role_level INTEGER;
BEGIN
    -- For each role level
    FOR role_level IN 1..4 LOOP
        -- For each permission type
        FOREACH ptype IN ARRAY permission_types LOOP
            -- Default permission settings based on role hierarchy
            IF role_level = 1 THEN -- Master Guide
                INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                VALUES (NEW.team_id, role_level, ptype, TRUE, NEW.master_guide_id);
            ELSIF role_level = 2 THEN -- Tactical Guide
                -- Tactical Guides can't delete what Master Guides create
                IF ptype = 'delete_activity' OR ptype = 'delete_expedition' THEN
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, FALSE, NEW.master_guide_id);
                ELSE
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, TRUE, NEW.master_guide_id);
                END IF;
            ELSIF role_level = 3 THEN -- Technical Guide
                -- Set specific permissions for Technical Guides
                IF ptype IN ('create_expedition', 'edit_expedition', 'delete_expedition', 'set_pricing', 
                            'invite_user', 'manage_microsite', 'approve_guide', 'assign_role') THEN
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, FALSE, NEW.master_guide_id);
                ELSE
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, TRUE, NEW.master_guide_id);
                END IF;
            ELSE -- Base Guide
                -- Set specific permissions for Base Guides
                IF ptype IN ('create_activity', 'deny_reservation', 'assign_leader') THEN
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, TRUE, NEW.master_guide_id);
                ELSE
                    INSERT INTO RolePermissions (team_id, role_level, permission_type, is_enabled, modified_by)
                    VALUES (NEW.team_id, role_level, ptype, FALSE, NEW.master_guide_id);
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER after_team_creation
AFTER INSERT ON Teams
FOR EACH ROW
EXECUTE FUNCTION create_default_permissions();

-- Trigger to check committee role level for enforcement actions
CREATE OR REPLACE FUNCTION check_committee_enforcement_authority()
RETURNS TRIGGER AS $
BEGIN
    -- Check if the committee member has appropriate authority based on action type
    IF NEW.action_type = 'permanent_ban' OR NEW.action_type = 'team_dissolution' THEN
        IF NEW.committee_role_level > 1 THEN -- Only Outdoer CEO (level 1) can permanently ban or dissolve teams
            RAISE EXCEPTION 'Only the Outdoer CEO has authority to % users or teams', 
                           CASE WHEN NEW.action_type = 'permanent_ban' THEN 'permanently ban' 
                                ELSE 'dissolve' END;
        END IF;
    ELSIF NEW.action_type = 'temporary_suspension' AND NEW.committee_role_level > 2 THEN 
        -- Only Committee Chief (level 2) or CEO can issue temporary suspensions
        RAISE EXCEPTION 'Only Committee Chiefs or higher can issue temporary suspensions';
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER before_enforcement_action
BEFORE INSERT ON EnforcementActions
FOR EACH ROW
EXECUTE FUNCTION check_committee_enforcement_authority();

-- Trigger to check for master guide inactivity
CREATE OR REPLACE FUNCTION check_master_guide_inactivity()
RETURNS TRIGGER AS $
DECLARE
    inactivity_threshold_days INTEGER := 30; -- Define inactivity threshold
BEGIN
    -- Find inactive Master Guides (no login for 30+ days)
    INSERT INTO Communications (
        sender_id,
        recipient_id,
        message_type,
        subject,
        message_content
    )
    SELECT 
        (SELECT user_id FROM CommitteeRoles WHERE role_level = 1 LIMIT 1), -- CEO as sender
        mgam.master_guide_id,
        'warning',
        'Inactivity Warning',
        'You have been inactive for more than ' || inactivity_threshold_days || ' days. Please log in to maintain your Master Guide status.'
    FROM MasterGuideActivityMonitor mgam
    JOIN TeamMembers tm ON mgam.master_guide_id = tm.user_id AND tm.role_level = 1
    WHERE mgam.last_login < (CURRENT_TIMESTAMP - (inactivity_threshold_days || ' days')::INTERVAL)
    AND mgam.inactivity_warning_sent = FALSE;
    
    -- Update the warning flag
    UPDATE MasterGuideActivityMonitor
    SET inactivity_warning_sent = TRUE,
        inactivity_warning_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE last_login < (CURRENT_TIMESTAMP - (inactivity_threshold_days || ' days')::INTERVAL)
    AND inactivity_warning_sent = FALSE;
    
    -- Mark as inactive after warning + 15 more days of inactivity
    UPDATE MasterGuideActivityMonitor
    SET inactive_status = TRUE,
        inactive_since = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE inactivity_warning_sent = TRUE
    AND inactivity_warning_date < (CURRENT_TIMESTAMP - '15 days'::INTERVAL)
    AND last_login < inactivity_warning_date
    AND inactive_status = FALSE;
    
    -- Trigger team dissolution for inactive Master Guides
    INSERT INTO EnforcementActions (
        user_id,
        team_id,
        action_type,
        reason,
        committee_member_id,
        committee_role_level
    )
    SELECT 
        mgam.master_guide_id,
        tm.team_id,
        'team_dissolution',
        'Master Guide inactivity exceeding 45 days',
        (SELECT user_id FROM CommitteeRoles WHERE role_level = 1 LIMIT 1), -- CEO
        1 -- CEO role level
    FROM MasterGuideActivityMonitor mgam
    JOIN TeamMembers tm ON mgam.master_guide_id = tm.user_id AND tm.role_level = 1
    JOIN Teams t ON tm.team_id = t.team_id AND t.team_status = 'active'
    WHERE mgam.inactive_status = TRUE
    AND mgam.inactive_since < (CURRENT_TIMESTAMP - '15 days'::INTERVAL);
    
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER daily_inactivity_check
AFTER INSERT ON AuditLogs
FOR EACH STATEMENT
WHEN (EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = 0) -- Run once daily at midnight
EXECUTE FUNCTION check_master_guide_inactivity();

-- Trigger to update team metrics when a new reservation is made
CREATE OR REPLACE FUNCTION update_team_metrics_after_reservation()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql;

CREATE TRIGGER before_reservation_insert
BEFORE INSERT ON Reservations
FOR EACH ROW
EXECUTE FUNCTION update_team_metrics_after_reservation();

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

-- Indexes for performance optimization
CREATE INDEX idx_activities_team_id ON Activities(team_id);
CREATE INDEX idx_activities_leader_id ON Activities(leader_id);
CREATE INDEX idx_activities_location_id ON Activities(location_id);
CREATE INDEX idx_expeditions_team_id ON Expeditions(team_id);
CREATE INDEX idx_expeditions_leader_id ON Expeditions(leader_id);
CREATE INDEX idx_team_members_team_id ON TeamMembers(team_id);
CREATE INDEX idx_team_members_user_id ON TeamMembers(user_id);
CREATE INDEX idx_reservations_user_id ON Reservations(user_id);
CREATE INDEX idx_reservations_activity_id ON Reservations(activity_id);
CREATE INDEX idx_reservations_expedition_id ON Reservations(expedition_id);
CREATE INDEX idx_communications_recipient_id ON Communications(recipient_id);
CREATE INDEX idx_communications_team_id ON Communications(team_id);
CREATE INDEX idx_payments_reservation_id ON Payments(reservation_id);
CREATE INDEX idx_payments_transaction_id ON Payments(transaction_id);
CREATE INDEX idx_payment_disputes_payment_id ON PaymentDisputes(payment_id);
CREATE INDEX idx_payment_disputes_user_id ON PaymentDisputes(user_id);
CREATE INDEX idx_role_permissions_team_role ON RolePermissions(team_id, role_level);
CREATE INDEX idx_enforcement_actions_user_id ON EnforcementActions(user_id);
CREATE INDEX idx_enforcement_actions_team_id ON EnforcementActions(team_id);
CREATE INDEX idx_master_guide_activity_monitor_guide_id ON MasterGuideActivityMonitor(master_guide_id);
CREATE INDEX idx_master_guide_activity_inactive ON MasterGuideActivityMonitor(inactive_status);
CREATE INDEX idx_user_activity_logs_user_id ON UserActivityLogs(user_id);
CREATE INDEX idx_locations_lat_long ON Locations(latitude, longitude);
CREATE INDEX idx_locations_parent_id ON Locations(parent_location_id);
CREATE INDEX idx_locations_country_region ON Locations(country_code, region_code);
CREATE INDEX idx_expedition_activities_expedition_id ON ExpeditionActivities(expedition_id);
CREATE INDEX idx_expedition_activities_activity_id ON ExpeditionActivities(activity_id);
CREATE INDEX idx_expedition_activities_sequence ON ExpeditionActivities(sequence_order);
CREATE INDEX idx_expedition_routes_expedition_id ON ExpeditionRoutes(expedition_id);