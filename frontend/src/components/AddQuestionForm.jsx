import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const AddQuestionForm = ({ examId, onCancel }) => {
  const { API_BASE_URL, getHeaders } = useAuth(); // <--- Get the new helper
  
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A'
  });
  const [msg, setMsg] = useState('');

  // 1. Fetch Questions (Updated headers)
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exams/${examId}/questions`, {
          headers: getHeaders() // <--- Use getHeaders()
      });
      if (res.ok) setQuestions(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchQuestions(); }, [examId]);

  // 2. Handle Form Change
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 3. Submit (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE_URL}/exams/question/${editingId}` // PUT
      : `${API_BASE_URL}/exams/${examId}/questions`;  // POST
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(), // <--- Use getHeaders() (Includes Content-Type & user-id)
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMsg(editingId ? "✅ Updated!" : "✅ Added!");
        fetchQuestions(); 
        resetForm();
      } else {
        const err = await res.json();
        setMsg(`❌ Error: ${err.message}`);
      }
    } catch (e) { console.error(e); }
  };

  // 4. Edit Click
  const handleEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      text: q.text,
      option_a: q.options.A,
      option_b: q.options.B,
      option_c: q.options.C,
      option_d: q.options.D,
      correct_option: 'A' // Default
    });
    setMsg("✏️ Editing Question");
  };

  // 5. Delete Click
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this question?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/exams/question/${id}`, { 
            method: 'DELETE',
            headers: getHeaders() // <--- Use getHeaders()
        });
        if(res.ok) fetchQuestions();
    } catch(e) { console.error(e); }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
    setMsg('');
  };

  return (
    <div className="card shadow-lg border-0 my-4">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="m-0">Manage Questions (Exam #{examId})</h5>
        <button onClick={onCancel} className="btn btn-sm btn-light fw-bold">Close Manager</button>
      </div>
      
      <div className="card-body p-0">
        <div className="row g-0">
            
            {/* LEFT: QUESTION LIST */}
            <div className="col-lg-5 border-end bg-light overflow-auto" style={{maxHeight: '600px'}}>
                <div className="p-3">
                    <h6 className="text-muted fw-bold mb-3">Existing Questions ({questions.length})</h6>
                    {questions.length === 0 && <p className="small text-muted">No questions yet.</p>}
                    
                    <div className="d-flex flex-column gap-2">
                        {questions.map((q, idx) => (
                            <div key={q.id} className={`p-3 bg-white border rounded shadow-sm position-relative ${editingId === q.id ? 'border-primary border-2' : ''}`}>
                                <small className="fw-bold text-primary">Q{idx+1}</small>
                                <p className="mb-2 small fw-bold text-truncate">{q.text}</p>
                                
                                <div className="d-flex gap-2">
                                    <button onClick={() => handleEdit(q)} className="btn btn-sm btn-outline-primary py-0" style={{fontSize: '0.8rem'}}>Edit</button>
                                    <button onClick={() => handleDelete(q.id)} className="btn btn-sm btn-outline-danger py-0" style={{fontSize: '0.8rem'}}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="col-lg-7 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary m-0">{editingId ? "Edit Question" : "Add New Question"}</h5>
                    {editingId && <button onClick={resetForm} className="btn btn-sm btn-secondary">Cancel Edit</button>}
                </div>
                
                {msg && <div className={`alert py-2 small ${msg.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{msg}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Question Text</label>
                        <textarea 
                            name="text" className="form-control" rows="3" required placeholder="Type question here..."
                            value={formData.text} onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <input name="option_a" className="form-control form-control-sm" placeholder="Option A" required value={formData.option_a} onChange={handleChange} />
                        </div>
                        <div className="col-6">
                            <input name="option_b" className="form-control form-control-sm" placeholder="Option B" required value={formData.option_b} onChange={handleChange} />
                        </div>
                        <div className="col-6">
                            <input name="option_c" className="form-control form-control-sm" placeholder="Option C" required value={formData.option_c} onChange={handleChange} />
                        </div>
                        <div className="col-6">
                            <input name="option_d" className="form-control form-control-sm" placeholder="Option D" required value={formData.option_d} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold">Correct Answer</label>
                        <select name="correct_option" className="form-select form-select-sm" value={formData.correct_option} onChange={handleChange}>
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                        </select>
                    </div>

                    <button type="submit" className={`btn w-100 fw-bold ${editingId ? 'btn-warning' : 'btn-success'}`}>
                        {editingId ? "Update Question" : "➕ Add Question"}
                    </button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AddQuestionForm;