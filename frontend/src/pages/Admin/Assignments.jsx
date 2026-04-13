import { useState, useEffect } from 'react';
import api from '../../services/api';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({ teacher_id: '', subject_id: '', semester_id: '' });

  useEffect(() => {
    fetchData();
    api.get('/users/by-role/teacher').then(r => setTeachers(r.data));
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
  }, []);

  const fetchData = async () => { const r = await api.get('/assignments/'); setAssignments(r.data); };

  const handleSave = async () => {
    try {
      await api.post('/assignments/', form);
      setForm({ teacher_id: '', subject_id: '', semester_id: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleDelete = async (id) => { if (!confirm('Xác nhận xóa?')) return; await api.delete(`/assignments/${id}`); fetchData(); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Phân công giảng dạy</h1><p>Gán giáo viên cho môn học theo từng học kỳ</p></div>
      </div>

      <div className="assignment-form">
        <h3>Tạo phân công</h3>
        <div className="assignment-form-row">
          <div className="form-group">
            <label>Giáo viên</label>
            <select className="form-control" value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})}>
              <option value="">-- Chọn --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.user_code} - {t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Môn học</label>
            <select className="form-control" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}>
              <option value="">-- Chọn --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Học kỳ</label>
            <select className="form-control" value={form.semester_id} onChange={e => setForm({...form, semester_id: e.target.value})}>
              <option value="">-- Chọn --</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year}) - {s.status}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'end', marginBottom: '16px' }}>🔒 Lưu phân công</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Giáo viên</th><th>Môn học</th><th>Học kỳ</th><th>Trạng thái HK</th><th></th></tr></thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                <td>{a.teacher_code} - {a.teacher_name}</td>
                <td>{a.subject_name}</td>
                <td>{a.semester_name} ({a.semester_year})</td>
                <td><span className={`badge ${a.semester_status === 'open' ? 'badge-success' : 'badge-danger'}`}>{a.semester_status}</span></td>
                <td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>🗑 Xoá</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assignments;
