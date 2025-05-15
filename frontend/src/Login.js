import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axiosInstance.post('/users/login', { email, password });
            const token = res.data.token;
            const user = res.data.user;  // user object from backend

            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('accessToken', token); // Assuming same token for other uses

            alert('Login successful!');
            navigate('/tasks');
        } catch (err) {
            console.error(err);
            alert('Login failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginSuccess = async (credentialResponse) => {
        try {
            const { credential } = credentialResponse;
            const res = await axiosInstance.post('/users/google-login', { token: credential });

            const backendToken = res.data.token;
            const user = res.data.user;

            localStorage.setItem('authToken', backendToken);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('accessToken', backendToken);

            alert('Google login successful!');
            navigate('/tasks');
        } catch (err) {
            console.error('Google Login Failed:', err);
            alert('Google login failed: ' + (err.response?.data || err.message));
        }
    };

    return (
        <div className="auth-container">
            <div className="form-card">
                <h2>Login to Your Account</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => alert('Google login failed')}
                    />
                </div>

                <p>
                    Don't have an account?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        style={{ cursor: 'pointer', color: 'blue' }}
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;
