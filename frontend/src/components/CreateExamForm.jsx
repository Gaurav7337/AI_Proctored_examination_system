import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const CreateExamForm = ({ onSuccess }) => {
  const { API_BASE_URL, getHeaders } = useAuth();
  const [formData, setFormData] = useState({ 
      title: '', 
      duration: '', 
      start_date: '', 
      end_date: '', 
      password: '' // <--- New State
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/exams`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("✅ Exam Created!");
        onSuccess();
      } else {
        const d = await res.json();
        alert("Error: " + d.message);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="card shadow-sm p-4 mb-4">
      <h5 className="mb-3">Create New Exam</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
            <label className="form-label">Exam Title</label>
            <input className="form-control" required 
                onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        <div className="row mb-3">
            <div className="col">
                <label className="form-label">Duration (mins)</label>
                <input type="number" className="form-control" required 
                    onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            {/* NEW PASSWORD FIELD */}
            <div className="col">
                <label className="form-label">Exam Password (Optional)</label>
                <input type="text" className="form-control" placeholder="Secret Code"
                    onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
        </div>
        
        <div className="row mb-3">
            <div className="col">
                <label className="form-label fw-bold text-success">Opens At</label>
                <input type="datetime-local" className="form-control" required
                    onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="col">
                <label className="form-label fw-bold text-danger">Closes At (Deadline)</label>
                <input type="datetime-local" className="form-control" required
                    onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
        </div>

        <button className="btn btn-success fw-bold w-100">Create Exam</button>
      </form>
    </div>
  );
};

export default CreateExamForm;