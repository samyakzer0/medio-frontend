import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

const OTC_PRODUCTS = [
  { id: 'p1', name: 'Crocin Advance 500mg', brand: 'GSK', price: 32, originalPrice: 40, category: 'Fever', tag: '20% OFF', tagColor: 'var(--secondary)', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR8btYYeFuPP7LPgL0rYcRtxZ8iC1cOCFsrs95YKuruHpOrcFCg-2HHdukgGmd_XnwN0oLpMY13AV-HulvcDJEb6S_lD9wCUHWR0mK40mYNY1H_NkjZIY2DzCGEFCWg6WVbpZQ-_hbk5M-BdBmJGs0AZ8ESrbN_FzLXAXnDsipv1HDZupGYpsYazsffoVuW0F875VVnGpOEL0DtGt-PV2RDYR5GwSNH8C8ksz78fJM7aiJocJSGMIvFytoqDbxR9gHYGFh4YzqR58' },
  { id: 'p2', name: 'Dolo 650mg Tabs', brand: 'Micro Labs', price: 30, originalPrice: 30, category: 'Pain Relief', tag: 'BESTSELLER', tagColor: 'var(--primary)', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMp4tp0Mwig8mDKCvsDAK5DJASnUzdphbKnGMM61MJ3vLvFVNTPBkKV6zarhDFcZDvD8zImORMF2vmebbAV5XEQAsi1S_Rnav3QdWcV8Smv3zQtjrR3sPlx0PAdzAezxc11cvxUNTy2COnjhvCRoK8xPNtf0TtYvjdCNoEA1MLaNoy_RzaOhRcL1mrZsYuhztEnJbR7EQO46YgNF5jb2vQbiCMh4ZCED4XKdZUpyezQB9ibzXM8-264x1SmLfTZHETOU85iKIQ9X4' },
  { id: 'p3', name: 'Moov Pain Relief Cream', brand: 'Reckitt', price: 89, originalPrice: 99, category: 'Pain Relief', tag: '10% OFF', tagColor: 'var(--tertiary-container)', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR8btYYeFuPP7LPgL0rYcRtxZ8iC1cOCFsrs95YKuruHpOrcFCg-2HHdukgGmd_XnwN0oLpMY13AV-HulvcDJEb6S_lD9wCUHWR0mK40mYNY1H_NkjZIY2DzCGEFCWg6WVbpZQ-_hbk5M-BdBmJGs0AZ8ESrbN_FzLXAXnDsipv1HDZupGYpsYazsffoVuW0F875VVnGpOEL0DtGt-PV2RDYR5GwSNH8C8ksz78fJM7aiJocJSGMIvFytoqDbxR9gHYGFh4YzqR58' },
  { id: 'p4', name: 'Band-Aid Flexible Fabric', brand: 'J&J', price: 55, originalPrice: 60, category: 'First Aid', tag: 'NEW', tagColor: 'var(--error)', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMp4tp0Mwig8mDKCvsDAK5DJASnUzdphbKnGMM61MJ3vLvFVNTPBkKV6zarhDFcZDvD8zImORMF2vmebbAV5XEQAsi1S_Rnav3QdWcV8Smv3zQtjrR3sPlx0PAdzAezxc11cvxUNTy2COnjhvCRoK8xPNtf0TtYvjdCNoEA1MLaNoy_RzaOhRcL1mrZsYuhztEnJbR7EQO46YgNF5jb2vQbiCMh4ZCED4XKdZUpyezQB9ibzXM8-264x1SmLfTZHETOU85iKIQ9X4' },
];

const CATEGORIES = [
  { icon: 'thermostat', label: 'Fever', bg: 'var(--error-container)', color: 'var(--error)' },
  { icon: 'healing', label: 'Pain Relief', bg: 'var(--secondary-container)', color: 'var(--secondary)' },
  { icon: 'medical_services', label: 'First Aid', bg: 'var(--tertiary-fixed)', color: 'var(--tertiary)' },
  { icon: 'vital_signs', label: 'Vitamins', bg: 'var(--primary-fixed)', color: 'var(--primary)' },
  { icon: 'face', label: 'Skin Care', bg: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' },
  { icon: 'dentistry', label: 'Oral Care', bg: 'var(--surface-container)', color: 'var(--outline)' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { state, dispatch, showToast } = useApp();
  const [searchVal, setSearchVal] = useState('');

  const cartCount = state.cart.reduce((sum, i) => sum + i.qty, 0);

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
    showToast('success', `${product.name} added to cart!`);
  };

  return (
    <div className="screen">
      {/* ── Top AppBar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>medication</span>
          <span className="font-heading-md" style={{ color: 'var(--primary)', fontSize: 20 }}>Medio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/user/cart')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 24 }}>shopping_cart</span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--primary)', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>

          {/* ── Location greeting ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>location_on</span>
            <span className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Delivering to <strong style={{ color: 'var(--on-surface)' }}>Andheri West, Mumbai</strong></span>
          </div>

          {/* ── Greeting ── */}
          <h1 className="font-hero-lg-mobile" style={{ marginBottom: 20, color: 'var(--on-background)' }}>
            Your health,<br /><span style={{ color: 'var(--primary)' }}>delivered fast.</span>
          </h1>

          {/* ── Search Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--canvas-white)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-hairline)',
            boxShadow: 'var(--shadow-global)',
            padding: '0 20px',
            height: 54,
            marginBottom: 24,
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 22 }}>search</span>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate('/user/cart')}
              placeholder="Search OTC medicines, brands…"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 15, color: 'var(--on-surface)',
                outline: 'none',
              }}
            />
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>my_location</span>
          </div>

          {/* ── Prescription Hero Banner ── */}
          <div onClick={() => navigate('/user/rx-upload')} style={{
            position: 'relative',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
            padding: '28px 24px',
            marginBottom: 28,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,81,223,0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,81,223,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,81,223,0.3)'; }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6stmgudXfIhfWrelyQIBmVPdYNl39lIoXe8gcg2nfL0hqdVpR3NJ7-YNu6nyzSWLWUCQ6HqTEv9NvgFBMC5rC0YBpe8DKZkFzV7TlHuXu7q5DLOz5BfK7gF27JiwB0rBwQ3ULJikxKIs2CnyhbpeE4arf-zafVTtvKz6xfFus1DIL8A-srRhu-kkwdxRfp5s2V3OxvtB81QZQHDUqLF56isBmHtVEnqL_uRE10pDB0DfeOAHwrdcrvP9QrNJlXUCQRZnrAggNij4"
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge badge-primary" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: 12, display: 'inline-block' }}>Rx ORDER</span>
              <h2 className="font-hero-lg-mobile" style={{ color: '#fff', marginBottom: 8 }}>Order with Prescription</h2>
              <p className="font-body-sm" style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 20 }}>Upload your Rx and get it filled by a nearby pharmacy in minutes.</p>
              <button className="btn-primary btn-pill" style={{ background: '#fff', color: 'var(--primary)', display: 'inline-flex', boxShadow: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                UPLOAD PRESCRIPTION
              </button>
            </div>
          </div>

          {/* ── Quick Access Categories ── */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="font-heading-md" style={{ fontSize: 18 }}>Quick Access</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)' }} className="font-label-caps" onClick={() => navigate('/user/cart')}>VIEW ALL</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  onClick={() => navigate('/user/cart')}
                  style={{
                    background: 'var(--canvas-white)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--border-hairline)',
                    boxShadow: 'var(--shadow-global)',
                    padding: '16px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lifted)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-global)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: cat.color }}>{cat.icon}</span>
                  </div>
                  <span className="font-body-sm" style={{ fontWeight: 500, textAlign: 'center', fontSize: 12 }}>{cat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Trending OTC Products ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="font-heading-md" style={{ fontSize: 18 }}>Trending Now</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {OTC_PRODUCTS.map((product) => (
                <div key={product.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                  cursor: 'pointer',
                }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-container-low)' }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{product.name}</p>
                    <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>{product.brand}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="font-body-lg" style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 15 }}>₹{product.price}</span>
                      {product.price < product.originalPrice && (
                        <span style={{ fontSize: 12, color: 'var(--ink-secondary)', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
                      )}
                      <span className="badge" style={{ background: product.tagColor + '22', color: product.tagColor, fontSize: 10, padding: '2px 8px' }}>{product.tag}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: '1.5px solid var(--primary)',
                      background: 'transparent', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
