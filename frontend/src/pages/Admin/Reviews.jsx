import { useState, useEffect } from 'react';
import api from '../../services/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    api.get('/reviews/').then(r => setReviews(r.data));
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
  }, []);

  const fetchReviews = async () => {
    const r = await api.get('/reviews/');
    setReviews(r.data);
  };

  const handleUpdate = async (id, status, result) => {
    await api.put(`/reviews/${id}`, { status, result });
    fetchReviews();
  };

  // Filter by subject/semester (client side since reviews have class info)
  const filtered = reviews.filter(r => {
    if (selectedSubject) {
      const subj = subjects.find(s => s.id === selectedSubject);
      if (subj && r.subject_name !== subj.name) return false;
    }
    if (selectedSemester) {
      const sem = semesters.find(s => s.id === selectedSemester);
      if (sem && r.semester_name !== sem.name) return false;
    }
    return true;
  });

  const statusBadge = (s) => {
    if (s === 'pending') return <span className="badge badge-warning">Chờ xử lý</span>;
    if (s === 'processing') return <span className="badge badge-info">Đang xử lý</span>;
    return <span className="badge badge-success">Đã giải quyết</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Yêu cầu phúc khảo</h1>
          <p>Xử lý yêu cầu phúc khảo của sinh viên</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Môn học</label>
            <select className="form-control" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">Tất cả</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Học kỳ</label>
            <select className="form-control" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
              <option value="">Tất cả</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchReviews}>Lọc</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700 }}>Tổng {filtered.length} yêu cầu</div>
        <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '4px' }}>
          Ngoài thời gian phúc khảo, không thể chỉnh sửa điểm đã duyệt.
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Sinh viên</th><th>Lớp</th><th>Lý do</th><th>Điểm cũ → mới</th><th>Trạng thái</th><th>Phản hồi</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.student_code} - {r.student_name}</td>
                <td>{r.class_name}</td>
                <td style={{ maxWidth: '200px' }}>{r.reason}</td>
                <td>{r.old_score || '-'} → {r.new_score || '-'}</td>
                <td>{statusBadge(r.status)}</td>
                <td>{r.result || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  {r.status === 'pending' && <button className="btn btn-sm btn-primary mr-2" onClick={() => handleUpdate(r.id, 'processing', '')}>▶ Xử lý</button>}
                  {r.status === 'processing' && <button className="btn btn-sm btn-success" onClick={() => handleUpdate(r.id, 'resolved', 'Đã xử lý')}>✓ Hoàn tất</button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Không có yêu cầu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reviews;
