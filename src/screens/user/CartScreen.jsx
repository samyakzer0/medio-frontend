import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch, showToast } = useApp();
  const { cart } = state;

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = subtotal > 200 ? 0 : 25;
  const total = subtotal + deliveryFee;

  const updateQty = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
      showToast('success', 'Item removed');
    } else {
      dispatch({ type: 'UPDATE_QTY', payload: { id, qty: newQty } });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="screen">
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
          <button onClick={() => navigate('/user')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--on-surface)' }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-card-title" style={{ fontSize: 18 }}>My Cart</h1>
        </header>
        <main style={{ paddingTop: 68 }}>
          <div className="screen-content" style={{ paddingTop: 80, textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>shopping_bag</span>
            </div>
            <h2 className="font-heading-md" style={{ fontSize: 20, marginBottom: 8 }}>Your cart is empty</h2>
            <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', marginBottom: 32 }}>Browse our OTC products and add them here.</p>
            <button className="btn-primary btn-pill" onClick={() => navigate('/user')} style={{ height: 52 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
              Shop Now
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="screen">
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <button onClick={() => navigate('/user')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-card-title" style={{ fontSize: 18 }}>My Cart</h1>
        <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{cart.length} ITEMS</span>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>
          {/* Free delivery banner */}
          {deliveryFee > 0 && (
            <div style={{ background: 'var(--secondary-container)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: 'var(--secondary)' }}>local_shipping</span>
              <span className="font-body-sm" style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>
                Add ₹{200 - subtotal} more for <strong>FREE delivery</strong>
              </span>
            </div>
          )}

          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {cart.map((item) => (
              <div key={item.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'default' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--surface-container-low)', flexShrink: 0, overflow: 'hidden' }}>
                  {item.img && <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="font-body-sm" style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</p>
                  <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>₹{item.price}</p>
                </div>
                {/* Qty stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container-low)', borderRadius: 'var(--radius-pill)', padding: '4px 8px' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>remove</span>
                  </button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: 15 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, +1)} style={{ background: 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card" style={{ padding: 20, marginBottom: 24, cursor: 'default' }}>
            <h3 className="font-card-title" style={{ fontSize: 16, marginBottom: 16 }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SummaryRow label="Subtotal" value={`₹${subtotal}`} />
              <SummaryRow label="Delivery Fee" value={deliveryFee === 0 ? 'FREE 🎉' : `₹${deliveryFee}`} valueColor={deliveryFee === 0 ? 'var(--secondary)' : undefined} />
              <div style={{ height: 1, background: 'var(--border-hairline)', margin: '4px 0' }} />
              <SummaryRow label="Total" value={`₹${total}`} bold />
            </div>
          </div>

          {/* Proceed */}
          <button className="btn-primary btn-pill" style={{ width: '100%', height: 56, fontSize: 16, marginBottom: 100 }} onClick={() => navigate('/user/checkout')}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
            Proceed to Checkout
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function SummaryRow({ label, value, bold, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="font-body-sm" style={{ color: bold ? 'var(--on-surface)' : 'var(--ink-secondary)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span className="font-body-sm" style={{ fontWeight: bold ? 700 : 500, color: valueColor || (bold ? 'var(--primary)' : 'var(--on-surface)'), fontSize: bold ? 17 : 14 }}>{value}</span>
    </div>
  );
}
