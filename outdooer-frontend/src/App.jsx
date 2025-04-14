import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Router from './Router';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Router />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;