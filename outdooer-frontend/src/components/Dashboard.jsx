// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import OpenLayersMap from "./OpenLayersMap";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext);
    
    // State variables
    const [upcomingExpeditions, setUpcomingExpeditions] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedExpeditionId, setSelectedExpeditionId] = useState(null);
    
    // Format date helper function
    const formatDate = (dateString) => {
        try {
            const date = dateString instanceof Date ? dateString : new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Pending";
            }
            return date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (err) {
            return "Pending";
        }
    };

    // Fetch user data on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) {
                return;
            }
            
            setLoading(true);
            
            try {
                // In production, these would be actual API calls
                // Since your backend isn't currently connected, we'll use mock data
                
                // Mock upcoming expeditions
                const mockExpeditions = [
                    {
                        id: 1,
                        title: "Mount Everest Base Camp",
                        description: "A challenging trek to the base of the world's highest mountain",
                        start_date: new Date(2025, 5, 15),
                        end_date: new Date(2025, 5, 25),
                        status: "Confirmed",
                        location: {
                            latitude: 28.0025,
                            longitude: 86.8555,
                            name: "Everest Base Camp, Nepal"
                        },
                        price: 2500,
                        guide: "Alex Johnson"
                    },
                    {
                        id: 2,
                        title: "Grand Canyon Hike",
                        description: "Explore the breathtaking South Rim trail with expert guides",
                        start_date: new Date(2025, 6, 10),
                        end_date: new Date(2025, 6, 12),
                        status: "Pending",
                        location: {
                            latitude: 36.0544,
                            longitude: -112.2583,
                            name: "Grand Canyon National Park, AZ"
                        },
                        price: 799,
                        guide: "Maria Rodriguez"
                    },
                    {
                        id: 3,
                        title: "Machu Picchu Adventure",
                        description: "Historical Inca Trail journey to the ancient citadel",
                        start_date: new Date(2025, 7, 5),
                        end_date: new Date(2025, 7, 12),
                        status: "Confirmed",
                        location: {
                            latitude: -13.1631,
                            longitude: -72.5450,
                            name: "Machu Picchu, Peru"
                        },
                        price: 1800,
                        guide: "Carlos Vega"
                    }
                ];
                
                // Mock recent activities
                const mockActivities = [
                    {
                        id: 1,
                        name: "Rock Climbing Course",
                        description: "Learn basic to intermediate rock climbing techniques",
                        difficulty: "Intermediate",
                        location: "Red Rock Canyon, Nevada",
                        cost: 120,
                        duration: "6 hours"
                    },
                    {
                        id: 2,
                        name: "Whitewater Rafting",
                        description: "Thrilling rapids adventure on the Colorado River",
                        difficulty: "Advanced",
                        location: "Colorado River, Grand Canyon",
                        cost: 250,
                        duration: "Full day"
                    },
                    {
                        id: 3,
                        name: "Wilderness Survival Workshop",
                        description: "Essential outdoor survival skills and techniques",
                        difficulty: "Beginner",
                        location: "Yellowstone National Park",
                        cost: 95,
                        duration: "8 hours"
                    }
                ];
                
                setUpcomingExpeditions(mockExpeditions);
                setRecentActivities(mockActivities);
                
                // Set the first expedition as selected for the map
                if (mockExpeditions.length > 0) {
                    setSelectedExpeditionId(mockExpeditions[0].id);
                }
                
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [isAuthenticated]);

    return (
        <Container className="dashboard-container py-4">
            <h2 className="mb-4">Welcome, {user?.first_name || "Explorer"}!</h2>
            
            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading your adventure data...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <>
                    {/* Map and Upcoming Expeditions Row */}
                    <Row className="mb-4">
                        {/* Map */}
                        <Col lg={7} className="mb-4 mb-lg-0">
                            <Card className="shadow-sm h-100">
                                <Card.Header>
                                    <h5 className="m-0">Expedition Map</h5>
                                </Card.Header>
                                <Card.Body>
                                    {selectedExpeditionId && (
                                        <div className="mb-2">
                                            <strong>Selected Expedition: </strong>
                                            {upcomingExpeditions.find(exp => exp.id === selectedExpeditionId)?.title}
                                        </div>
                                    )}
                                    <div className="map-container" style={{ height: "400px", background: "#f8f9fa" }}>
                                        {/* This would be your actual map component */}
                                        <div className="h-100 d-flex justify-content-center align-items-center">
                                            {/* Replace with actual OpenLayersMap component when available */}
                                            <p className="text-muted">Interactive map will be displayed here</p>
                                            {/* 
                                            <OpenLayersMap 
                                                expeditionId={selectedExpeditionId} 
                                                defaultLat={upcomingExpeditions[0]?.location.latitude || -33.4489} 
                                                defaultLon={upcomingExpeditions[0]?.location.longitude || -70.6693} 
                                                defaultZoom={6} 
                                            />
                                            */}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        {/* Upcoming Expeditions */}
                        <Col lg={5}>
                            <Card className="shadow-sm h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="m-0">Upcoming Expeditions</h5>
                                    <Button 
                                        as={Link} 
                                        to="/expeditions" 
                                        variant="outline-primary" 
                                        size="sm"
                                    >
                                        View All
                                    </Button>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {upcomingExpeditions.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {upcomingExpeditions.map(expedition => (
                                                <div 
                                                    key={expedition.id} 
                                                    className={`list-group-item list-group-item-action ${selectedExpeditionId === expedition.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedExpeditionId(expedition.id)}
                                                >
                                                    <div className="d-flex w-100 justify-content-between">
                                                        <h6 className="mb-1">{expedition.title}</h6>
                                                        <Badge bg={
                                                            expedition.status === "Confirmed" ? "success" :
                                                            expedition.status === "Pending" ? "warning" : "secondary"
                                                        }>
                                                            {expedition.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="mb-1 text-truncate">{expedition.description}</p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small>
                                                            <i className="bi bi-calendar"></i> {formatDate(expedition.start_date)}
                                                        </small>
                                                        <small className="text-primary">${expedition.price}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4">
                                            <p>You don't have any upcoming expeditions.</p>
                                            <Button as={Link} to="/expeditions" variant="primary">
                                                Find Expeditions
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* Recent Activities Row */}
                    <Row>
                        <Col>
                            <Card className="shadow-sm">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="m-0">Available Activities</h5>
                                    <Button 
                                        as={Link} 
                                        to="/activities" 
                                        variant="outline-primary" 
                                        size="sm"
                                    >
                                        View All
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        {recentActivities.map(activity => (
                                            <Col md={4} key={activity.id} className="mb-3">
                                                <Card className="h-100 activity-card">
                                                    <Card.Body>
                                                        <h5 className="card-title">{activity.name}</h5>
                                                        <h6 className="card-subtitle mb-2 text-muted">
                                                            <i className="bi bi-geo-alt"></i> {activity.location}
                                                        </h6>
                                                        <p className="card-text">{activity.description}</p>
                                                        <div className="mt-auto pt-2 d-flex justify-content-between align-items-center">
                                                            <Badge bg={
                                                                activity.difficulty === "Beginner" ? "success" :
                                                                activity.difficulty === "Intermediate" ? "warning" : "danger"
                                                            }>
                                                                {activity.difficulty}
                                                            </Badge>
                                                            <span className="text-primary fw-bold">${activity.cost}</span>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default Dashboard;