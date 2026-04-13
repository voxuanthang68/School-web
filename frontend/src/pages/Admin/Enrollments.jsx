import { useState, useEffect } from 'react';
import api from '../../services/api';

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', subject_id: '', semester_id: '' });

  useEffect(() => {
    fetchData();
    api.get('/users/by-role/student').then(r => setStudents(r.data));
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/classes/').then(r => setClasses(r.data));
  }, []);

  const fetchData = async () => {
    const r = await api.get('/enrollments/');
    setEnrollments(r.data);
  };

  // Enrich enrollments with class name
  const enriched = enrollments.map(e => {
    const cls = classes.find(c =>
      c.subject_id === e.subject_id && c.semester_id === e.semester_id &&
      (c.approved_students || []).includes(e.student_id)
    );
    return { ...e, class_name: cls?.name || '-' };
  });

  const filtered = enriched.filter(e =>
    (e.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.student_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.class_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      await api.post('/enrollments/', form);
      setShowModal(false);
      setForm({ student_id: '', subject_id: '', semester_id: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận hủy đăng ký?')) return;
    await api.delete(`/enrollments/${id}`);
    fetchData();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Đăng ký môn học</h1>
          <p>Theo dõi đăng ký của sinh viên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Đăng ký</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}>
              <option>10</option><option>25</option><option>50</option>
            </select> dòng
          </div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>

        <table>
          <thead>
            <tr><th>Sinh viên</th><th>Môn học</th><th>Học kỳ</th><th>Lớp</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map(e => (
              <tr key={e.id}>
                <td>{e.student_code} - {e.student_name}</td>
                <td>{e.subject_name}</td>
                <td>{e.semester_name} ({e.semester_year})</td>
                <td>{e.class_name}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>⊘ Huỷ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-pagination">
          <span>Showing {Math.min((page-1)*perPage+1, filtered.length)} to {Math.min(page*perPage, filtered.length)} of {filtered.length} entries</span>
          <div className="table-pagination-buttons">
            <button onClick={() => setPage(Math.max(1, page-1))}>«</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => <button key={p} className={p===page?'active':''} onClick={() => setPage(p)}>{p}</button>)}
            <button onClick={() => setPage(Math.min(totalPages, page+1))}>»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Đăng ký môn học</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Sinh viên</label>
                <select className="form-control" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.user_code} - {s.name}</option>)}
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
                  {semesters.filter(s => s.status === 'open').map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Lưu đăng ký</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
