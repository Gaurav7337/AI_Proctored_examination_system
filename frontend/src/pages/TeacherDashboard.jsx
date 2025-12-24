import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Navbar from '../components/navbar';
import CreateExamForm from '../components/CreateExamForm';
import AddQuestionForm from '../components/AddQuestionForm';
import ManageStudents from '../components/ManageStudents';

const TeacherDashboard = () => {
  const { user, API_BASE_URL, getHeaders } = useAuth();
  
  // View State: 'create' | 'list' | 'results' | 'students'
  const [view, setView] = useState('list'); 
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [results, setResults] = useState([]);

  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exams`, { headers: getHeaders() });
      if (res.ok) setExams(await res.json());
    } catch (e) {}
  };

  useEffect(() => { if (view === 'list') fetchExams(); }, [view]);

  const viewExamResults = async (examId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/exams/${examId}/results`, { headers: getHeaders() });
        if (res.ok) {
            setResults(await res.json());
            setSelectedExamId(examId);
            setView('results');
        }
    } catch (e) {}
  };

  const deleteExam = async (examId) => {
    if (!window.confirm("Delete exam?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/exams/${examId}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) fetchExams();
    } catch (e) {}
  };

  const deleteResult = async (resultId) => {
    if (!window.confirm("Delete result?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/exams/results/${resultId}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) viewExamResults(selectedExamId);
    } catch (e) {}
  };

  // --- STYLES ---
  const gradientBg = {
    background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', // Aesthetic Sunset Gradient
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif"
  };

  const glassCard = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
  };

  const btnStyle = (active) => ({
    background: active ? '#ff6b6b' : 'white', 
    color: active ? 'white' : '#ff6b6b',
    border: active ? 'none' : '1px solid #ff6b6b',
    borderRadius: '20px',
    padding: '8px 20px',
    fontWeight: 'bold',
    transition: '0.3s'
  });

  return (
    <div style={gradientBg}>
      <Navbar title="Teacher Portal" />
      <div className="container py-5">
        
        {/* TOP HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 p-4" style={glassCard}>
            <div>
                <h2 className="fw-bold text-dark m-0">👋 Hello, {user?.username}</h2>
                <p className="text-muted m-0">Manage your exams and students efficiently.</p>
            </div>
            <div className="d-flex gap-2">
                <button style={btnStyle(view === 'create')} onClick={() => { setView('create'); setSelectedExamId(null); }}>
                    ✍️ Create Exam
                </button>
                <button style={btnStyle(view === 'list')} onClick={() => { setView('list'); setSelectedExamId(null); }}>
                    📚 My Exams
                </button>
                <button style={btnStyle(view === 'students')} onClick={() => { setView('students'); setSelectedExamId(null); }}>
                    👥 Students
                </button>
            </div>
        </div>

        {/* --- VIEW 1: CREATE EXAM --- */}
        {view === 'create' && (
           <div style={glassCard} className="p-4 animate__animated animate__fadeIn">
               <CreateExamForm onSuccess={() => { setView('list'); fetchExams(); }} />
           </div>
        )}

        {/* --- VIEW 2: LIST EXAMS --- */}
        {view === 'list' && !selectedExamId && (
          <div className="row g-4">
            {exams.length === 0 && (
                <div className="col-12 text-center py-5">
                    <h4 className="text-white">No exams found. Start by creating one! 📝</h4>
                </div>
            )}
            
            {exams.map(exam => (
              <div key={exam.id} className="col-md-6 col-lg-4">
                <div className="card h-100" style={{...glassCard, padding: '20px'}}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px', fontSize: '24px'}}>
                          📝
                      </div>
                      <button className="btn btn-sm btn-light text-danger rounded-circle" onClick={() => deleteExam(exam.id)} title="Delete Exam">🗑️</button>
                  </div>
                  
                  <h5 className="fw-bold mb-1">{exam.title}</h5>
                  <p className="text-muted small mb-3">
                      ⏱️ {exam.duration} mins <br/> 
                      📅 {new Date(exam.start_date).toLocaleDateString()}
                  </p>
                  
                  <div className="mt-auto d-flex gap-2">
                      <button className="btn w-100 fw-bold" 
                              style={{background: '#ffecd2', color: '#ff6b6b', border:'none'}}
                              onClick={() => setSelectedExamId(exam.id)}>
                          ⚙️ Questions
                      </button>
                      <button className="btn w-100 fw-bold text-white" 
                              style={{background: '#ff6b6b'}}
                              onClick={() => viewExamResults(exam.id)}>
                          📊 Results
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 3: MANAGE QUESTIONS --- */}
        {view === 'list' && selectedExamId && (
          <div style={glassCard} className="p-4">
             <AddQuestionForm examId={selectedExamId} onCancel={() => setSelectedExamId(null)} />
          </div>
        )}

        {/* --- VIEW 4: RESULTS TABLE --- */}
        {view === 'results' && (
            <div style={glassCard} className="overflow-hidden">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{background: 'rgba(255,107,107,0.1)'}}>
                    <h5 className="m-0 fw-bold text-danger">📊 Results: Exam #{selectedExamId}</h5>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setView('list')}>← Back</button>
                </div>
                <div className="table-responsive p-0">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Student</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th className="text-end pe-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">No students have taken this exam yet.</td></tr>
                            ) : (
                                results.map((r, idx) => (
                                    <tr key={idx}>
                                        <td className="ps-4 fw-bold text-dark">{r.student_name}</td>
                                        <td><span className="badge bg-dark rounded-pill px-3">{r.score} / {r.total}</span></td>
                                        <td>
                                            {r.score / r.total >= 0.5 
                                                ? <span className="text-success fw-bold">Pass ✨</span> 
                                                : <span className="text-danger fw-bold">Fail ❌</span>}
                                        </td>
                                        <td className="text-muted small">{r.date}</td>
                                        <td className="text-end pe-4">
                                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => deleteResult(r.result_id)}>
                                                Retake ↺
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- VIEW 5: MANAGE STUDENTS --- */}
        {view === 'students' && (
            <div style={glassCard} className="p-4">
                <ManageStudents onClose={() => setView('list')} />
            </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;