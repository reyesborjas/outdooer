// src/components/layout/Footer.jsx
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white py-5">
      <Container>
        <Row>
          <Col md={4} className="mb-4 mb-md-0">
            <h5>Outdooer</h5>
            <p className="text-muted">
              Connecting outdoor enthusiasts with certified guides for unforgettable adventures
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white">
                <FaFacebook size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white">
                <FaTwitter size={24} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white">
                <FaInstagram size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white">
                <FaYoutube size={24} />
              </a>
            </div>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h6>Explore</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/activities" className="text-muted">Activities</Link></li>
              <li className="mb-2"><Link to="/expeditions" className="text-muted">Expeditions</Link></li>
              <li className="mb-2"><Link to="/teams" className="text-muted">Guide Teams</Link></li>
              <li className="mb-2"><Link to="/locations" className="text-muted">Locations</Link></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h6>Company</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/about" className="text-muted">About Us</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-muted">Contact</Link></li>
              <li className="mb-2"><Link to="/careers" className="text-muted">Careers</Link></li>
              <li className="mb-2"><Link to="/blog" className="text-muted">Blog</Link></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h6>Support</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/help" className="text-muted">Help Center</Link></li>
              <li className="mb-2"><Link to="/safety" className="text-muted">Safety</Link></li>
              <li className="mb-2"><Link to="/terms" className="text-muted">Terms of Service</Link></li>
              <li className="mb-2"><Link to="/privacy" className="text-muted">Privacy Policy</Link></li>
            </ul>
          </Col>
          <Col md={2}>
            <h6>For Guides</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/become-guide" className="text-muted">Become a Guide</Link></li>
              <li className="mb-2"><Link to="/guide-resources" className="text-muted">Resources</Link></li>
              <li className="mb-2"><Link to="/community" className="text-muted">Community</Link></li>
              <li className="mb-2"><Link to="/partners" className="text-muted">Partners</Link></li>
            </ul>
          </Col>
        </Row>
        <hr className="my-4" />
        <div className="text-center text-muted">
          <small>© {currentYear} Outdooer. All rights reserved.</small>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;