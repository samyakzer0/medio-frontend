import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';

const STORE_DATA = {
  name: 'MedPlus Pharmacy',
  tagline: 'Your Neighborhood Health Partner',
  rating: 4.8,
  reviewCount: 342,
  responseTime: '~3 min',
  ordersCompleted: 2847,
  memberSince: 'Jan 2022',
  verified: true,
  address: 'Shop 12, Andheri West Market, DN Nagar, Andheri West, Mumbai — 400053',
  phone: '+91 98765 43210',
  email: 'medplus.andheri@medio.in',
  hours: { open: '08:00 AM', close: '10:00 PM' },
  deliveryRadius: '3 km',
  avgDelivery: '12 min',
  description: `MedPlus Pharmacy has been serving the Andheri West community since 2022. We are a licensed, government-verified pharmacy providing genuine medicines at competitive prices. Our team of certified pharmacists ensures accurate prescription fulfillment, and our Medio partnership guarantees ultra-fast delivery right to your doorstep.

We specialize in both prescription medications and over-the-counter health products, wellness supplements, personal care, and baby care essentials. Every order is double-checked by our pharmacist before dispatch.`,
};

const GALLERY_COLORS = [
  'linear-gradient(135deg, #e8f4fd 0%, #b8d4e8 100%)',
  'linear-gradient(135deg, #f0f4e8 0%, #c8d8b0 100%)',
  'linear-gradient(135deg, #f4e8f0 0%, #d8b0c8 100%)',
  'linear-gradient(135deg, #fdf8e8 0%, #e8d8b0 100%)',
  'linear-gradient(135deg, #e8f0fd 0%, #b0c8e8 100%)',
];

const GALLERY_LABELS = [
  { icon: 'storefront', label: 'Store Front' },
  { icon: 'medication', label: 'Medicine Racks' },
  { icon: 'vaccines', label: 'Cold Storage' },
  { icon: 'inventory', label: 'Stock Room' },
  { icon: 'local_shipping', label: 'Delivery Hub' },
];

const AMENITIES = [
  { icon: 'verified', label: 'Govt. Verified', desc: 'Licensed pharmacy' },
  { icon: 'medication', label: 'Rx Fulfillment', desc: 'Prescription medicines' },
  { icon: 'shopping_bag', label: 'OTC Products', desc: 'Over-the-counter' },
  { icon: 'ac_unit', label: 'Cold Chain', desc: 'Temperature-controlled' },
  { icon: 'bolt', label: 'Flash Delivery', desc: 'Under 15 minutes' },
  { icon: 'local_pharmacy', label: 'Pharmacist', desc: 'Expert consultation' },
  { icon: 'child_care', label: 'Baby Care', desc: 'Full range available' },
  { icon: 'spa', label: 'Wellness', desc: 'Supplements & vitamins' },
  { icon: 'accessibility', label: 'Accessible', desc: 'Wheelchair friendly' },
  { icon: 'credit_card', label: 'Digital Pay', desc: 'UPI, cards accepted' },
  { icon: 'schedule', label: 'Late Hours', desc: 'Open till 10 PM' },
  { icon: 'recycling', label: 'Eco-Friendly', desc: 'Paper packaging' },
];

const REVIEWS = [
  {
    name: 'Priya M.', avatar: 'P', rating: 5, date: '2 days ago',
    text: 'Incredibly fast delivery! Ordered my prescription at 3 PM and it was at my door by 3:12 PM. The pharmacist even called to confirm the dosage. Truly the best pharmacy experience.',
    helpful: 14,
  },
  {
    name: 'Rajan K.', avatar: 'R', rating: 5, date: '1 week ago',
    text: 'Always reliable. I have been using MedPlus for my monthly medications and they never disappoint. Genuine medicines, great packaging, and the staff is very knowledgeable.',
    helpful: 8,
  },
  {
    name: 'Anita S.', avatar: 'A', rating: 4, date: '2 weeks ago',
    text: 'Good pharmacy with wide stock. Sometimes the wait during peak hours (5-7 PM) can be slightly longer, but the quality and accuracy of prescriptions is always top-notch.',
    helpful: 6,
  },
  {
    name: 'Vikram P.', avatar: 'V', rating: 5, date: '3 weeks ago',
    text: 'The cold chain storage for insulin is a lifesaver. They maintain proper temperature and even send it in insulated packaging. Highly recommend for diabetic patients.',
    helpful: 11,
  },
];

const TEAM = [
  { name: 'Dr. Rakesh Agarwal', role: 'Owner & Head Pharmacist', initials: 'RA', color: 'var(--primary)' },
  { name: 'Sunita Deshpande', role: 'Senior Pharmacist', initials: 'SD', color: 'var(--secondary)' },
  { name: 'Amit Joshi', role: 'Inventory Manager', initials: 'AJ', color: 'var(--tertiary)' },
];

export default function PharmacyStoreScreen() {
  const navigate = useNavigate();
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState({});
  const galleryRef = useRef(null);

  const toggleHelpful = (idx) => {
    setHelpfulReviews(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderStars = (rating, size = 14) => (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className="material-symbols-outlined icon-fill" style={{
          fontSize: size,
          color: star <= rating ? '#FFB800' : 'var(--outline-variant)',
        }}>star</span>
      ))}
    </div>
  );

  const visibleAmenities = showAllAmenities ? AMENITIES : AMENITIES.slice(0, 6);

  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      {/* Floating back button */}
      <button
        onClick={() => navigate('/pharmacy')}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 60,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)', border: 'none',
          boxShadow: 'var(--shadow-lifted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--on-surface)' }}>arrow_back</span>
      </button>

      {/* Share button */}
      <button style={{
        position: 'fixed', top: 14, right: 14, zIndex: 60,
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)', border: 'none',
        boxShadow: 'var(--shadow-lifted)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface)' }}>share</span>
      </button>

      {/* Hero Gallery */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          ref={galleryRef}
          style={{
            display: 'flex', scrollSnapType: 'x mandatory',
            overflowX: 'auto', scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={(e) => {
            const idx = Math.round(e.target.scrollLeft / e.target.clientWidth);
            setActiveGalleryIdx(idx);
          }}
          /* Hide scrollbar */
          className="hide-scrollbar"
        >
          {GALLERY_COLORS.map((bg, i) => (
            <div key={i} style={{
              minWidth: '100%', height: 260, scrollSnapAlign: 'start',
              background: bg, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'rgba(255,255,255,0.6)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 36, color: 'var(--primary)' }}>
                  {GALLERY_LABELS[i].icon}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', opacity: 0.7 }}>
                {GALLERY_LABELS[i].label}
              </span>
            </div>
          ))}
        </div>

        {/* Gallery dots */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6,
        }}>
          {GALLERY_COLORS.map((_, i) => (
            <div key={i} style={{
              width: activeGalleryIdx === i ? 20 : 6, height: 6, borderRadius: 3,
              background: activeGalleryIdx === i ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Photo count badge */}
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-pill)',
          padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>photo_library</span>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{activeGalleryIdx + 1}/{GALLERY_COLORS.length}</span>
        </div>
      </div>

      <div className="screen-content" style={{ marginTop: -16 }}>
        {/* Main Info Section */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default', position: 'relative', zIndex: 1 }}>
          {/* Verified Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: 'var(--primary)' }}>verified</span>
            <span className="font-label-caps" style={{ fontSize: 10, color: 'var(--primary)' }}>MEDIO VERIFIED PARTNER</span>
          </div>

          <h1 className="font-hero-lg-mobile" style={{ marginBottom: 4 }}>{STORE_DATA.name}</h1>
          <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', marginBottom: 14 }}>{STORE_DATA.tagline}</p>

          {/* Rating & Stats Row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            paddingBottom: 16, borderBottom: '1px solid var(--border-hairline)', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: '#FFB800' }}>star</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{STORE_DATA.rating}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>({STORE_DATA.reviewCount} reviews)</span>
            </div>
            <span style={{ color: 'var(--border-hairline)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{STORE_DATA.ordersCompleted.toLocaleString()} orders</span>
            <span style={{ color: 'var(--border-hairline)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>Since {STORE_DATA.memberSince}</span>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { icon: 'bolt', label: 'Response', value: STORE_DATA.responseTime, color: 'var(--primary)' },
              { icon: 'local_shipping', label: 'Avg Delivery', value: STORE_DATA.avgDelivery, color: 'var(--secondary)' },
              { icon: 'explore', label: 'Radius', value: STORE_DATA.deliveryRadius, color: 'var(--tertiary)' },
            ].map(stat => (
              <div key={stat.label} style={{
                textAlign: 'center', padding: '12px 6px',
                background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)',
              }}>
                <span className="material-symbols-outlined icon-fill" style={{
                  fontSize: 22, color: stat.color, display: 'block', marginBottom: 4,
                }}>{stat.icon}</span>
                <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 1 }}>{stat.value}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 12 }}>About This Pharmacy</h2>
          <p className="font-body-sm" style={{
            color: 'var(--ink-secondary)', lineHeight: '22px',
            display: '-webkit-box',
            WebkitLineClamp: showFullDesc ? 999 : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{STORE_DATA.description}</p>
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            style={{
              background: 'none', border: 'none', color: 'var(--primary)',
              fontWeight: 600, fontSize: 13, marginTop: 8, padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {showFullDesc ? 'Show less' : 'Read more'}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {showFullDesc ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* What This Place Offers (Amenities) */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 16 }}>What This Place Offers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {visibleAmenities.map((amenity, i) => (
              <div key={amenity.label} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                animation: `fade-in 0.3s ease ${i * 0.04}s both`,
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 22, color: 'var(--on-surface-variant)',
                }}>{amenity.icon}</span>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 600, fontSize: 13 }}>{amenity.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>{amenity.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {AMENITIES.length > 6 && (
            <button
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              style={{
                width: '100%', marginTop: 12, padding: '10px 0',
                border: '1px solid var(--on-surface)', borderRadius: 'var(--radius-md)',
                background: 'transparent', fontWeight: 600, fontSize: 13,
                color: 'var(--on-surface)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 4,
              }}
            >
              {showAllAmenities ? 'Show less' : `Show all ${AMENITIES.length} amenities`}
            </button>
          )}
        </div>

        {/* Location & Hours */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 16 }}>Location & Hours</h2>

          {/* Map placeholder */}
          <div style={{
            height: 160, borderRadius: 'var(--radius-md)', marginBottom: 14,
            background: 'linear-gradient(135deg, #e3edf7 0%, #d0dce8 50%, #c5d5e5 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Map grid pattern */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.15,
              backgroundImage: 'linear-gradient(var(--outline) 1px, transparent 1px), linear-gradient(90deg, var(--outline) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />
            {/* Map pin */}
            <div style={{
              width: 40, height: 40, borderRadius: '50% 50% 50% 0',
              background: 'var(--primary)', transform: 'rotate(-45deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,81,223,0.35)',
              zIndex: 1, marginBottom: 8,
            }}>
              <span className="material-symbols-outlined icon-fill" style={{
                fontSize: 20, color: '#fff', transform: 'rotate(45deg)',
              }}>local_pharmacy</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 500, zIndex: 1 }}>Andheri West, Mumbai</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>location_on</span>
            <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', lineHeight: '20px' }}>{STORE_DATA.address}</p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: 'var(--secondary-container)',
            borderRadius: 'var(--radius-md)',
          }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 22, color: 'var(--on-secondary-container)' }}>schedule</span>
            <div>
              <p className="font-body-sm" style={{ fontWeight: 700, color: 'var(--on-secondary-container)' }}>Open Now</p>
              <p style={{ fontSize: 12, color: 'var(--on-secondary-container)', opacity: 0.8 }}>
                {STORE_DATA.hours.open} — {STORE_DATA.hours.close} · Mon to Sat
              </p>
            </div>
          </div>
        </div>

        {/* Meet the Team */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 16 }}>Meet the Team</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TEAM.map((member, i) => (
              <div key={member.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px', background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-md)',
                animation: `slide-up 0.3s ease ${i * 0.1}s both`,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${member.color}20`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${member.color}40`,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: member.color, fontFamily: 'Poppins, sans-serif' }}>{member.initials}</span>
                </div>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 700 }}>{member.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="font-card-title" style={{ fontSize: 16 }}>Reviews</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: '#FFB800' }}>star</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{STORE_DATA.rating}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>· {STORE_DATA.reviewCount}</span>
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={{ marginBottom: 20 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const pcts = { 5: 78, 4: 15, 3: 5, 2: 1, 1: 1 };
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-secondary)', width: 12, textAlign: 'right' }}>{star}</span>
                  <span className="material-symbols-outlined icon-fill" style={{ fontSize: 12, color: '#FFB800' }}>star</span>
                  <div style={{
                    flex: 1, height: 6, background: 'var(--surface-container)',
                    borderRadius: 3, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pcts[star]}%`, height: '100%',
                      background: '#FFB800', borderRadius: 3,
                      animation: `progress-fill 0.8s ease ${(5 - star) * 0.1}s both`,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-secondary)', width: 28 }}>{pcts[star]}%</span>
                </div>
              );
            })}
          </div>

          {/* Review Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REVIEWS.map((review, i) => (
              <div key={i} style={{
                paddingBottom: 16,
                borderBottom: i < REVIEWS.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                animation: `slide-up 0.3s ease ${i * 0.08}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--primary-fixed)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{review.avatar}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 13 }}>{review.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>{review.date}</p>
                  </div>
                  {renderStars(review.rating, 12)}
                </div>
                <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', lineHeight: '20px', fontSize: 13 }}>
                  {review.text}
                </p>
                <button
                  onClick={() => toggleHelpful(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, padding: '6px 12px',
                    border: helpfulReviews[i] ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-pill)', background: helpfulReviews[i] ? 'var(--primary-fixed)' : 'transparent',
                    fontSize: 12, color: helpfulReviews[i] ? 'var(--primary)' : 'var(--ink-secondary)',
                    fontWeight: 500, transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {helpfulReviews[i] ? 'thumb_up' : 'thumb_up_off_alt'}
                  </span>
                  Helpful ({review.helpful + (helpfulReviews[i] ? 1 : 0)})
                </button>
              </div>
            ))}
          </div>

          <button style={{
            width: '100%', marginTop: 8, padding: '12px 0',
            border: '1px solid var(--on-surface)', borderRadius: 'var(--radius-md)',
            background: 'transparent', fontWeight: 600, fontSize: 13,
            color: 'var(--on-surface)',
          }}>
            Show all {STORE_DATA.reviewCount} reviews
          </button>
        </div>

        {/* Contact Actions */}
        <div className="card" style={{ padding: 20, marginBottom: 16, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Get in Touch</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ flex: '1 1 80px', borderRadius: 'var(--radius-md)', minHeight: 44, padding: '0 8px', fontSize: 13, gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>call</span>
              Call
            </button>
            <button className="btn-secondary" style={{ flex: '1 1 80px', borderRadius: 'var(--radius-md)', minHeight: 44, padding: '0 8px', fontSize: 13, gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
              Email
            </button>
            <button className="btn-secondary" style={{ flex: '1 1 90px', borderRadius: 'var(--radius-md)', minHeight: 44, padding: '0 8px', fontSize: 13, gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>directions</span>
              Directions
            </button>
          </div>
        </div>

        {/* Policies */}
        <div className="card" style={{ padding: 20, marginBottom: 20, cursor: 'default' }}>
          <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Things to Know</h2>
          {[
            { title: 'Return Policy', desc: 'Returns accepted within 7 days for sealed products with receipt. Prescription items are non-returnable.', icon: 'undo' },
            { title: 'Prescription Required', desc: 'All Schedule H and H1 drugs require a valid prescription uploaded via the Medio app.', icon: 'description' },
            { title: 'Delivery Policy', desc: 'Free delivery on orders above ₹200. Temperature-sensitive items are delivered in insulated packaging.', icon: 'local_shipping' },
          ].map((policy, i) => (
            <div key={policy.title} style={{
              padding: '12px 0',
              borderBottom: i < 2 ? '1px solid var(--border-hairline)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>{policy.icon}</span>
                <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 13 }}>{policy.title}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: '18px', paddingLeft: 26 }}>{policy.desc}</p>
            </div>
          ))}
        </div>

        {/* Medio Partner badge */}
        <div style={{
          textAlign: 'center', padding: '24px 20px 30px',
          background: 'var(--primary-fixed)', borderRadius: 'var(--radius-card)',
          marginBottom: 20,
        }}>
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8, display: 'block' }}>verified</span>
          <p className="font-card-title" style={{ fontSize: 15, color: 'var(--primary)', marginBottom: 4 }}>Medio Verified Partner</p>
          <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--on-primary-fixed-variant)' }}>
            This pharmacy meets Medio's quality, safety, and speed standards
          </p>
        </div>
      </div>

      <BottomNav />

      {/* Inline style for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
