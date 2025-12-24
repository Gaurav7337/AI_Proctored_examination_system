import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  const { user, API_BASE_URL, getHeaders } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, exams: 0, results: 0 });
  const [view, setView] = useState('list'); // 'list' or 'create'
  
  // Form State
  const [formData, setFormData] = useState({ 
    username: '', password: '', role: 'student', enrollment_id: '' 
  });

  // 1. Fetch Data
  const fetchData = async () => {
    try {
        // Get Users
        const userRes = await fetch(`${API_BASE_URL}/admin/users`, { headers: getHeaders() });
        if(userRes.ok) setUsers(await userRes.json());

        // Get Stats
        const statRes = await fetch(`${API_BASE_URL}/admin/stats`, { headers: getHeaders() });
        if(statRes.ok) setStats(await statRes.json());

    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Create User
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if(res.ok) {
            alert("✅ User Created!");
            setFormData({ username: '', password: '', role: 'student', enrollment_id: '' });
            setView('list');
            fetchData();
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (e) { alert("Network Error"); }
  };

  // 3. Delete User
  const handleDelete = async (id, username) => {
    if(!window.confirm(`Delete user '${username}'?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if(res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar title="Admin Panel" />
      <div className="container py-4">
        
        {/* STATS CARDS */}
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <div className="card bg-primary text-white p-3 shadow-sm">
                    <h3>👥 {stats.users}</h3>
                    <small>Total Users</small>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card bg-success text-white p-3 shadow-sm">
                    <h3>📝 {stats.exams}</h3>
                    <small>Active Exams</small>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card bg-warning text-dark p-3 shadow-sm">
                    <h3>📊 {stats.results}</h3>
                    <small>Submissions</small>
                </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">User Management</h4>
            <button 
                className={`btn fw-bold ${view === 'create' ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setView(view === 'create' ? 'list' : 'create')}
            >
                {view === 'create' ? "Cancel" : "➕ Add User"}
            </button>
        </div>

        {/* VIEW: CREATE USER FORM */}
        {view === 'create' && (
            <div className="card shadow-sm p-4 mb-4">
                <h5>Add New User</h5>
                <form onSubmit={handleCreate}>
                    <div className="row g-2 mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Username</label>
                            <input className="form-control" required value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Password</label>
                            <input className="form-control" required value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})}>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Enrollment ID / Staff ID</label>
                            <input className="form-control" value={formData.enrollment_id} onChange={e=>setFormData({...formData, enrollment_id:e.target.value})} />
                        </div>
                    </div>
                    <button className="btn btn-success w-100 fw-bold">Create User</button>
                </form>
            </div>
        )}

        {/* VIEW: USER LIST */}
        <div className="card shadow-sm">
            <div className="table-responsive">
                <table className="table table-striped mb-0 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Enrollment</th>
                            <th className="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td className="fw-bold">{u.username}</td>
                                <td>
                                    <span className={`badge ${u.role==='admin'?'bg-danger':u.role==='teacher'?'bg-primary':'bg-success'}`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td>{u.enrollment_id || '-'}</td>
                                <td className="text-end">
                                    <button onClick={()=>handleDelete(u.id, u.username)} className="btn btn-sm btn-outline-danger fw-bold">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;