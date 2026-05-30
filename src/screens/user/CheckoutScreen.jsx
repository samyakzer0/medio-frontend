import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

const PAYMENT_METHODS = [
  { id: 'upi', icon: 'phone_android', label: 'UPI / Google Pay', sub: 'Pay via any UPI app' },
  { id: 'card', icon: 'credit_card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'cod', icon: 'payments', label: 'Cash on Delivery', sub: 'Pay when delivered' },
];

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { state, dispatch, submitOrder, showToast } = useApp();
  const { cart } = state;
  const [address, setAddress] = useState('Flat 4B, Sea View Apartments, Andheri West, Mumbai 400053');
  const [payMethod, setPayMethod] = useState('upi');
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = subtotal > 200 ? 0 : 25;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (!address.trim()) { showToast('error', 'Please enter a delivery address'); return; }
    setPlacing(true);
    dispatch({ type: 'SET_ADDRESS', payload: address });
    setTimeout(async () => {
      await submitOrder({
        orderType: 'otc',
        otcItems: cart.map(i => ({ id: i.id, name: i.name, detail: `Qty: ${i.qty}`, inStock: true, dosage: 'As directed' })),
        deliveryAddress: address,
        totalPaise: total * 100,
        subtotalPaise: subtotal * 100,
        deliveryPaise: deliveryFee * 100,
      });
      dispatch({ type: 'CLEAR_CART' });
      navigate('/user/tracking');
    }, 900);
  };

  return (
    <div className="screen">
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <button onClick={() => navigate('/user/cart')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-card-title" style={{ fontSize: 18 }}>Checkout</h1>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>

          {/* Delivery Address */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--primary)' }}>location_on</span>
              <h2 className="font-card-title" style={{ fontSize: 16 }}>Delivery Address</h2>
            </div>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-hairline)',
                background: 'var(--canvas-white)', color: 'var(--on-surface)',
                fontSize: 14, lineHeight: '22px', resize: 'none', height: 88,
                fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-hairline)'}
            />
          </section>

          {/* Order Items Summary */}
          <section style={{ marginBottom: 20 }}>
            <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 12 }}>Your Items</h2>
            <div className="card" style={{ padding: '8px 0', cursor: 'default' }}>
              {cart.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: idx < cart.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                }}>
                  <div>
                    <p className="font-body-sm" style={{ fontWeight: 600 }}>{item.name}</p>
                    <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>Qty: {item.qty}</p>
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 14 }}>₹{item.price * item.qty}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Method */}
          <section style={{ marginBottom: 20 }}>
            <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 12 }}>Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setPayMethod(pm.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${payMethod === pm.id ? 'var(--primary)' : 'var(--border-hairline)'}`,
                    background: payMethod === pm.id ? 'var(--primary-fixed)' : 'var(--canvas-white)',
                    cursor: 'pointer', transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined icon-fill" style={{ fontSize: 24, color: payMethod === pm.id ? 'var(--primary)' : 'var(--outline)' }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p className="font-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{pm.label}</p>
                    <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>{pm.sub}</p>
                  </div>
                  {payMethod === pm.id && <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--primary)' }}>radio_button_checked</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Price Summary */}
          <div className="card" style={{ padding: 20, marginBottom: 24, cursor: 'default' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Subtotal</span>
                <span className="font-body-sm" style={{ fontWeight: 500 }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Delivery</span>
                <span className="font-body-sm" style={{ fontWeight: 500, color: deliveryFee === 0 ? 'var(--secondary)' : 'var(--on-surface)' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-hairline)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-body-lg" style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 22 }}>₹{total}</span>
              </div>
            </div>
          </div>

          {/* Place Order */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="btn-primary btn-pill"
            style={{ width: '100%', height: 56, fontSize: 16, marginBottom: 100 }}
          >
            {placing
              ? <><span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>progress_activity</span> Placing Order…</>
              : <><span className="material-symbols-outlined icon-fill" style={{ fontSize: 20 }}>bolt</span> Place Order · ₹{total}</>
            }
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
