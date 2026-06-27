import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Clock, PenTool, FileText, Truck, User, Hash, RotateCcw, CheckCircle2, MapPin } from 'lucide-react';
import { createDelivery } from '../api';

export default function PodForm({ deliveries = [], triggerToast, onAddDelivery }) {
  const [consignmentNumber, setConsignmentNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryRemarks, setDeliveryRemarks] = useState('');
  const [photo, setPhoto] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  
  // Validation and submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedConsignment, setSubmittedConsignment] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');

  // Additional states for lookup, GPS, camera
  const [lastAutoFilled, setLastAutoFilled] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Effect to lookup and auto-fill details based on consignment number match
  useEffect(() => {
    const cleanNumber = (consignmentNumber || '').trim().toLowerCase();
    if (!cleanNumber || cleanNumber === lastAutoFilled.toLowerCase() || !deliveries || deliveries.length === 0) return;
    
    const matched = deliveries.find(d => 
      (d.consignment_no || d.consignment_number || '').trim().toLowerCase() === cleanNumber
    );
    
    if (matched) {
      setCustomerName(matched.customer_name || '');
      setPickupLocation(matched.pickup_location || '');
      setDeliveryLocation(matched.delivery_location || '');
      setDriverName(matched.driver_name || '');
      setVehicleNumber(matched.vehicle_number || '');
      setLastAutoFilled(matched.consignment_no || matched.consignment_number);
      if (triggerToast) {
        triggerToast('Shipment Found', `Auto-filled details for consignment ${matched.consignment_no || matched.consignment_number}.`, 'success');
      }
    }
  }, [consignmentNumber, deliveries, lastAutoFilled, triggerToast]);

  // Initialize form values on load
  useEffect(() => {
    resetFormState();
  }, []);

  // Format date-time for datetime-local input
  const getLocalISOTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const resetFormState = () => {
    setConsignmentNumber('');
    setCustomerName('');
    setReceiverName('');
    setPickupLocation('');
    setDeliveryLocation('');
    setDeliveryRemarks('');
    setPhoto(null);
    setDriverName('');
    setVehicleNumber('');
    setDeliveryTime(getLocalISOTime());
    clearSignature();
    setErrors({});
    setLastAutoFilled('');
    setGpsCoordinates('');
  };

  // GPS geolocation fetch
  const captureGps = () => {
    if (!navigator.geolocation) {
      if (triggerToast) triggerToast('GPS Error', 'Geolocation is not supported by your browser.', 'danger');
      return;
    }
    
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const coordsStr = `${lat}° N, ${lng}° E`;
        setGpsCoordinates(coordsStr);
        
        // Append to remarks
        setDeliveryRemarks(prev => {
          const cleanRemarks = prev.replace(/\n\[GPS Coordinates: [^\]]+\]/, '');
          return `${cleanRemarks}\n[GPS Coordinates: ${coordsStr}]`.trim();
        });
        
        setIsCapturingGps(false);
        if (triggerToast) triggerToast('GPS Captured', `Location resolved: ${coordsStr}`, 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsCapturingGps(false);
        // Fallback default coordinates for demonstration/testing
        const fallbackCoords = '12.971598° N, 77.594562° E';
        setGpsCoordinates(fallbackCoords);
        setDeliveryRemarks(prev => {
          const cleanRemarks = prev.replace(/\n\[GPS Coordinates: [^\]]+\]/, '');
          return `${cleanRemarks}\n[GPS Coordinates: ${fallbackCoords}]`.trim();
        });
        if (triggerToast) triggerToast('GPS Captured (Fallback)', `Mock location applied: ${fallbackCoords}`, 'info');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Camera Webcam actions
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      // Wait a tiny bit for the video node ref to link
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access failed:', err);
      if (triggerToast) triggerToast('Camera Error', 'Could not access webcam/camera.', 'danger');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPhoto(dataUrl);
    
    stopCamera();
    if (triggerToast) triggerToast('Snapshot Attached', 'Live photo snapshot attached successfully.', 'success');
  };

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0284c7'; // HK Shipping Ocean Blue
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [canvasRef.current]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignaturePreviewUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignaturePreviewUrl('');
  };

  const applyMockSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clearSignature();
    
    ctx.font = 'italic 28px "Outfit", cursive, sans-serif';
    ctx.fillStyle = '#0284c7';
    const name = receiverName || 'Receiver';
    ctx.fillText(name, 40, 80);
    
    ctx.beginPath();
    ctx.moveTo(35, 95);
    ctx.bezierCurveTo(70, 85, 140, 105, 220, 90);
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();
    
    setHasSignature(true);
    setSignaturePreviewUrl(canvas.toDataURL('image/png'));
  };

  // Image reading handler
  const processImageFile = (file) => {
    if (!file) return;
    
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      if (triggerToast) triggerToast('Format Error', 'Only JPG and PNG formats are supported.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      if (triggerToast) triggerToast('Photo Attached', 'Delivery photo loaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processImageFile(file);
  };

  // Submission Validation
  const validateForm = () => {
    const newErrors = {};
    if (!consignmentNumber || consignmentNumber.trim() === '') {
      newErrors.consignmentNumber = 'Consignment number is required.';
    }
    if (!customerName || customerName.trim() === '') {
      newErrors.customerName = 'Customer name is required.';
    }
    if (!receiverName || receiverName.trim() === '') {
      newErrors.receiverName = 'Receiver name is required.';
    }
    if (!pickupLocation || pickupLocation.trim() === '') {
      newErrors.pickupLocation = 'Pickup location is required.';
    }
    if (!deliveryLocation || deliveryLocation.trim() === '') {
      newErrors.deliveryLocation = 'Delivery location is required.';
    }
    if (!hasSignature) {
      newErrors.signature = 'Receiver signature is required.';
    }
    if (!photo) {
      newErrors.photo = 'Delivery photo is required.';
    }
    if (!deliveryTime) {
      newErrors.deliveryTime = 'Delivery time is required.';
    }
    
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      const errorMsg = Object.values(formErrors)[0] || 'Please complete all required fields.';
      if (triggerToast) triggerToast('Validation Alert', errorMsg, 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');

      const payload = {
        consignment_no: consignmentNumber.trim(),
        customer_name: customerName.trim(),
        receiver_name: receiverName.trim(),
        signature_image: signatureDataUrl,
        delivery_time: deliveryTime.replace('T', ' ') + ':00',
        pickup_location: pickupLocation.trim(),
        delivery_location: deliveryLocation.trim(),
        remarks: deliveryRemarks.trim() || null,
        photo: photo,
        driver_name: driverName.trim() || null,
        vehicle_number: vehicleNumber.trim() || null,
        status: 'Delivered',
        pod_status: 'Uploaded'
      };

      const result = await createDelivery(payload);
      
      setSubmittedConsignment(consignmentNumber);
      setSubmittedResult(result);
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('Submission Failed', err.message || 'An error occurred during submission.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-container">
      <div className="card pod-form-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>POD Upload Form</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Submit proof of delivery details for HK Shipping cargo consignments. Fields marked with <span style={{ color: 'var(--danger)' }}>*</span> are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Consignment Number & Customer Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={14} className="text-secondary" />
                <span>Consignment Number</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className={`form-input ${errors.consignmentNumber ? 'is-invalid' : ''}`}
                value={consignmentNumber}
                onChange={(e) => {
                  setConsignmentNumber(e.target.value);
                  if (errors.consignmentNumber) setErrors(prev => ({ ...prev, consignmentNumber: '' }));
                }}
                placeholder="e.g. HKS-802495"
                required
              />
              {errors.consignmentNumber && <span className="invalid-feedback">{errors.consignmentNumber}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} className="text-secondary" />
                <span>Customer Name</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className={`form-input ${errors.customerName ? 'is-invalid' : ''}`}
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
                }}
                placeholder="e.g. Nova Pharma Inc"
                required
              />
              {errors.customerName && <span className="invalid-feedback">{errors.customerName}</span>}
            </div>
          </div>

          {/* Row 2: Receiver Name & Driver Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} className="text-secondary" />
                <span>Receiver Name</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className={`form-input ${errors.receiverName ? 'is-invalid' : ''}`}
                value={receiverName}
                onChange={(e) => {
                  setReceiverName(e.target.value);
                  if (errors.receiverName) setErrors(prev => ({ ...prev, receiverName: '' }));
                }}
                placeholder="Name of receiver"
                required
              />
              {errors.receiverName && <span className="invalid-feedback">{errors.receiverName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} className="text-secondary" />
                <span>Driver Name</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Assign cargo courier"
              />
            </div>
          </div>

          {/* Row 3: Vehicle Number & Delivery Time */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={14} className="text-secondary" />
                <span>Vehicle Number</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-12-GQ-5524"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} className="text-secondary" />
                <span>Delivery Time</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="datetime-local" 
                className={`form-input ${errors.deliveryTime ? 'is-invalid' : ''}`}
                value={deliveryTime}
                onChange={(e) => {
                  setDeliveryTime(e.target.value);
                  if (errors.deliveryTime) setErrors(prev => ({ ...prev, deliveryTime: '' }));
                }}
                required
              />
              {errors.deliveryTime && <span className="invalid-feedback">{errors.deliveryTime}</span>}
            </div>
          </div>

          {/* Row 4: Pickup Location & Delivery Location with GPS Trigger */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} className="text-secondary" />
                <span>Pickup Location</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className={`form-input ${errors.pickupLocation ? 'is-invalid' : ''}`}
                value={pickupLocation}
                onChange={(e) => {
                  setPickupLocation(e.target.value);
                  if (errors.pickupLocation) setErrors(prev => ({ ...prev, pickupLocation: '' }));
                }}
                placeholder="e.g. Warehouse 4, Seattle, WA"
                required
              />
              {errors.pickupLocation && <span className="invalid-feedback">{errors.pickupLocation}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} className="text-secondary" />
                  <span>Delivery Location</span>
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={captureGps}
                  disabled={isCapturingGps}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', height: '24px' }}
                >
                  <MapPin size={12} className={isCapturingGps ? "animate-pulse" : ""} />
                  <span>{isCapturingGps ? "Capturing..." : "Capture GPS"}</span>
                </button>
              </label>
              <input 
                type="text" 
                className={`form-input ${errors.deliveryLocation ? 'is-invalid' : ''}`}
                value={deliveryLocation}
                onChange={(e) => {
                  setDeliveryLocation(e.target.value);
                  if (errors.deliveryLocation) setErrors(prev => ({ ...prev, deliveryLocation: '' }));
                }}
                placeholder="e.g. 890 Medical Plaza, Seattle, WA"
                required
              />
              {errors.deliveryLocation && <span className="invalid-feedback">{errors.deliveryLocation}</span>}
            </div>
          </div>

          {gpsCoordinates && (
            <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>GPS Captured: {gpsCoordinates} (appended to remarks)</span>
            </div>
          )}

          {/* Remarks Textarea */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={14} className="text-secondary" />
              <span>Delivery Remarks (Optional)</span>
            </label>
            <textarea 
              className="form-textarea" 
              rows="2"
              value={deliveryRemarks}
              onChange={(e) => setDeliveryRemarks(e.target.value)}
              placeholder="Provide dropoff notes, cargo damage notices, or other observer remarks..."
            />
          </div>

          {/* Drag & Drop Photo Upload and Signature Drawing */}
          <div className="form-row" style={{ marginTop: '1.5rem' }}>
            {/* Signature Draw Area */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PenTool size={14} className="text-secondary" />
                <span>Receiver Signature</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div 
                className={`signature-pad-container ${errors.signature ? 'border-danger' : ''}`}
                style={{ border: errors.signature ? '1px solid var(--danger)' : '1px solid var(--border-color)', borderRadius: '8px' }}
              >
                <canvas 
                  ref={canvasRef}
                  className="signature-canvas"
                  width="380"
                  height="160"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ display: 'block', width: '100%', height: '160px', backgroundColor: 'var(--bg-tertiary)' }}
                />
              </div>
              <div className="signature-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} 
                  onClick={applyMockSignature}
                >
                  Quick Sign
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: 'transparent', 
                    color: 'var(--danger)', 
                    border: '1px solid var(--danger)',
                    marginLeft: 'auto' 
                  }} 
                  onClick={clearSignature}
                >
                  Clear Signature
                </button>
              </div>
              {signaturePreviewUrl && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', border: '1px dashed var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Signature Preview:</span>
                  <img src={signaturePreviewUrl} alt="Signature Preview" style={{ maxHeight: '60px', objectFit: 'contain', display: 'block', backgroundColor: 'white', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
              )}
              {errors.signature && <span className="invalid-feedback" style={{ display: 'block', marginTop: '0.25rem' }}>{errors.signature}</span>}
            </div>

            {/* Photo Attachment (Drag & Drop / Camera Capture) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Upload size={14} className="text-secondary" />
                <span>Delivery Photo Proof</span>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              
              {!photo ? (
                <div 
                  className={`upload-zone ${isDragging ? 'dragging' : ''}`} 
                  onClick={() => document.getElementById('photo-drop-file').click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
                    backgroundColor: isDragging ? 'var(--primary-light)' : 'transparent',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Drag and drop photo here</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                    or click to browse files (JPG, PNG)
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); startCamera(); }}>
                      Live Camera
                    </button>
                  </div>
                  <input 
                    type="file" 
                    id="photo-drop-file" 
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }} 
                    onChange={handlePhotoChange}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div className="upload-preview" style={{ position: 'relative', display: 'inline-block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={photo} alt="Dropoff Proof" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', display: 'block' }} />
                    <button 
                      type="button" 
                      className="upload-preview-remove" 
                      onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => document.getElementById('photo-drop-file').click()}
                    >
                      Change Photo
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={startCamera}
                    >
                      Use Camera
                    </button>
                    <input 
                      type="file" 
                      id="photo-drop-file" 
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }} 
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>
              )}
              {errors.photo && <span className="invalid-feedback" style={{ display: 'block', marginTop: '0.25rem' }}>{errors.photo}</span>}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={resetFormState}
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={14} />
              <span>Reset Form</span>
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '150px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit POD'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Camera Snapshot Modal */}
      {showCameraModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Capture Dropoff Photo</h3>
            <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={takeSnapshot}>
                Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Popup */}
      {showSuccessPopup && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={56} style={{ color: 'var(--success)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>POD Submitted Successfully</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Proof of Delivery details for Consignment <strong>{submittedConsignment}</strong> have been recorded in the database.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => {
                setShowSuccessPopup(false);
                if (onAddDelivery && submittedResult) {
                  onAddDelivery(submittedResult);
                }
                resetFormState();
              }}
            >
              Okay, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
