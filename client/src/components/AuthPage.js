import React, { useState } from 'react';

// --- Regex Patterns (same as original script.js) ---
const REGEX = {
    name: /^[A-Za-z\s'-]{2,}$/,
    phone: /^[6-9]\d{9}$/,
    consumerId: /^[A-Za-z0-9-]{5,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /.{8,}/,
    meterNumber: /^[A-Za-z0-9-]{5,}$/
};

const API_URL = 'http://localhost:5000/api';

const AuthPage = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [formData, setFormData] = useState({
        name: '', phone: '', consumerId: '', email: '', password: '',
        meterNumber: '', supplyType: 'Domestic - 1 Phase', sanctionedLoad: '3 kW'
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!isLoginView) {
            if (!REGEX.name.test(formData.name.trim())) {
                newErrors.name = 'Please enter a valid full name.';
            }
            if (!REGEX.phone.test(formData.phone.trim())) {
                newErrors.phone = 'Enter a valid 10-digit mobile number.';
            }
            if (!REGEX.consumerId.test(formData.consumerId.trim())) {
                newErrors.consumerId = 'Enter a valid Consumer ID (min 5 chars).';
            }
            if (!REGEX.meterNumber.test(formData.meterNumber.trim())) {
                newErrors.meterNumber = 'Enter a valid Meter Number (min 5 chars).';
            }
        }

        if (!REGEX.email.test(formData.email.trim())) {
            newErrors.email = 'Please enter a valid email address.';
        }
        if (!REGEX.password.test(formData.password.trim())) {
            newErrors.password = 'Password must be at least 8 characters.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setApiError('');

        try {
            let endpoint, body;

            if (isLoginView) {
                endpoint = `${API_URL}/signin`;
                body = { email: formData.email, password: formData.password };
            } else {
                endpoint = `${API_URL}/signup`;
                body = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    consumerId: formData.consumerId,
                    meterNumber: formData.meterNumber,
                    supplyType: formData.supplyType,
                    sanctionedLoad: formData.sanctionedLoad
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!response.ok) {
                setApiError(result.message || 'An error occurred.');
                return;
            }

            // Both signin and signup now return a token cookie → go to dashboard
            onLoginSuccess();

        } catch (error) {
            setApiError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(prev => !prev);
        setErrors({});
        setApiError('');
        setFormData({
            name: '', phone: '', consumerId: '', email: '', password: '',
            meterNumber: '', supplyType: 'Domestic - 1 Phase', sanctionedLoad: '3 kW'
        });
    };

    return (
        <div id="auth-container">
            <header className="header">
                <div className="container">
                    <div className="logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        <h1>PowerBill India</h1>
                    </div>
                </div>
            </header>

            <main className="auth-main">
                <div className="auth-form-container">
                    <h2 id="auth-title">
                        {isLoginView ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <form id="auth-form" noValidate onSubmit={handleSubmit}>
                        {/* Signup Specific Fields */}
                        {!isLoginView && (
                            <div id="signup-fields">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <div className="input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input type="text" id="name" name="name" placeholder="Enter your full name"
                                            value={formData.name} onChange={handleChange}
                                            className={errors.name ? 'invalid-input' : ''} />
                                    </div>
                                    <span className={`error-message ${errors.name ? 'visible' : ''}`}>{errors.name || ''}</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <div className="input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        <input type="tel" id="phone" name="phone" placeholder="Enter your phone number"
                                            value={formData.phone} onChange={handleChange}
                                            className={errors.phone ? 'invalid-input' : ''} />
                                    </div>
                                    <span className={`error-message ${errors.phone ? 'visible' : ''}`}>{errors.phone || ''}</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="consumerId">Consumer ID</label>
                                    <div className="input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                        <input type="text" id="consumerId" name="consumerId" placeholder="Enter consumer number"
                                            value={formData.consumerId} onChange={handleChange}
                                            className={errors.consumerId ? 'invalid-input' : ''} />
                                    </div>
                                    <span className={`error-message ${errors.consumerId ? 'visible' : ''}`}>{errors.consumerId || ''}</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="meterNumber">Meter Number</label>
                                    <div className="input-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                        </svg>
                                        <input type="text" id="meterNumber" name="meterNumber" placeholder="Enter meter number"
                                            value={formData.meterNumber} onChange={handleChange}
                                            className={errors.meterNumber ? 'invalid-input' : ''} />
                                    </div>
                                    <span className={`error-message ${errors.meterNumber ? 'visible' : ''}`}>{errors.meterNumber || ''}</span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="supplyType">Supply Type</label>
                                        <div className="input-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                            </svg>
                                            <select id="supplyType" name="supplyType" value={formData.supplyType} onChange={handleChange}>
                                                <option value="Domestic - 1 Phase">Domestic - 1 Phase</option>
                                                <option value="Domestic - 3 Phase">Domestic - 3 Phase</option>
                                                <option value="Commercial">Commercial</option>
                                                <option value="Industrial">Industrial</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="sanctionedLoad">Sanctioned Load</label>
                                        <div className="input-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                            </svg>
                                            <select id="sanctionedLoad" name="sanctionedLoad" value={formData.sanctionedLoad} onChange={handleChange}>
                                                <option value="2 kW">2 kW</option>
                                                <option value="3 kW">3 kW</option>
                                                <option value="4 kW">4 kW</option>
                                                <option value="5 kW">5 kW</option>
                                                <option value="8 kW">8 kW</option>
                                                <option value="10 kW">10 kW</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <input type="email" id="email" name="email" placeholder="Enter your email"
                                    value={formData.email} onChange={handleChange}
                                    className={errors.email ? 'invalid-input' : ''} />
                            </div>
                            <span className={`error-message ${errors.email ? 'visible' : ''}`}>{errors.email || ''}</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" id="password" name="password" placeholder="Enter your password"
                                    value={formData.password} onChange={handleChange}
                                    className={errors.password ? 'invalid-input' : ''} />
                            </div>
                            <span className={`error-message ${errors.password ? 'visible' : ''}`}>{errors.password || ''}</span>
                        </div>

                        <p id="auth-error" className="auth-api-error">{apiError}</p>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <p className="auth-switch">
                        {isLoginView ? "Don't have an account? " : 'Already have an account? '}
                        <a href="#!" onClick={(e) => { e.preventDefault(); toggleView(); }}>
                            {isLoginView ? 'Sign up' : 'Sign in'}
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AuthPage;
