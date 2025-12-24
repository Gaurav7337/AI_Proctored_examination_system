import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const ManageStudents = ({ onClose }) => {
  const { API_BASE_URL, getHeaders } = useAuth();
  const [textInput, setTextInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [existingStudents, setExistingStudents] = useState([]);

  // 1. Fetch Students
  const fetchStudents = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/students/list`, { headers: getHeaders() });
        if (res.ok) setExistingStudents(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStudents(); }, []);

  // 2. Add Students
  const handleBulkAdd = async () => {
    if (!textInput.trim()) return;

    const lines = textInput.split('\n');
    const studentsToAdd = [];
    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
            studentsToAdd.push({
                username: parts[0].trim(),
                password: parts[1].trim(),
                enrollment_id: parts[2] ? parts[2].trim() : ''
            });
        }
    });

    setStatusMsg("Uploading...");
    try {
        const res = await fetch(`${API_BASE_URL}/students/bulk_add`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ students: studentsToAdd })
        });
        const data = await res.json();
        
        if (res.ok) {
            setStatusMsg(`✅ ${data.message}`);
            if(data.errors && data.errors.length > 0) alert("Warnings:\n" + data.errors.join("\n"));
            setTextInput('');
            fetchStudents();
        } else {
            setStatusMsg(`❌ Error: ${data.message}`);
        }
    } catch (e) { setStatusMsg("❌ Network Error"); }
  };

  // 3. DELETE STUDENT (New Feature)
  const handleDelete = async (id, username) => {
    if(!window.confirm(`Are you sure you want to delete student '${username}'?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (res.ok) {
            fetchStudents(); // Refresh list
        } else {
            alert("Failed to delete student.");
        }
    } catch(e) { console.error(e); }
  };

  return (
    <div className="card shadow border-0 my-3">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="m-0">Manage Students</h5>
        <button onClick={onClose} className="btn btn-sm btn-light fw-bold">Close</button>
      </div>
      <div className="card-body">
        <div className="row">
            {/* LEFT: INPUT */}
            <div className="col-md-6 border-end">
                <h6 className="fw-bold text-primary">Bulk Add</h6>
                <p className="small text-muted mb-2">Format: <code>username, password, enrollment_id</code></p>
                <textarea 
                    className="form-control mb-3 font-monospace" rows="6"
                    placeholder={`john_doe, pass123, S101\nalice, secure, S102`}
                    value={textInput} onChange={(e) => setTextInput(e.target.value)}
                ></textarea>
                <div className="d-flex justify-content-between align-items-center">
                    <button onClick={handleBulkAdd} className="btn btn-success fw-bold">🚀 Add Students</button>
                    <span className="small fw-bold text-danger">{statusMsg}</span>
                </div>
            </div>

            {/* RIGHT: LIST WITH DELETE */}
            <div className="col-md-6">
                <h6 className="fw-bold">Existing ({existingStudents.length})</h6>
                <div className="overflow-auto border rounded bg-light" style={{maxHeight: '300px'}}>
                    <table className="table table-sm table-striped mb-0 small align-middle">
                        <thead className="table-light">
                            <tr><th>Username</th><th>ID</th><th className="text-end">Action</th></tr>
                        </thead>
                        <tbody>
                            {existingStudents.map(s => (
                                <tr key={s.id}>
                                    <td>{s.username}</td>
                                    <td>{s.enrollment_id || '-'}</td>
                                    <td className="text-end">
                                        <button 
                                            className="btn btn-sm btn-outline-danger py-0" 
                                            title="Delete Student"
                                            onClick={() => handleDelete(s.id, s.username)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;