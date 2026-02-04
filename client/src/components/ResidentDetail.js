// components/ResidentDetail.js
import React, { useState, useEffect } from 'react';
import { residentsAPI, recordsAPI } from '../services/api';
import axios from 'axios';

const ResidentDetail = ({ navigateTo, residentId }) => {
  const [resident, setResident] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // State for editing
  const [editingMedication, setEditingMedication] = useState(null);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showGuardianForm, setShowGuardianForm] = useState(false);

  // Form states
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    schedule: '',
    status: 'Active',
    start_date: new Date().toISOString().split('T')[0],
    prescribing_doctor: '',
    pharmacy: '',
    notes: ''
  });

  const [guardianForm, setGuardianForm] = useState({
    name: '',
    id_number: '',
    email: '',
    phone: '',
    relationship: '',
    address: '',
    is_primary: false
  });

  const [guardianErrors, setGuardianErrors] = useState({});

  useEffect(() => {
    if (residentId) {
      fetchResidentData();
    }
  }, [residentId]);

  const fetchResidentData = async () => {
    try {
      setIsLoading(true);
      const [residentData, recordsData] = await Promise.all([
        residentsAPI.getById(residentId),
        recordsAPI.getAll({ resident_id: residentId, date_from: getDateOneWeekAgo() })
      ]);
      setResident(residentData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching resident data:', error);
      alert('Gagal memuat data penghuni');
    } finally {
      setIsLoading(false);
    }
  };

  const getDateOneWeekAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return 'Nomor telepon wajib diisi';
    if (!phone.startsWith('0')) return 'Nomor telepon harus dimulai dengan 0';
    if (phone.length < 8) return 'Nomor telepon minimal 8 digit';
    if (!/^\d+$/.test(phone)) return 'Nomor telepon harus berupa angka';
    return '';
  };

  const validateIdNumber = (idNumber) => {
    if (idNumber && idNumber.trim() !== '') {
      if (idNumber.length !== 16) return 'Nomor KTP harus 16 digit';
      if (!/^\d+$/.test(idNumber)) return 'Nomor KTP harus berupa angka';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return 'Email tidak valid. Contoh: contoh@gmail.com';
    }
    return '';
  };

  // Medication Functions
  const handleAddMedication = () => {
    setEditingMedication(null);
    setMedicationForm({
      medication_name: '',
      dosage: '',
      schedule: '',
      status: 'Active',
      start_date: new Date().toISOString().split('T')[0],
      prescribing_doctor: '',
      pharmacy: '',
      notes: ''
    });
    setShowMedicationForm(true);
  };

  const handleEditMedication = (medication) => {
    setEditingMedication(medication);
    setMedicationForm({
      medication_name: medication.medication_name,
      dosage: medication.dosage || '',
      schedule: medication.schedule || '',
      status: medication.status || 'Active',
      start_date: medication.start_date || new Date().toISOString().split('T')[0],
      prescribing_doctor: medication.prescribing_doctor || '',
      pharmacy: medication.pharmacy || '',
      notes: medication.notes || ''
    });
    setShowMedicationForm(true);
  };

  const handleSaveMedication = async () => {
    try {
      if (!medicationForm.medication_name.trim()) {
        alert('Nama obat wajib diisi');
        return;
      }

      if (editingMedication) {
        // Update existing medication
        const response = await axios.put(
          `http://localhost:5000/api/medications/${editingMedication.id}`,
          medicationForm
        );

        if (response.data.success) {
          // Update local state
          setResident(prev => ({
            ...prev,
            medications: prev.medications.map(med =>
              med.id === editingMedication.id ? response.data.medication : med
            )
          }));

          alert(response.data.message);
          setShowMedicationForm(false);
          setEditingMedication(null);
        }
      } else {
        // Add new medication
        const response = await axios.post(
          `http://localhost:5000/api/residents/${residentId}/medications`,
          medicationForm
        );

        if (response.data.success) {
          // Update local state
          setResident(prev => ({
            ...prev,
            medications: [response.data.medication, ...prev.medications]
          }));

          alert(response.data.message);
          setShowMedicationForm(false);
        }
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Gagal menyimpan data obat');
    }
  };

  // Guardian Functions
  const handleAddGuardian = () => {
    setEditingGuardian(null);
    setGuardianForm({
      name: '',
      id_number: '',
      email: '',
      phone: '',
      relationship: '',
      address: '',
      is_primary: false
    });
    setGuardianErrors({});
    setShowGuardianForm(true);
  };

  const handleEditGuardian = (guardian) => {
    setEditingGuardian(guardian);
    setGuardianForm({
      name: guardian.name,
      id_number: guardian.id_number || '',
      email: guardian.email || '',
      phone: guardian.phone || '',
      relationship: guardian.relationship || '',
      address: guardian.address || '',
      is_primary: guardian.is_primary ? true : false
    });
    setGuardianErrors({});
    setShowGuardianForm(true);
  };

  const validateGuardianForm = () => {
    const errors = {};

    if (!guardianForm.name.trim()) {
      errors.name = 'Nama wali wajib diisi';
    }

    const phoneError = validatePhone(guardianForm.phone);
    if (phoneError) errors.phone = phoneError;

    const idError = validateIdNumber(guardianForm.id_number);
    if (idError) errors.id_number = idError;

    const emailError = validateEmail(guardianForm.email);
    if (emailError) errors.email = emailError;

    setGuardianErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveGuardian = async () => {
    if (!validateGuardianForm()) {
      return;
    }

    try {
      if (editingGuardian) {
        // Update existing guardian
        const response = await axios.put(
          `http://localhost:5000/api/guardians/${editingGuardian.id}`,
          guardianForm
        );

        if (response.data.success) {
          // Update local state
          setResident(prev => ({
            ...prev,
            guardians: prev.guardians.map(g =>
              g.id === editingGuardian.id ? response.data.guardian : g
            )
          }));

          alert(response.data.message);
          setShowGuardianForm(false);
          setEditingGuardian(null);
        }
      } else {
        // Add new guardian
        const response = await axios.post(
          `http://localhost:5000/api/residents/${residentId}/guardians`,
          guardianForm
        );

        if (response.data.success) {
          // Update local state
          setResident(prev => ({
            ...prev,
            guardians: [response.data.guardian, ...prev.guardians]
          }));

          alert(response.data.message);
          setShowGuardianForm(false);
        }
      }
    } catch (error) {
      console.error('Error saving guardian:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Gagal menyimpan data wali');
      }
    }
  };

  const getConditionBadgeClass = (condition) => {
    switch (condition) {
      case 'Sehat': return 'bg-success';
      case 'Cukup Sehat': return 'bg-warning text-dark';
      case 'Kurang Sehat': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Baik': return 'success';
      case 'Cukup Baik': return 'warning';
      case 'Kurang Baik': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Aktif': return 'bg-success';
      case 'Perlu Perhatian': return 'bg-warning text-dark';
      case 'Keluar': return 'bg-secondary';
      case 'Meninggal': return 'bg-dark';
      default: return 'bg-info';
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate type from gender
  const getTypeFromGender = (gender) => {
    return gender === 'male' ? 'Opa' : 'Oma';
  };

  if (isLoading) {
    return (
      <div className="page-wrapper text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Memuat data penghuni...</p>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="page-wrapper">
        <button className="btn btn-back" onClick={() => navigateTo('list')}>
          <i className="fas fa-arrow-left"></i> Kembali ke Daftar
        </button>
        <div className="text-center py-5">
          <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
          <h3>Data penghuni tidak ditemukan</h3>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigateTo('list')}
          >
            <i className="fas fa-arrow-left me-2"></i> Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <button className="btn btn-back" onClick={() => navigateTo('list')}>
        <i className="fas fa-arrow-left"></i> Kembali ke Daftar
      </button>

      {/* Medication Modal/Form */}
      {showMedicationForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h4>
                <i className="fas fa-pills me-2"></i>
                {editingMedication ? 'Edit Data Obat' : 'Tambah Data Obat'}
              </h4>
              <button 
                className="btn btn-close"
                onClick={() => {
                  setShowMedicationForm(false);
                  setEditingMedication(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nama Obat *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={medicationForm.medication_name}
                    onChange={(e) => setMedicationForm({...medicationForm, medication_name: e.target.value})}
                    placeholder="Contoh: Metformin 500mg, Insulin, Amlodipine 10mg"
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Dosis</label>
                  <input
                    type="text"
                    className="form-control"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                    placeholder="Contoh: 2x sehari, 1 tablet pagi"
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Waktu Konsumsi</label>
                  <input
                    type="text"
                    className="form-control"
                    value={medicationForm.schedule}
                    onChange={(e) => setMedicationForm({...medicationForm, schedule: e.target.value})}
                    placeholder="Contoh: Pagi (08:00) & Malam (20:00)"
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={medicationForm.status}
                    onChange={(e) => setMedicationForm({...medicationForm, status: e.target.value})}
                  >
                    <option value="Active">Aktif</option>
                    <option value="Completed">Selesai</option>
                    <option value="Stopped">Dihentikan</option>
                    <option value="Changed">Diganti</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="form-control"
                    value={medicationForm.start_date}
                    onChange={(e) => setMedicationForm({...medicationForm, start_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowMedicationForm(false);
                  setEditingMedication(null);
                }}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveMedication}
              >
                <i className="fas fa-save me-1"></i>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Modal/Form */}
      {showGuardianForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h4>
                <i className="fas fa-user-friends me-2"></i>
                {editingGuardian ? 'Edit Data Wali' : 'Tambah Data Wali'}
              </h4>
              <button 
                className="btn btn-close"
                onClick={() => {
                  setShowGuardianForm(false);
                  setEditingGuardian(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    className={`form-control ${guardianErrors.name ? 'is-invalid' : ''}`}
                    value={guardianForm.name}
                    onChange={(e) => setGuardianForm({...guardianForm, name: e.target.value})}
                    placeholder="Nama lengkap wali"
                  />
                  {guardianErrors.name && (
                    <div className="invalid-feedback">{guardianErrors.name}</div>
                  )}
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Nomor KTP</label>
                  <input
                    type="text"
                    className={`form-control ${guardianErrors.id_number ? 'is-invalid' : ''}`}
                    value={guardianForm.id_number}
                    onChange={(e) => setGuardianForm({...guardianForm, id_number: e.target.value})}
                    placeholder="16 digit nomor KTP (angka saja)"
                    maxLength="16"
                  />
                  {guardianErrors.id_number && (
                    <div className="invalid-feedback">{guardianErrors.id_number}</div>
                  )}
                  <small className="text-muted">Harus 16 digit angka. Kosongkan jika tidak ada.</small>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Nomor Telepon *</label>
                  <input
                    type="tel"
                    className={`form-control ${guardianErrors.phone ? 'is-invalid' : ''}`}
                    value={guardianForm.phone}
                    onChange={(e) => setGuardianForm({...guardianForm, phone: e.target.value})}
                    placeholder="081234567890"
                    minLength="8"
                    maxLength="15"
                  />
                  {guardianErrors.phone && (
                    <div className="invalid-feedback">{guardianErrors.phone}</div>
                  )}
                  <small className="text-muted">Harus dimulai dengan 0, minimal 8 digit angka.</small>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${guardianErrors.email ? 'is-invalid' : ''}`}
                    value={guardianForm.email}
                    onChange={(e) => setGuardianForm({...guardianForm, email: e.target.value})}
                    placeholder="contoh@gmail.com"
                  />
                  {guardianErrors.email && (
                    <div className="invalid-feedback">{guardianErrors.email}</div>
                  )}
                  <small className="text-muted">Format email yang valid: nama@domain.com</small>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Hubungan</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guardianForm.relationship}
                    onChange={(e) => setGuardianForm({...guardianForm, relationship: e.target.value})}
                    placeholder="Contoh: Anak, Saudara, Keponakan, Cucu"
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Alamat</label>
                  <textarea
                    className="form-control"
                    value={guardianForm.address}
                    onChange={(e) => setGuardianForm({...guardianForm, address: e.target.value})}
                    rows="2"
                    placeholder="Alamat lengkap wali"
                  />
                </div>
                
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isPrimary"
                      checked={guardianForm.is_primary}
                      onChange={(e) => setGuardianForm({...guardianForm, is_primary: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="isPrimary">
                      <strong>Wali Utama (Penanggung Jawab)</strong>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowGuardianForm(false);
                  setEditingGuardian(null);
                }}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveGuardian}
              >
                <i className="fas fa-save me-1"></i>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-header mb-4">
        {/* Photo Display */}
        {resident.photo_path ? (
          <div className="detail-photo">
            <img
              src={`http://localhost:5000${resident.photo_path}`}
              alt={resident.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/120?text=No+Image';
              }}
            />
          </div>
        ) : (
          <div className="detail-avatar">
            <i className={`fas fa-${resident.gender === 'male' ? 'male' : 'female'}`}></i>
          </div>
        )}

        <div>
          <h2 style={{ margin: 0, fontSize: '2.2rem' }}>{resident.name}</h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '1.1rem', opacity: 0.95 }}>
            {resident.gender === 'male' ? 'Opa' : 'Oma'} • {resident.age} Tahun • ID: {resident.resident_id}
          </p>
          <div className="mt-2">
            <span className={`badge ${getStatusBadgeClass(resident.status)} me-2`}>
              {resident.status}
            </span>
            <span className={`badge ${getConditionBadgeClass(resident.condition)}`}>
              {resident.condition}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {resident.audio_path && (
        <div className="form-section mb-4">
          <h5><i className="fas fa-volume-up"></i> Rekaman Suara</h5>
          <div className="audio-player">
            <audio controls style={{ width: '100%' }}>
              <source src={`http://localhost:5000${resident.audio_path}`} type="audio/wav" />
              Browser Anda tidak mendukung pemutar audio.
            </audio>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation mb-4">
        <div className="nav nav-tabs" id="residentTab" role="tablist">
          <button
            className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            type="button"
          >
            <i className="fas fa-user me-1"></i> Data Pribadi
          </button>
          <button
            className={`nav-link ${activeTab === 'guardians' ? 'active' : ''}`}
            onClick={() => setActiveTab('guardians')}
            type="button"
          >
            <i className="fas fa-user-friends me-1"></i> Data Wali
            {resident.guardians && resident.guardians.length > 0 && (
              <span className="badge bg-success ms-1">{resident.guardians.length}</span>
            )}
          </button>
          <button
            className={`nav-link ${activeTab === 'medications' ? 'active' : ''}`}
            onClick={() => setActiveTab('medications')}
            type="button"
          >
            <i className="fas fa-pills me-1"></i> Data Obat
            {resident.medications && resident.medications.length > 0 && (
              <span className="badge bg-warning ms-1">{resident.medications.length}</span>
            )}
          </button>
          <button
            className={`nav-link ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
            type="button"
          >
            <i className="fas fa-clipboard-list me-1"></i> Record Harian
            {records.length > 0 && (
              <span className="badge bg-primary ms-1">{records.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="tab-content">
          {/* Data Pribadi */}
          <div className="info-section">
            <h5><i className="fas fa-user"></i> Data Pribadi</h5>
            <div className="row">
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Nama Lengkap:</div>
                  <div className="info-value">{resident.name}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Usia:</div>
                  <div className="info-value">{resident.age} Tahun</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Tanggal Lahir:</div>
                  <div className="info-value">{formatDate(resident.birth_date)}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Tempat Lahir:</div>
                  <div className="info-value">{resident.birth_place || '-'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Jenis Kelamin:</div>
                  <div className="info-value">
                    {resident.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    <span className="badge bg-info ms-2">
                      {getTypeFromGender(resident.gender)}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Agama:</div>
                  <div className="info-value">{resident.religion || '-'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Tanggal Masuk:</div>
                  <div className="info-value">{formatDate(resident.join_date)}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Alamat Asal:</div>
                  <div className="info-value">{resident.address || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Kesehatan */}
          <div className="info-section">
            <h5><i className="fas fa-heartbeat"></i> Data Kesehatan</h5>
            <div className="row">
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Kondisi Umum:</div>
                  <div className="info-value">
                    <span className={`badge ${getConditionBadgeClass(resident.condition)}`}>
                      {resident.condition}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Riwayat Penyakit:</div>
                  <div className="info-value">{resident.medical_history || 'Tidak ada'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Alergi:</div>
                  <div className="info-value">{resident.allergies || 'Tidak ada'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Merokok:</div>
                  <div className="info-value">{resident.smoking || 'Tidak'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Minum Alkohol:</div>
                  <div className="info-value">{resident.alcohol || 'Tidak'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Kondisi Fungsional */}
          <div className="info-section">
            <h5><i className="fas fa-walking"></i> Kondisi Fungsional</h5>
            <div className="row">
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Kemampuan Berjalan:</div>
                  <div className="info-value">{resident.functional_walking || 'Mandiri'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Kemampuan Makan:</div>
                  <div className="info-value">{resident.functional_eating || 'Mandiri'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Kondisi Mental */}
          <div className="info-section">
            <h5><i className="fas fa-brain"></i> Kondisi Mental & Emosi</h5>
            <div className="row">
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Kondisi Emosi:</div>
                  <div className="info-value">{resident.mental_emotion || 'Stabil'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-row">
                  <div className="info-label">Tingkat Kesadaran:</div>
                  <div className="info-value">{resident.mental_consciousness || 'Compos Mentis'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="tab-content">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5><i className="fas fa-pills"></i> Data Obat</h5>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddMedication}
            >
              <i className="fas fa-plus me-1"></i> Tambah Obat
            </button>
          </div>

          {resident.medications && resident.medications.length > 0 ? (
            <div className="row">
              {resident.medications.map((medication, index) => (
                <div key={medication.id || index} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title mb-0">
                          <i className="fas fa-pills me-2 text-warning"></i>
                          {medication.medication_name}
                          <span className={`badge ${medication.status === 'Active' ? 'bg-success' : 'bg-secondary'} ms-2`}>
                            {medication.status === 'Active' ? 'Aktif' :
                              medication.status === 'Completed' ? 'Selesai' :
                                medication.status === 'Stopped' ? 'Dihentikan' : 'Diganti'}
                          </span>
                        </h5>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditMedication(medication)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>

                      <div className="info-section p-0 border-0 bg-transparent">
                        {medication.dosage && (
                          <div className="info-row">
                            <div className="info-label">Dosis:</div>
                            <div className="info-value">{medication.dosage}</div>
                          </div>
                        )}

                        {medication.schedule && (
                          <div className="info-row">
                            <div className="info-label">Waktu Konsumsi:</div>
                            <div className="info-value">{medication.schedule}</div>
                          </div>
                        )}

                        {medication.prescribing_doctor && (
                          <div className="info-row">
                            <div className="info-label">Dokter Peresep:</div>
                            <div className="info-value">{medication.prescribing_doctor}</div>
                          </div>
                        )}

                        {medication.start_date && (
                          <div className="info-row">
                            <div className="info-label">Tanggal Mulai:</div>
                            <div className="info-value">{formatDate(medication.start_date)}</div>
                          </div>
                        )}

                        {medication.notes && (
                          <div className="info-row">
                            <div className="info-label">Catatan:</div>
                            <div className="info-value">{medication.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-pills fa-4x text-muted mb-3"></i>
                <h4 className="text-muted">Belum ada data obat</h4>
                <p className="text-muted mb-4">
                  Data obat-obatan yang sedang dikonsumsi belum ditambahkan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="tab-content">
          {records.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
              <p className="text-muted">Belum ada record dalam 7 hari terakhir</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('record')}
              >
                <i className="fas fa-plus me-2"></i> Tambah Record
              </button>
            </div>
          ) : (
            <div className="record-list">
              {records.map(record => (
                <div className="record-card">
                  <div className="record-header">
                    <div className="record-date">
                      <i className="fas fa-calendar-day"></i> {formatDateTime(record.record_datetime)}
                    </div>
                    <span className={`badge`} style={{
                      backgroundColor: record.activity_color || '#007bff',
                      color: 'white'
                    }}>
                      {record.activity_name}
                    </span>
                  </div>
                  <h5 className="record-name">
                    {record.resident_name} ({record.resident_type})
                  </h5>
                  <div className="mb-2">
                    <span className={`badge bg-${getConditionColor(record.condition)} me-2`}>
                      {record.condition}
                    </span>
                  </div>
                  <p className="mb-0">{record.notes}</p>
                  {record.recorded_by && (
                    <div className="record-footer mt-2">
                      <small className="text-muted">
                        Dicatat oleh: {record.recorded_by}
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guardians Tab */}
      {activeTab === 'guardians' && (
        <div className="tab-content">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5><i className="fas fa-user-friends"></i> Data Wali</h5>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddGuardian}
            >
              <i className="fas fa-plus me-1"></i> Tambah Wali
            </button>
          </div>

          {resident.guardians && resident.guardians.length > 0 ? (
            <div className="row">
              {resident.guardians.map((guardian, index) => (
                <div key={guardian.id || guardian.name || index} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title mb-0">
                          <i className="fas fa-user-friends me-2 text-primary"></i>
                          {guardian.name}
                          {guardian.is_primary && (
                            <span className="badge bg-success ms-2">Utama</span>
                          )}
                        </h5>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditGuardian(guardian)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>

                      <div className="info-section">
                        {guardian.id_number && (
                          <div className="info-row">
                            <div className="info-label">No. KTP:</div>
                            <div className="info-value">{guardian.id_number}</div>
                          </div>
                        )}

                        <div className="info-row">
                          <div className="info-label">Hubungan:</div>
                          <div className="info-value">
                            {guardian.relationship || '-'}
                          </div>
                        </div>

                        {guardian.phone && (
                          <div className="info-row">
                            <div className="info-label">Telepon:</div>
                            <div className="info-value">
                              <a href={`tel:${guardian.phone}`} className="text-decoration-none">
                                <i className="fas fa-phone me-1"></i> {guardian.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {guardian.email && (
                          <div className="info-row">
                            <div className="info-label">Email:</div>
                            <div className="info-value">
                              <a href={`mailto:${guardian.email}`} className="text-decoration-none">
                                <i className="fas fa-envelope me-1"></i> {guardian.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {guardian.address && (
                          <div className="info-row">
                            <div className="info-label">Alamat:</div>
                            <div className="info-value">{guardian.address}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-user-friends fa-4x text-muted mb-3"></i>
                <h4 className="text-muted">Belum ada data wali</h4>
                <p className="text-muted mb-4">
                  Data wali atau penanggung jawab belum ditambahkan untuk penghuni ini.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="info-section">
        <h5><i className="fas fa-bed"></i> Informasi Ruangan</h5>
        {resident.room_id ? (
          <div className="row">
            <div className="col-md-6">
              <div className="info-row">
                <div className="info-label">Ruangan:</div>
                <div className="info-value">
                  {resident.room_name || 'Ruangan ' + resident.room_id}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-row">
                <div className="info-label">Tipe Ruangan:</div>
                <div className="info-value">
                  {resident.room_type === 'private' ? 'Pribadi' :
                    resident.room_type === 'shared' ? 'Bersama' : 'Khusus'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Penghuni belum ditugaskan ke ruangan tertentu
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentDetail;  