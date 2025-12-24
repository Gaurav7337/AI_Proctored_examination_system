import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import Navbar from '../components/navbar';

const StudentDashboard = () => {
  const { user, API_BASE_URL, getHeaders } = useAuth();
  
  // -- STATE --
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [now, setNow] = useState(new Date()); 
  
  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [currentQIndex, setCurrentQIndex] = useState(0); 
  const [visited, setVisited] = useState({}); 
  const [timeLeft, setTimeLeft] = useState(0); 
  
  const [viewMode, setViewMode] = useState('single'); 
  const [proctorStatus, setProctorStatus] = useState("safe");
  const [showAlert, setShowAlert] = useState(false);
  const questionRefs = useRef({});

  // --- AESTHETIC STYLES ---
  const styles = {
    pageBg: {
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Misty Blue Gradient
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: '#2d3436'
    },
    glassCard: {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
    },
    optionCard: (isSelected) => ({
        background: isSelected ? '#e3f2fd' : 'white',
        border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '15px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isSelected ? '0 4px 12px rgba(33, 150, 243, 0.15)' : 'none'
    })
  };

  // 0. Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const examRes = await fetch(`${API_BASE_URL}/exams`, { headers: getHeaders() });
        const examsData = await examRes.json();

        const attemptRes = await fetch(`${API_BASE_URL}/attempts/my_attempts`, { headers: getHeaders() });
        let attemptedIds = [];
        if (attemptRes.ok) attemptedIds = await attemptRes.json();

        const mergedExams = examsData.map(exam => ({
            ...exam,
            attempted: attemptedIds.includes(exam.id)
        }));

        setExams(mergedExams);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [API_BASE_URL]);

  // 2. Start Exam
  const startExam = async (exam) => {
    setActiveExam(exam);
    try {
        const res = await fetch(`${API_BASE_URL}/exams/${exam.id}/questions`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            setQuestions(data);
            setTimeLeft(exam.duration * 60); 
            setVisited({ 0: true }); 
        }
    } catch (e) { console.error(e); }
  };

  // --- HELPER: SAFE DATE FORMATTING ---
  const safeDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateDisplay = (dateObj) => {
    if (!dateObj) return "N/A";
    return dateObj.toLocaleString([], {
        month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    });
  };

  // --- HELPER: SMART END DATE CALCULATOR ---
  const getExamTimes = (exam) => {
    const start = safeDate(exam.start_date);
    let end = safeDate(exam.end_date);

    // 🛠️ FALLBACK FIX: If 'end' is missing, calculate it (Start + Duration)
    if (!end && start && exam.duration) {
        end = new Date(start.getTime() + exam.duration * 60000);
    }
    return { start, end };
  };

  const getExamStatus = (exam) => {
    if (exam.attempted) return { label: "Completed", icon: "✅", color: "secondary", disabled: true };

    const { start, end } = getExamTimes(exam);

    if (!start || !end) return { label: "Start Exam", icon: "🚀", color: "primary", disabled: false };

    if (now < start) {
        return { 
            label: `Starts: ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 
            icon: "⏳",
            color: "warning", 
            disabled: true 
        };
    }
    
    if (now > end) {
        return { label: "Expired", icon: "🚫", color: "danger", disabled: true };
    }
    
    return { label: "Start Exam", icon: "🚀", color: "primary", disabled: false };
  };

  // --- 3. TIMER ---
  useEffect(() => {
    if (!activeExam || timeLeft <= 0) return;
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) { clearInterval(timer); submitExam(); return 0; }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // --- 4. PROCTOR ---
  useEffect(() => {
    let interval;
    if (activeExam) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/exams/proctor_status`);
          if (res.ok) {
            const data = await res.json();
            setProctorStatus(data.status);
            setShowAlert(data.status !== "safe");
          }
        } catch (e) { }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeExam, API_BASE_URL]);

  const handleOptionSelect = (qId, opt) => setAnswers(prev => ({ ...prev, [qId]: opt }));
  
  const handleNavClick = (index) => {
    setVisited(prev => ({ ...prev, [index]: true }));
    if (viewMode === 'single') setCurrentQIndex(index);
    else questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitExam = async () => {
    if (!window.confirm("Submit?")) return;
    try {
        await fetch(`${API_BASE_URL}/exams/${activeExam.id}/submit`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ answers })
        });
        window.location.reload(); 
    } catch (e) {}
  };

  const getPaletteColor = (index, qId) => {
    if (viewMode === 'single' && currentQIndex === index) return "btn-primary";
    if (answers[qId]) return "btn-success"; 
    if (visited[index]) return "btn-danger"; 
    return "btn-outline-secondary";
  };

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center" style={styles.pageBg}><div className="spinner-border text-primary"></div></div>;

  // ================= DASHBOARD VIEW =================
  if (!activeExam) {
    return (
        <div style={styles.pageBg}>
            <Navbar title="Student Portal" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h2 className="fw-bold m-0" style={{color: '#2c3e50'}}>My Exams</h2>
                        <p className="text-muted m-0">Select an exam to begin your assessment.</p>
                    </div>
                    {user && <span className="badge bg-white text-dark shadow-sm px-3 py-2 border">User ID: {user.id}</span>}
                </div>

                <div className="row g-4">
                    {exams.map(exam => {
                        const { start, end } = getExamTimes(exam);
                        const status = getExamStatus(exam);
                        return (
                            <div key={exam.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 p-3" style={styles.glassCard}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary" 
                                             style={{width:'50px', height:'50px', fontSize:'24px', background: '#e3f2fd'}}>
                                            📝
                                        </div>
                                        <span className={`badge rounded-pill px-3 py-2 bg-${status.color === 'warning' ? 'warning text-dark' : status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    
                                    <h5 className="fw-bold text-dark mb-1">{exam.title}</h5>
                                    <p className="text-muted small mb-4">⏱️ {exam.duration} mins duration</p>
                                    
                                    <div className="mt-auto bg-light rounded p-3 mb-3 small border">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">Opens:</span>
                                            <span className="fw-bold text-dark">{formatDateDisplay(start)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Closes:</span>
                                            <span className="fw-bold text-dark">{formatDateDisplay(end)}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => !status.disabled && startExam(exam)} 
                                        disabled={status.disabled}
                                        className={`btn w-100 fw-bold py-2 btn-${status.color}`}
                                        style={{borderRadius: '10px'}}
                                    >
                                        {status.icon} {status.label}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
  }

  // ================= EXAM INTERFACE VIEW =================
  const currentQ = questions[currentQIndex];
  return (
    <div className="d-flex flex-column vh-100" style={{background: '#f8f9fa'}}>
      {/* HEADER */}
      <div className="bg-white shadow-sm d-flex justify-content-between align-items-center px-4 py-2" style={{height: '65px', zIndex: 10}}>
        <div className="d-flex align-items-center gap-3">
             <div className="bg-light px-3 py-1 rounded fw-bold text-primary border border-primary">
                ⏱️ {formatTime(timeLeft)}
             </div>
             <div className="vr"></div>
             <span className="fw-bold text-dark fs-5">{activeExam.title}</span>
        </div>
        <button className="btn btn-dark px-4 fw-bold rounded-pill" onClick={submitExam}>Finish & Submit</button>
      </div>

      {showAlert && (
        <div className="bg-danger text-white text-center fw-bold py-2 small animate__animated animate__headShake">
            ⚠️ WARNING: {proctorStatus === "missing" ? "Face Not Detected!" : "Multiple Faces Detected!"}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* LEFT: QUESTION AREA */}
        <div className="flex-grow-1 p-5 overflow-auto d-flex justify-content-center">
            {currentQ && (
                <div className="d-flex flex-column w-100" style={{maxWidth: '850px'}}>
                    
                    {/* View Switcher */}
                    <div className="d-flex justify-content-end mb-3">
                         <div className="btn-group shadow-sm">
                            <button className={`btn btn-sm ${viewMode==='single' ? 'btn-primary' : 'btn-white bg-white'}`} onClick={()=>setViewMode('single')}>Single</button>
                            <button className={`btn btn-sm ${viewMode==='list' ? 'btn-primary' : 'btn-white bg-white'}`} onClick={()=>setViewMode('list')}>List</button>
                         </div>
                    </div>

                    {/* Single View Mode */}
                    {viewMode === 'single' && (
                        <div className="card shadow-sm border-0 p-5 mb-3 bg-white" style={{borderRadius: '16px'}}>
                            <div className="d-flex justify-content-between mb-4 border-bottom pb-3">
                                <h5 className="text-secondary m-0">Question {currentQIndex+1} <span className="text-muted small">/ {questions.length}</span></h5>
                                <span className="badge bg-light text-dark border">Single Choice</span>
                            </div>
                            
                            <p className="lead fw-bold text-dark mb-5" style={{lineHeight: '1.6'}}>{currentQ.text}</p>
                            
                            <div className="d-flex flex-column gap-3">
                                {['A','B','C','D'].map(opt => (
                                    <div key={opt} 
                                        onClick={()=>handleOptionSelect(currentQ.id, opt)}
                                        style={styles.optionCard(answers[currentQ.id]===opt)}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                style={{
                                                    width: '32px', height: '32px', 
                                                    background: answers[currentQ.id]===opt ? '#2196f3' : '#f0f0f0', 
                                                    color: answers[currentQ.id]===opt ? 'white' : '#666', 
                                                    fontWeight: 'bold'
                                                }}>
                                                {opt}
                                            </div>
                                            <span className="fs-6">{currentQ.options[opt]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* List View Mode */}
                    {viewMode === 'list' && (
                        <div className="d-flex flex-column gap-4">
                            {questions.map((q, idx) => (
                                <div key={q.id} ref={el => questionRefs.current[idx] = el} className="card border-0 shadow-sm p-4">
                                    <h6 className="fw-bold text-muted">Q{idx+1}</h6>
                                    <p className="fw-bold">{q.text}</p>
                                    <div className="d-flex flex-column gap-2">
                                        {['A','B','C','D'].map(opt => (
                                            <div key={opt} 
                                                onClick={()=>handleOptionSelect(q.id, opt)}
                                                style={styles.optionCard(answers[q.id]===opt)}
                                                className="p-2"
                                            >
                                                <small className="fw-bold me-2">{opt}:</small> {q.options[opt]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation Buttons (Single View) */}
                    {viewMode === 'single' && (
                        <div className="d-flex justify-content-between mt-3">
                           <button className="btn btn-white bg-white shadow-sm px-4 border" disabled={currentQIndex===0} onClick={()=>handleNavClick(currentQIndex-1)}>← Previous</button>
                           <button className="btn btn-primary shadow-sm px-5" disabled={currentQIndex===questions.length-1} onClick={()=>handleNavClick(currentQIndex+1)}>Next Question →</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* RIGHT: SIDEBAR */}
        <div className="bg-white border-start d-flex flex-column p-0 shadow-sm" style={{width: '340px'}}>
             <div className="p-3 border-bottom bg-light">
                <h6 className="m-0 fw-bold text-dark">Question Palette</h6>
             </div>
             
             <div className="flex-grow-1 p-3 overflow-auto">
                 <div className="d-flex flex-wrap gap-2 justify-content-start">
                    {questions.map((q, i) => (
                        <button key={q.id} 
                                className={`btn btn-sm fw-bold ${getPaletteColor(i, q.id)}`} 
                                style={{width:'40px', height:'40px', borderRadius:'8px'}} 
                                onClick={()=>handleNavClick(i)}>
                            {i+1}
                        </button>
                    ))}
                 </div>
                 
                 <div className="mt-4 p-3 rounded bg-light border small text-muted">
                    <div className="row g-2">
                        <div className="col-6 d-flex align-items-center gap-2"><div className="bg-success rounded-circle" style={{width:8, height:8}}></div> Answered</div>
                        <div className="col-6 d-flex align-items-center gap-2"><div className="bg-primary rounded-circle" style={{width:8, height:8}}></div> Current</div>
                        <div className="col-6 d-flex align-items-center gap-2"><div className="bg-danger rounded-circle" style={{width:8, height:8}}></div> Visited</div>
                        <div className="col-6 d-flex align-items-center gap-2"><div className="border border-secondary rounded-circle" style={{width:8, height:8}}></div> Unvisited</div>
                    </div>
                 </div>
             </div>
             
             <div className="p-3 border-top bg-light text-center">
                <small className="d-block mb-2 text-muted fw-bold">Live Proctoring Active 📹</small>
                <div className="rounded overflow-hidden border mx-auto shadow-sm" style={{width: '180px', height: '135px', background: '#000'}}>
                    <img src={`${API_BASE_URL}/exams/video_feed`} width="100%" height="100%" style={{objectFit: 'cover', opacity: 0.9}} alt="proctor" />
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;