import React, { useState } from 'react';
import PaymentModal from './PaymentModal';

const Dashboard = ({ data, onLogout, onRefresh }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { consumerInfo, currentBill } = data;
    const bill = currentBill;

    return (
        <div id="dashboard-container">
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            <h1>PowerBill India</h1>
                        </div>
                        <button id="logout-btn" className="btn btn-outline" onClick={onLogout}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    {/* Payment Alert */}
                    {bill.status === 'unpaid' && (
                        <div id="payment-alert" className="payment-alert">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <div className="alert-content">
                                <h3>Payment Due</h3>
                                <p>Your bill payment of ₹{bill.amount.toFixed(2)} is pending.</p>
                            </div>
                            <button className="btn btn-danger pay-now-btn" onClick={() => setShowPaymentModal(true)}>
                                Pay Now
                            </button>
                        </div>
                    )}

                    {/* Consumer Info + Bill Summary Card */}
                    <div className="card">
                        <div className="consumer-info">
                            <div className="info-section">
                                <h2>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="16" x2="12" y2="12"/>
                                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                                    </svg>
                                    Consumer Information
                                </h2>
                                <div className="info-grid">
                                    <div><p className="label">Consumer ID</p><p className="value">{consumerInfo.consumerId || 'N/A'}</p></div>
                                    <div><p className="label">Meter Number</p><p className="value">{consumerInfo.meterNumber || 'N/A'}</p></div>
                                    <div><p className="label">Supply Type</p><p className="value">{consumerInfo.supplyType || 'N/A'}</p></div>
                                    <div><p className="label">Sanctioned Load</p><p className="value">{consumerInfo.sanctionedLoad || 'N/A'}</p></div>
                                    <div><p className="label">Name</p><p className="value">{consumerInfo.name || 'N/A'}</p></div>
                                    <div><p className="label">Email</p><p className="value">{consumerInfo.email || 'N/A'}</p></div>
                                </div>
                            </div>
                            <div className="bill-summary">
                                <div className={`bill-card ${bill.status === 'unpaid' ? 'unpaid' : ''}`}>
                                    <div className="due-date">Due Date: {bill.dueDate}</div>
                                    <div className="amount">₹{bill.amount.toFixed(2)}</div>
                                    <p className="period">Bill Period: {bill.period}</p>
                                    {bill.status === 'unpaid' && (
                                        <button className="btn btn-danger pay-now-btn" onClick={() => setShowPaymentModal(true)}>
                                            Pay Now
                                        </button>
                                    )}
                                    {bill.status === 'paid' && (
                                        <span className="paid-badge">✓ Paid</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slab Charges & Bill Components */}
                    {bill.slabCharges && bill.slabCharges.length > 0 && (
                        <div className="dashboard-grid">
                            {/* Slab Charges */}
                            <div className="card">
                                <h2>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                    Energy Slab Charges
                                </h2>
                                <table className="slab-table">
                                    <thead>
                                        <tr>
                                            <th>Slab Range</th>
                                            <th>Rate (₹)</th>
                                            <th>Units</th>
                                            <th>Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bill.slabCharges.map((slab, i) => (
                                            <tr key={i}>
                                                <td>{slab.range}</td>
                                                <td>{slab.rate.toFixed(2)}</td>
                                                <td>{slab.units}</td>
                                                <td>{slab.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bill Components */}
                            <div className="card">
                                <h2>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23"/>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                    </svg>
                                    Bill Components
                                </h2>
                                <div className="components-list">
                                    <div className="component-row">
                                        <span>Energy Charges</span>
                                        <span>₹{bill.billComponents.energyCharges.toFixed(2)}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Fixed Charges</span>
                                        <span>₹{bill.billComponents.fixedCharges.toFixed(2)}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Fuel Surcharge</span>
                                        <span>₹{bill.billComponents.fuelSurcharge.toFixed(2)}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Tax / GST</span>
                                        <span>₹{bill.billComponents.taxGST.toFixed(2)}</span>
                                    </div>
                                    <div className="component-row subsidy">
                                        <span>Subsidy</span>
                                        <span>₹{bill.billComponents.subsidy.toFixed(2)}</span>
                                    </div>
                                    <div className="component-row total">
                                        <span>Net Amount</span>
                                        <span>₹{bill.billComponents.netAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Consumption History */}
                    {bill.consumptionHistory && bill.consumptionHistory.length > 0 && (
                        <div className="card">
                            <h2>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10"/>
                                    <line x1="12" y1="20" x2="12" y2="4"/>
                                    <line x1="6" y1="20" x2="6" y2="14"/>
                                </svg>
                                Consumption History
                            </h2>
                            <div className="consumption-chart">
                                {bill.consumptionHistory.map((item, i) => {
                                    const maxUnits = Math.max(...bill.consumptionHistory.map(h => h.units));
                                    const heightPct = maxUnits > 0 ? (item.units / maxUnits) * 100 : 0;
                                    return (
                                        <div className="chart-bar-group" key={i}>
                                            <span className="chart-value">{item.units}</span>
                                            <div className="chart-bar" style={{ height: `${Math.max(heightPct, 5)}%` }}></div>
                                            <span className="chart-label">{item.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    bill={bill}
                    consumerInfo={consumerInfo}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentSuccess={onRefresh}
                />
            )}
        </div>
    );
};

export default Dashboard;
