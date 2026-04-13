import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeacherViewGrades = () => {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/classes/').then(r => setAllClasses(r.data));
  }, []);

  useEffect(() => {
    let filtered = allClasses;
    if (selectedSubject) {
      const subj = subjects.find(s => s.id === selectedSubject);
      if (subj) filtered = filtered.filter(c => c.subject_name === subj.name || c.subject_id === selectedSubject);
    }
    if (selectedSemester) {
      const sem = semesters.find(s => s.id === selectedSemester);
      if (sem) filtered = filtered.filter(c => c.semester_id === selectedSemester || (c.semester_name === sem.name && String(c.semester_year) === String(sem.year)));
    }
    setClasses(filtered);
  }, [selectedSubject, selectedSemester, allClasses, subjects, semesters]);

  const handleLoad = async () => {
    if (!selectedClass) { alert('Vui lòng chọn lớp'); return; }
    const r = await api.get(`/grades/class/${selectedClass}`);
    setData(r.data);
  };

  const exportGrades = async (fmt) => {
    try {
      const res = await api.get(`/grades/export/${fmt}/${selectedClass}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades.${fmt}`;
      link.click();
    } catch (err) { alert('Lỗi xuất file'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Xem điểm</h1>
          <p>Tra cứu bảng điểm theo lớp đã nhập</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Môn học</label>
            <select className="form-control" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedClass(''); setData(null); }}>
              <option value="">Tất cả</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Học kỳ</label>
            <select className="form-control" value={selectedSemester} onChange={e => { setSelectedSemester(e.target.value); setSelectedClass(''); setData(null); }}>
              <option value="">Tất cả</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Lớp học</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleLoad} style={{ marginBottom: 0 }}>Tải danh sách</button>
        </div>
      </div>

      {data ? (
        <div className="table-container">
          <div className="table-toolbar">
            <div>
              Trạng thái:{' '}
              {data.status === 'approved' ? <span className="badge badge-success">Đã duyệt</span> : data.status === 'submitted' ? <span className="badge badge-warning">Chờ duyệt</span> : <span className="badge badge-slate">Nháp</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-success" onClick={() => exportGrades('xlsx')}>📥 Xuất Excel</button>
              <button className="btn btn-sm btn-outline" onClick={() => exportGrades('csv')}>📥 CSV</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mã SV</th><th>Họ tên</th>
                {(data.grade_items || []).map(item => <th key={item.name}>{item.name} ({item.weight}%)</th>)}
                <th>Điểm cuối</th><th>Thang 4</th><th>Chữ</th><th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {(data.grades || []).map(g => (
                <tr key={g.student_id}>
                  <td>{g.student_code}</td><td>{g.student_name}</td>
                  {(data.grade_items || []).map(item => <td key={item.name}>{g.scores?.[item.name] ?? '-'}</td>)}
                  <td style={{ fontWeight: 700 }}>{g.final_score_10 ?? '-'}</td>
                  <td>{g.final_score_4 ?? '-'}</td>
                  <td><span className="badge badge-primary">{g.letter_grade || '-'}</span></td>
                  <td><span className={`badge ${g.is_pass ? 'badge-success' : 'badge-danger'}`}>{g.is_pass ? 'Đậu' : 'Rớt'}</span></td>
                </tr>
              ))}
              {(data.grades || []).length === 0 && (
                <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Chưa có dữ liệu điểm</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--slate-400)' }}>
          Chọn môn học, học kỳ và lớp để xem bảng điểm.
        </div>
      )}
    </div>
  );
};

export default TeacherViewGrades;
