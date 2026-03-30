import React, { useState, useEffect, useCallback } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/dashboard`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setIsAuthenticated(false);
                    setDashboardData(null);
                }
                setLoading(false);
                return;
            }

            const data = await response.json();
            setDashboardData(data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial check: try to load dashboard (will fail with 401 if not logged in)
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleLoginSuccess = () => {
        setLoading(true);
        fetchDashboardData();
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setDashboardData(null);
        }
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    if (loading) {
        return (
            <div id="app">
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
                <div className="loading-screen">
                    <div className="spinner-large"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div id="app">
            {isAuthenticated && dashboardData ? (
                <Dashboard 
                    data={dashboardData} 
                    onLogout={handleLogout} 
                    onRefresh={handleRefresh}
                />
            ) : (
                <AuthPage onLoginSuccess={handleLoginSuccess} />
            )}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="logo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            <span>PowerBill India</span>
                        </div>
                        <div className="copyright">
                            © 2026 PowerBill India. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
