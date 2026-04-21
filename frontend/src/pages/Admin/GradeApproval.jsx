import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GradeApproval = () => {
  const [allClasses, setAllClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [gradeData, setGradeData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/grades/all-for-approval').then(r => setAllClasses(r.data));
  }, []);

  // Filter classes based on selected subject and semester
  useEffect(() => {
    let filtered = allClasses;
    if (selectedSubject) {
      const subj = subjects.find(s => s.id === selectedSubject);
      if (subj) filtered = filtered.filter(c => c.subject_name === subj.name);
    }
    if (selectedSemester) {
      const sem = semesters.find(s => s.id === selectedSemester);
      if (sem) filtered = filtered.filter(c => c.semester_name === sem.name && String(c.semester_year) === String(sem.year));
    }
    setClasses(filtered);
  }, [selectedSubject, selectedSemester, allClasses, subjects, semesters]);

  const handleLoadGrades = async () => {
    if (!selectedClass) {
      alert('Vui lòng chọn lớp học');
      return;
    }
    const cls = allClasses.find(c => c.class_id === selectedClass);
    if (!cls) return;

    try {
      const r = await api.get(`/grades/class/${selectedClass}`);
      setGradeData({ ...r.data, ...cls });
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (classId) => {
    try {
      await api.post(`/grades/class/${classId}/approve`);
      handleLoadGrades();
      api.get('/grades/all-for-approval').then(r => setAllClasses(r.data));
      setShowSuccessModal(true);
    } catch (err) {
      alert('Lỗi khi duyệt: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleReject = async (classId) => {
    if (!confirm('Mở lại bảng điểm về draft?')) return;
    await api.post(`/grades/class/${classId}/reject`);
    handleLoadGrades();
    api.get('/grades/all-for-approval').then(r => setAllClasses(r.data));
  };

  const statusLabel = (s) => {
    if (s === 'approved') return <span className="badge badge-success">Đã duyệt</span>;
    if (s === 'submitted') return <span className="badge badge-warning">Chờ duyệt</span>;
    if (s === 'draft') return <span className="badge badge-slate">Nháp</span>;
    return <span className="badge badge-slate">Chưa có điểm</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nhập điểm</h1>
          <p>Cập nhật điểm thành phần và duyệt kết quả</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Môn học</label>
            <select className="form-control" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedClass(''); setGradeData(null); }}>
              <option value="">Tất cả môn học</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Học kỳ</label>
            <select className="form-control" value={selectedSemester} onChange={e => { setSelectedSemester(e.target.value); setSelectedClass(''); setGradeData(null); }}>
              <option value="">Tất cả học kỳ</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Lớp học</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleLoadGrades} style={{ marginBottom: 0 }}>Tải danh sách</button>
        </div>
      </div>

      {/* Grade Table */}
      {gradeData ? (
        <div className="table-container">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <strong>{gradeData.class_name}</strong> - {gradeData.subject_name}
              <span style={{ margin: '0 4px' }}>|</span>
              {statusLabel(gradeData.status)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {gradeData.status === 'submitted' && <button className="btn btn-sm btn-success" onClick={() => handleApprove(selectedClass)}>✓ Duyệt bảng điểm</button>}
              {(gradeData.status === 'submitted' || gradeData.status === 'approved') && <button className="btn btn-sm btn-danger" onClick={() => handleReject(selectedClass)}>↩ Mở lại</button>}
              <button className="btn btn-sm btn-outline" onClick={() => navigate(`/teacher/classes/${selectedClass}/grades`)}>👁 Xem chi tiết</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mã SV</th><th>Họ tên</th>
                {(gradeData.grade_items || []).map(item => <th key={item.name}>{item.name} ({item.weight}%)</th>)}
                <th>Điểm cuối</th><th>Thang 4</th><th>Chữ</th><th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {(gradeData.grades || []).map(g => (
                <tr key={g.student_id}>
                  <td>{g.student_code}</td><td>{g.student_name}</td>
                  {(gradeData.grade_items || []).map(item => <td key={item.name}>{g.scores?.[item.name] ?? '-'}</td>)}
                  <td style={{ fontWeight: 700 }}>{g.final_score_10 ?? '-'}</td>
                  <td>{g.final_score_4 ?? '-'}</td>
                  <td><span className="badge badge-primary">{g.letter_grade || '-'}</span></td>
                  <td>{g.is_pass != null && <span className={`badge ${g.is_pass ? 'badge-success' : 'badge-danger'}`}>{g.is_pass ? 'Đậu' : 'Rớt'}</span>}</td>
                </tr>
              ))}
              {(gradeData.grades || []).length === 0 && (
                <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Chưa có điểm cho lớp này</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--slate-400)' }}>
          Chọn môn học, học kỳ và lớp để tải danh sách điểm.
        </div>
      )}

      {/* All classes status summary */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Tổng hợp trạng thái bảng điểm</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Lớp</th><th>Môn học</th><th>Học kỳ</th><th>GV</th><th>SV</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {allClasses.map(c => (
                <tr key={c.class_id}>
                  <td style={{ fontWeight: 600 }}>{c.class_name}</td><td>{c.subject_name}</td>
                  <td>{c.semester_name} ({c.semester_year})</td><td>{c.teacher_name}</td><td>{c.student_count}</td>
                  <td>{statusLabel(c.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {c.status === 'submitted' && <button className="btn btn-sm btn-success mr-2" onClick={() => handleApprove(c.class_id)}>✓ Duyệt</button>}
                    {(c.status === 'submitted' || c.status === 'approved') && <button className="btn btn-sm btn-danger" onClick={() => handleReject(c.class_id)}>↩ Mở lại</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Đã duyệt</h2>
            <p style={{ marginBottom: '32px', color: '#4b5563', fontSize: '14px' }}>Đã duyệt bản điểm</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{ backgroundColor: '#059669', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeApproval;
