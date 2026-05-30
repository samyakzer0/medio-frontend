import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

export default function RxUploadScreen() {
  const navigate = useNavigate();
  const { submitOrder, showToast } = useApp();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('error', 'Please upload an image file (JPG, PNG)');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSubmit = async () => {
    if (!previewUrl || !selectedFile) {
      showToast('error', 'Please upload a prescription first');
      return;
    }
    
    setSubmitting(true);
    let rxUrl = previewUrl;

    try {
      // Check if credentials are placeholders
      const isPlaceholder = !supabase.supabaseUrl || supabase.supabaseUrl.includes('your-project-id');
      
      if (isPlaceholder) {
        console.warn('⚠️ Supabase credentials are placeholders in .env! Using local mock upload fallback.');
        // Simulate a network latency
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Prepare unique file path in bucket
        const fileExt = selectedFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_rx.${fileExt}`;
        
        console.log(`📤 Uploading prescription to Supabase bucket "prescriptions": ${fileName}`);
        const { data, error } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('prescriptions')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          rxUrl = urlData.publicUrl;
          console.log(`✅ Upload complete! Live prescription URL: ${rxUrl}`);
        }
      }

      // Submit the order
      await submitOrder({
        orderType: 'rx',
        rxImageUrl: rxUrl,
        notes: notes,
        otcItems: [
          { id: 'rx-1', name: 'Amoxicillin 500mg', detail: 'Capsules • Qty: 21', inStock: true, dosage: 'Twice daily after meals' },
          { id: 'rx-2', name: 'Fluticasone Propionate', detail: 'Nasal Spray • Qty: 1', inStock: true, dosage: 'Once daily, morning' },
        ],
        deliveryAddress: 'Flat 402, Sunshine Heights, DN Nagar, Andheri West',
      });
      
      showToast('success', 'Prescription submitted successfully!');
      navigate('/user/tracking');
    } catch (err) {
      console.error('❌ Supabase Upload Failed:', err);
      showToast('warning', 'Live upload failed. Submitting with local mock fallback.');
      
      // Fallback submission so the app keeps working
      await submitOrder({
        orderType: 'rx',
        rxImageUrl: previewUrl,
        notes: notes,
        otcItems: [
          { id: 'rx-1', name: 'Amoxicillin 500mg', detail: 'Capsules • Qty: 21', inStock: true, dosage: 'Twice daily after meals' },
          { id: 'rx-2', name: 'Fluticasone Propionate', detail: 'Nasal Spray • Qty: 1', inStock: true, dosage: 'Once daily, morning' },
        ],
        deliveryAddress: 'Flat 402, Sunshine Heights, DN Nagar, Andheri West',
      });
      navigate('/user/tracking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)',
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
      }}>
        <button onClick={() => navigate('/user')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--on-surface)', padding: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 className="font-card-title" style={{ fontSize: 18 }}>Upload Prescription</h1>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 24 }}>

          {/* Instructions */}
          <div style={{ background: 'var(--primary-fixed)', borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--primary)', fontSize: 20, flexShrink: 0, marginTop: 2 }}>info</span>
            <div>
              <p className="font-body-sm" style={{ color: 'var(--on-primary-fixed)', fontWeight: 600, marginBottom: 4 }}>For a valid prescription:</p>
              <ul className="font-body-sm" style={{ color: 'var(--on-primary-fixed-variant)', paddingLeft: 16, lineHeight: '22px' }}>
                <li>Must be signed by a licensed doctor</li>
                <li>Clearly visible doctor's name & stamp</li>
                <li>Dated within the last 30 days</li>
              </ul>
            </div>
          </div>

          {/* Upload Zone */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--outline-variant)'}`,
                borderRadius: 'var(--radius-card)',
                background: isDragging ? 'var(--primary-fixed)' : 'var(--canvas-white)',
                padding: '48px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                cursor: 'pointer',
                marginBottom: 24,
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {/* Corner frame guides */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <div key={pos} style={{
                  position: 'absolute',
                  width: 24, height: 24,
                  borderColor: 'var(--primary)', borderStyle: 'solid',
                  borderWidth: pos.includes('top') ? '2px 0 0 0' : '0 0 2px 0',
                  borderRightWidth: pos.includes('right') ? '2px' : 0,
                  borderLeftWidth: pos.includes('left') ? '2px' : 0,
                  ...(pos === 'top-left' ? { top: 20, left: 20 } :
                    pos === 'top-right' ? { top: 20, right: 20 } :
                    pos === 'bottom-left' ? { bottom: 20, left: 20 } :
                    { bottom: 20, right: 20 }),
                  opacity: isDragging ? 1 : 0.4,
                }} />
              ))}

              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>upload_file</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="font-body-lg" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>Tap to upload</p>
                <p className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>or drag & drop your prescription</p>
                <p className="font-body-sm" style={{ color: 'var(--outline)', fontSize: 12, marginTop: 4 }}>JPG, PNG · Max 10MB</p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="btn-primary" style={{ height: 44, padding: '0 20px', fontSize: 13, borderRadius: 'var(--radius-md)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_library</span>
                  Gallery
                </button>
                <button onClick={(e) => e.stopPropagation()}
                  className="btn-secondary" style={{ height: 44, padding: '0 20px', fontSize: 13, borderRadius: 'var(--radius-md)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>camera_alt</span>
                  Camera
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div className="card" style={{ overflow: 'hidden', borderRadius: 'var(--radius-card)', padding: 0 }}>
                <img src={previewUrl} alt="Prescription" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: 'var(--surface-container-low)' }} />
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--secondary)', fontSize: 20 }}>check_circle</span>
                    <span className="font-body-sm" style={{ fontWeight: 600 }}>Prescription uploaded</span>
                  </div>
                  <button onClick={() => setPreviewUrl(null)} style={{ background: 'none', border: 'none', color: 'var(--error)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label className="font-body-sm" style={{ color: 'var(--ink-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="E.g. Generic alternatives preferred, specific brand required…"
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-hairline)',
                background: 'var(--canvas-white)', color: 'var(--on-surface)',
                fontSize: 14, lineHeight: '20px', resize: 'none', height: 90,
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-hairline)'}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!previewUrl || submitting}
            className="btn-primary btn-pill"
            style={{ width: '100%', height: 56, fontSize: 16, marginBottom: 100 }}
          >
            {submitting ? (
              <><span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>progress_activity</span> Submitting…</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span> SUBMIT PRESCRIPTION</>
            )}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
