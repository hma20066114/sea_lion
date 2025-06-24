import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirection after login

function Login({ onLoginSuccess }) { // onLoginSuccess prop for external handling
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // To show loading state
  const navigate = useNavigate(); // Hook from react-router-dom for navigation

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors
    setLoading(true); // Set loading state

    try {
      const response = await fetch('http://127.0.0.1:8000/api/token/', { // Your DRF token endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json(); // Parse JSON response

      if (response.ok) {
        // Login successful
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        console.log('Login successful!', data);

        // Call the success handler if provided
        if (onLoginSuccess) {
          onLoginSuccess(true);
        }

        navigate('/dashboard'); // Redirect to a protected route or dashboard
      } else {
        // Login failed
        const errorMessage = data.detail || 'Invalid credentials. Please try again.';
        setError(errorMessage);
        console.error('Login failed:', data);
      }
    } catch (err) {
      // Network or other unexpected errors
      setError('A network error occurred. Please try again later.');
      console.error('Fetch error during login:', err);
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
            disabled={loading} // Disable input while loading
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            disabled={loading} // Disable input while loading
          />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={styles.registerLink}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
}

// Basic inline styles for demonstration
const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    backgroundColor: '#fff',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '25px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box', // Include padding in width
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  errorText: {
    color: '#dc3545',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  registerLink: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
  }
};

export default Login;