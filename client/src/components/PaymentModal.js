import React, { useState, useCallback } from 'react';

const PaymentModal = ({ bill, consumerInfo, onClose, onPaymentSuccess }) => {
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    const openRazorpay = useCallback(async () => {
        setError('');
        setProcessing(true);

        try {
            // Step 1: Create order on backend
            const orderResponse = await fetch(`${API_URL}/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ billId: bill.id })
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                setError(orderData.message || 'Failed to create order.');
                setProcessing(false);
                return;
            }

            // Step 2: Open Razorpay Checkout directly
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'PowerBill India',
                description: 'Electricity Bill Payment',
                order_id: orderData.orderId,
                prefill: {
                    name: consumerInfo?.name || '',
                    email: consumerInfo?.email || '',
                    contact: consumerInfo?.phone || '',
                },
                theme: {
                    color: '#2563eb',
                },
                handler: async function (response) {
                    // Step 3: Verify payment on backend
                    try {
                        const verifyResponse = await fetch(`${API_URL}/payment/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                billId: bill.id,
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            setError(verifyData.message || 'Payment verification failed.');
                            setProcessing(false);
                            return;
                        }

                        setSuccess(verifyData);
                        setProcessing(false);
                    } catch (err) {
                        setError('Payment verification failed. Contact support.');
                        setProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                setError(`Payment failed: ${response.error.description}`);
                setProcessing(false);
            });

            rzp.open();

        } catch (err) {
            setError('Network error. Please try again.');
            setProcessing(false);
        }
    }, [bill, consumerInfo, API_URL]);

    // Auto-open Razorpay on mount (no intermediate screen)
    React.useEffect(() => {
        if (!success && !processing && !error) {
            openRazorpay();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDone = () => {
        onPaymentSuccess();
        onClose();
    };

    if (!bill || bill.status !== 'unpaid') return null;

    // Only show modal for success screen or error
    if (!success && !error) return null;

    return (
        <div className="modal-overlay" onClick={!success ? onClose : undefined}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="payment-success">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <h3>Payment Successful!</h3>
                        <div className="success-details">
                            <div className="detail-row">
                                <span>Transaction ID</span>
                                <strong>{success.transactionId}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Amount Paid</span>
                                <strong>₹{success.amount.toFixed(2)}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Payment Date</span>
                                <strong>{success.paymentDate}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Payment Via</span>
                                <strong>{success.paymentMethod}</strong>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={handleDone} style={{width: '100%', marginTop: '1.5rem'}}>
                            Done
                        </button>
                    </div>
                ) : error ? (
                    <div className="payment-error-screen">
                        <div className="modal-header">
                            <h3>Payment</h3>
                            <button className="modal-close" onClick={onClose}>×</button>
                        </div>
                        <p className="payment-error">{error}</p>
                        <button className="btn btn-primary" onClick={() => { setError(''); openRazorpay(); }} style={{width: '100%', marginTop: '1rem'}}>
                            Try Again
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default PaymentModal;
