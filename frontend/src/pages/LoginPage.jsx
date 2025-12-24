import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, API_BASE_URL } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log(`📡 Connecting to: ${API_BASE_URL}/auth/login`);
      
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (res.ok) {
        login(data.user);
        if (data.user.role === 'admin') navigate('/admin-dashboard');
        else if (data.user.role === 'teacher') navigate('/teacher-dashboard');
        else navigate('/student-dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (e) {
        console.error("Login Error:", e);
        // SHOW THE REAL ERROR ON SCREEN
        setError(`Connection Failed: ${e.message}. (Check Console)`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center p-4"
         style={{
             background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
             fontFamily: "'Inter', 'Segoe UI', sans-serif"
         }}>
         
      <div className="card shadow-lg border-0 overflow-hidden" style={{ maxWidth: '900px', width: '100%', borderRadius: '20px' }}>
        <div className="row g-0">
            
            {/* LEFT SIDE: INSTRUCTIONS */}
            <div className="col-md-6 text-white p-5 d-flex flex-column justify-content-center"
                 style={{ background: 'linear-gradient(to bottom right, #36D1DC, #5B86E5)' }}>
                
                <h2 className="fw-bold mb-4">Exam Portal</h2>
                
                <div className="mb-4" style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '15px', backdropFilter: 'blur(5px)' }}>
                    <h5 className="fw-bold border-bottom pb-2 mb-3">📝 Instructions</h5>
                    <ul className="small mb-0 ps-3" style={{ lineHeight: '1.8' }}>
                        <li>Ensure stable internet connection.</li>
                        <li><strong>Face Detection</strong> is active.</li>
                        <li>No mobile phones allowed.</li>
                        <li>Do not switch tabs.</li>
                    </ul>
                </div>
                
                <small className="text-white-50">© 2025 Secure Exam System.</small>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="col-md-6 bg-white p-5">
                <div className="text-center mb-4">
                    <h3 className="fw-bold text-dark">Sign In</h3>
                    <p className="text-muted small">Enter your credentials</p>
                </div>

                {/* ERROR MESSAGE BOX */}
                {error && (
                    <div className="alert alert-danger py-2 small" role="alert">
                        <strong>⚠️ Error:</strong> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold text-secondary small">USERNAME</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">👤</span>
                            <input 
                                type="text" className="form-control bg-light border-start-0 py-2" 
                                placeholder="Enter ID" value={username} onChange={e=>setUsername(e.target.value)} required 
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold text-secondary small">PASSWORD</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">🔒</span>
                            <input 
                                type="password" className="form-control bg-light border-start-0 py-2" 
                                placeholder="Enter Password" value={password} onChange={e=>setPassword(e.target.value)} required 
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary w-100 py-2 fw-bold shadow-sm" disabled={isLoading}
                        style={{ background: '#2a5298', borderColor: '#2a5298' }}>
                        {isLoading ? "Verifying..." : "Login to Portal →"}
                    </button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Login;