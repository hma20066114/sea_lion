import React, { useState, useEffect } from 'react'; // Combined import for React and hooks
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import ProductList from './components/ProductList';
import PurchaseOrderList from './components/PurchaseOrderList';
import PurchaseOrderDetail from './components/PurchaseOrderDetail';
import CreatePurchaseOrder from './components/CreatePurchaseOrder';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Check authentication status on initial load
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // In a real application, you'd want to validate this token with your backend
      // to ensure it's still active and not tampered with.
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <Router>
      <div style={styles.container}>
        <nav style={styles.navbar}>
          <Link to="/" style={styles.navLink}>Products</Link>
          <Link to="/orders" style={styles.navLink}>Purchase Orders</Link>
          <Link to="/orders/new" style={styles.navLink}>New Order</Link>
          {!isAuthenticated ? (
            <Link to="/login" style={styles.navLink}>Login</Link>
          ) : (
            <>
              <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
              <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </>
          )}
        </nav>

        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/orders" element={<PurchaseOrderList />} />
            {/* Protected Routes */}
            <Route
              path="/orders/new"
              element={isAuthenticated ? <CreatePurchaseOrder /> : <p style={styles.authMessage}>Please <Link to="/login">login</Link> to create an order.</p>}
            />
            <Route
              path="/orders/:id"
              element={isAuthenticated ? <PurchaseOrderDetail /> : <p style={styles.authMessage}>Please <Link to="/login">login</Link> to view order details.</p>}
            />
            {/* Authentication Routes */}
            <Route
              path="/login"
              element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />}
            />
            {/* Example Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <p style={styles.authMessage}>Please <Link to="/login">login</Link> to view the dashboard.</p>}
            />
            {/* You might want a Register route here too */}
            <Route path="/register" element={<p style={styles.authMessage}>Register component goes here.</p>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    padding: '10px 0',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    padding: '8px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#dc3545',
    fontWeight: 'bold',
    padding: '8px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
  },
  logoutButtonHover: {
    backgroundColor: '#f8d7da',
  },
  mainContent: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  authMessage: {
    textAlign: 'center',
    color: '#dc3545',
    marginTop: '50px',
    fontSize: '1.2em',
  }
};

export default App;



















// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
//
// function App() {
//   const [count, setCount] = useState(0)
//
//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
//
// export default App
