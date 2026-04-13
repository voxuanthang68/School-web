import { useState, useEffect } from 'react';
import api from '../../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [addStudentId, setAddStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: '', subject_id: '', semester_id: '', teacher_id: '', room: '', schedule: '' });

  useEffect(() => {
    fetchData();
    api.get('/users/by-role/teacher').then(r => setTeachers(r.data));
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/users/by-role/student').then(r => setStudents(r.data));
  }, []);

  const fetchData = async () => { const r = await api.get('/classes/'); setClasses(r.data); };

  const fetchClassDetail = async (classId) => {
    const r = await api.get(`/classes/${classId}`);
    setClassDetail(r.data);
    setSelectedClass(classId);
  };

  const filtered = classes.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      await api.post('/classes/', { ...form, status: 'open' });
      setShowModal(false);
      setForm({ name: '', subject_id: '', semester_id: '', teacher_id: '', room: '', schedule: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleDelete = async (id) => { if (!confirm('Xác nhận xóa?')) return; await api.delete(`/classes/${id}`); fetchData(); setSelectedClass(null); setClassDetail(null); };

  const handleApprove = async (studentId) => {
    await api.put(`/classes/${selectedClass}/approve/${studentId}`);
    fetchClassDetail(selectedClass);
    fetchData();
  };

  const handleReject = async (studentId) => {
    await api.put(`/classes/${selectedClass}/reject/${studentId}`);
    fetchClassDetail(selectedClass);
    fetchData();
  };

  const handleAddStudent = async () => {
    if (!addStudentId) return;
    try {
      await api.post(`/classes/${selectedClass}/add-student`, { student_id: addStudentId });
      setAddStudentId('');
      fetchClassDetail(selectedClass);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Xóa sinh viên khỏi lớp?')) return;
    // Remove from approved_students
    const updated = (classDetail.approved_students || []).filter(id => id !== studentId);
    await api.put(`/classes/${selectedClass}`, { approved_students: updated });
    fetchClassDetail(selectedClass);
    fetchData();
  };

  const handleToggleStatus = async (cls) => {
    const newStatus = cls.status === 'open' ? 'closed' : 'open';
    await api.put(`/classes/${cls.id}/status`, { status: newStatus });
    fetchData();
    if (selectedClass === cls.id) fetchClassDetail(cls.id);
  };

  const handleSaveClassInfo = async () => {
    if (!classDetail) return;
    await api.put(`/classes/${selectedClass}/status`, { status: classDetail.status });
    fetchData();
    alert('Đã lưu!');
  };

  // Count pending requests per class
  const getPendingCount = (cls) => (cls.student_requests || []).filter(r => r.status === 'pending').length;
  const getApprovedCount = (cls) => (cls.approved_students || []).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lớp học</h1>
          <p>Quản lý lớp, đăng ký và duyệt sinh viên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Thêm lớp</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}>
              <option>10</option><option>25</option>
            </select> dòng
          </div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>

        <table>
          <thead>
            <tr><th>Tên lớp</th><th>Môn học</th><th>Học kỳ</th><th>Giáo viên</th><th>Đăng ký</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id} style={{ background: selectedClass === c.id ? 'var(--primary-50)' : '' }}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.subject_name}</td>
                <td>{c.semester_name} ({c.semester_year})</td>
                <td>{c.teacher_name}</td>
                <td>
                  <span className="badge badge-warning" style={{ marginRight: 4 }}>Chờ: {getPendingCount(c)}</span>
                  <span className="badge badge-info">Duyệt: {getApprovedCount(c)}</span>
                </td>
                <td><span className={`badge ${c.status === 'open' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => fetchClassDetail(c.id)}>Quản lý</button>
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

      {/* Class Detail Panel */}
      {classDetail && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Lớp đang chọn</div>
              <h2 style={{ marginBottom: '4px' }}>{classDetail.name} - {classDetail.subject_name}</h2>
              <p style={{ color: 'var(--slate-500)', fontSize: '13px' }}>{classDetail.semester_name} ({classDetail.semester_year}) - GV: {classDetail.teacher_name}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="form-control" style={{ width: '100px' }} value={classDetail.status} onChange={e => setClassDetail({...classDetail, status: e.target.value})}>
                <option value="open">open</option>
                <option value="closed">closed</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleSaveClassInfo}>💾 Lưu thông tin lớp</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Pending Requests */}
            <div>
              <h3 style={{ marginBottom: '12px' }}>Đăng ký chờ duyệt</h3>
              <table>
                <thead><tr><th>Sinh viên</th><th></th></tr></thead>
                <tbody>
                  {(classDetail.student_requests_info || []).filter(r => r.status === 'pending').map(r => (
                    <tr key={r.student_id}>
                      <td>{r.user_code} - {r.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm btn-success mr-2" onClick={() => handleApprove(r.student_id)}>✓ Duyệt</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(r.student_id)}>✗ Từ chối</button>
                      </td>
                    </tr>
                  ))}
                  {(classDetail.student_requests_info || []).filter(r => r.status === 'pending').length === 0 && (
                    <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '16px' }}>Không có yêu cầu</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Approved Students */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3>Danh sách sinh viên</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select className="form-control" style={{ width: '180px', fontSize: '12px' }} value={addStudentId} onChange={e => setAddStudentId(e.target.value)}>
                    <option value="">Chọn sinh viên</option>
                    {students.filter(s => !(classDetail.approved_students || []).includes(s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.user_code} - {s.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleAddStudent}>+ Thêm</button>
                </div>
              </div>
              <table>
                <thead><tr><th>Sinh viên</th><th></th></tr></thead>
                <tbody>
                  {(classDetail.approved_students_info || []).map(s => (
                    <tr key={s.id}>
                      <td>{s.user_code} - {s.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveStudent(s.id)}>🗑 Xoá</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Tạo lớp học</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Tên lớp</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: CT101-01" /></div>
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
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Giáo viên</label>
                <select className="form-control" value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user_code} - {t.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Phòng</label><input className="form-control" value={form.room} onChange={e => setForm({...form, room: e.target.value})} /></div>
              <div className="form-group"><label>Lịch học</label><input className="form-control" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
