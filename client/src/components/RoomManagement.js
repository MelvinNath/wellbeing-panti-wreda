// components/RoomManagement.js
import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';

const RoomManagement = ({ navigateTo }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState(null);
  
  const [formData, setFormData] = useState({
    room_name: '',
    room_type: 'private',
    capacity: 1,
    notes: '',
    status: 'available'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomsAPI.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      alert('Gagal memuat data ruangan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, roomId) => {
    e.preventDefault();
    try {
      await roomsAPI.update(roomId, formData);
      alert('Ruangan berhasil diperbarui');
      
      setEditingRoomId(null);
      setFormData({
        room_name: '',
        room_type: 'private',
        capacity: 1,
        notes: '',
        status: 'available'
      });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.error || 'Gagal menyimpan ruangan');
    }
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    try {
      await roomsAPI.create(formData);
      alert('Ruangan berhasil ditambahkan');
      
      setFormData({
        room_name: '',
        room_type: 'private',
        capacity: 1,
        notes: '',
        status: 'available'
      });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.error || 'Gagal menyimpan ruangan');
    }
  };

  const handleEdit = (room) => {
    setEditingRoomId(room.id);
    setFormData({
      room_name: room.room_name,
      room_type: room.room_type,
      capacity: room.capacity,
      notes: room.notes || '',
      status: room.status
    });
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setFormData({
      room_name: '',
      room_type: 'private',
      capacity: 1,
      notes: '',
      status: 'available'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
      return;
    }

    try {
      await roomsAPI.delete(id);
      alert('Ruangan berhasil dihapus');
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(error.error || 'Gagal menghapus ruangan');
    }
  };

  const getRoomTypeLabel = (type) => {
    const types = {
      'private': 'Pribadi',
      'shared': 'Bersama',
      'special': 'Khusus'
    };
    return types[type] || type;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'available': return 'bg-success';
      case 'occupied': return 'bg-primary';
      case 'maintenance': return 'bg-warning text-dark';
      case 'reserved': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'available': 'Tersedia',
      'occupied': 'Terisi',
      'maintenance': 'Perbaikan',
      'reserved': 'Dipesan'
    };
    return labels[status] || status;
  };

  return (
    <div className="page-wrapper">
      <button className="btn btn-back" onClick={() => navigateTo('dashboard')}>
        <i className="fas fa-arrow-left"></i> Kembali
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">
          <i className="fas fa-bed"></i>
          Manajemen Ruangan
        </h2>
      </div>

      {/* Add New Room Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-plus me-2"></i>
            Tambah Ruangan Baru
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddNew}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nama Ruangan *</label>
                <input
                  type="text"
                  className="form-control"
                  name="room_name"
                  value={formData.room_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tipe Ruangan *</label>
                <select
                  className="form-select"
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleChange}
                  required
                >
                  <option value="private">Pribadi</option>
                  <option value="shared">Bersama</option>
                  <option value="special">Khusus</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Kapasitas *</label>
                <input
                  type="number"
                  className="form-control"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="available">Tersedia</option>
                  <option value="occupied">Terisi</option>
                  <option value="maintenance">Perbaikan</option>
                  <option value="reserved">Dipesan</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Catatan</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                />
              </div>
              <div className="col-12">
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-1"></i> Simpan
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFormData({
                      room_name: '',
                      room_type: 'private',
                      capacity: 1,
                      notes: '',
                      status: 'available'
                    })}
                  >
                    <i className="fas fa-broom me-1"></i> Bersihkan
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Memuat data ruangan...</p>
        </div>
      ) : (
        <div className="row">
          {rooms.map(room => (
            <div key={room.id} className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  {editingRoomId === room.id ? (
                    // EDIT FORM ON CARD
                    <div className="edit-form">
                      <h5 className="card-title mb-3">
                        <i className="fas fa-edit me-2"></i>
                        Edit Ruangan
                      </h5>
                      <form onSubmit={(e) => handleSubmit(e, room.id)}>
                        <div className="row g-3">
                          <div className="col-md-12">
                            <label className="form-label">Nama Ruangan</label>
                            <input
                              type="text"
                              className="form-control"
                              name="room_name"
                              value={formData.room_name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Tipe Ruangan</label>
                            <select
                              className="form-select"
                              name="room_type"
                              value={formData.room_type}
                              onChange={handleChange}
                              required
                            >
                              <option value="private">Pribadi</option>
                              <option value="shared">Bersama</option>
                              <option value="special">Khusus</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Kapasitas</label>
                            <input
                              type="number"
                              className="form-control"
                              name="capacity"
                              value={formData.capacity}
                              onChange={handleChange}
                              min="1"
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Status</label>
                            <select
                              className="form-select"
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                            >
                              <option value="available">Tersedia</option>
                              <option value="occupied">Terisi</option>
                              <option value="maintenance">Perbaikan</option>
                              <option value="reserved">Dipesan</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Terisi</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={`${room.current_occupants} orang`}
                              disabled
                              readOnly
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Catatan</label>
                            <textarea
                              className="form-control"
                              name="notes"
                              value={formData.notes}
                              onChange={handleChange}
                              rows="2"
                            />
                          </div>
                          <div className="col-12">
                            <div className="d-flex gap-2">
                              <button type="submit" className="btn btn-primary btn-sm">
                                <i className="fas fa-save me-1"></i> Simpan
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleCancelEdit}
                              >
                                <i className="fas fa-times me-1"></i> Batal
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // ROOM CARD DISPLAY
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title mb-0">
                          <i className="fas fa-bed me-2"></i>
                          {room.room_name}
                        </h5>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(room)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(room.id)}
                            disabled={room.current_occupants > 0}
                            title={room.current_occupants > 0 ? "Tidak bisa menghapus ruangan yang terisi" : "Hapus ruangan"}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className={`badge ${getStatusBadgeClass(room.status)} me-2`}>
                          {getStatusLabel(room.status)}
                        </span>
                        <span className="badge bg-info">
                          {getRoomTypeLabel(room.room_type)}
                        </span>
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <div className="info-row">
                            <div className="info-label">Kapasitas:</div>
                            <div className="info-value">{room.capacity} orang</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="info-row">
                            <div className="info-label">Terisi:</div>
                            <div className="info-value">{room.current_occupants} orang</div>
                          </div>
                        </div>
                      </div>

                      {room.available_beds > 0 ? (
                        <div className="alert alert-success mt-3 mb-2 py-2">
                          <i className="fas fa-check-circle me-2"></i>
                          Tersedia {room.available_beds} tempat tidur
                        </div>
                      ) : (
                        <div className="alert alert-warning mt-3 mb-2 py-2">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          Ruangan penuh
                        </div>
                      )}

                      {room.notes && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <strong>Catatan:</strong> {room.notes}
                          </small>
                        </div>
                      )}

                      {room.resident_names && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <strong>Penghuni:</strong> {room.resident_names}
                          </small>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomManagement;