import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ grade_id: '', reason: '' });

  useEffect(() => {
    api.get('/reviews/').then(r => setReviews(r.data));
    api.get('/grades/my').then(r => setGrades(r.data));
  }, []);

  const handleSubmit = async () => {
    try {
      await api.post('/reviews/', form);
      setShowModal(false);
      setForm({ grade_id: '', reason: '' });
      const r = await api.get('/reviews/');
      setReviews(r.data);
      alert('Đã gửi yêu cầu phúc khảo!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  // Get grade_id from grades/my — we need to find grades that have an id
  // Since /grades/my returns class-level data, we need the grade document id
  // For now, student reviews use the grade_id from the grades collection
  // We'll need to adjust - for simplicity let's get the grades with IDs

  return (
    <div>
      <div className="page-header">
        <div><h1>Phúc khảo</h1><p>Gửi yêu cầu phúc khảo điểm</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Gửi phúc khảo</button>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Lớp</th><th>Môn</th><th>Lý do</th><th>Trạng thái</th><th>Kết quả</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td>{r.class_name}</td><td>{r.subject_name}</td><td>{r.reason}</td>
                <td>
                  <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'processing' ? 'badge-info' : 'badge-success'}`}>
                    {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'processing' ? 'Đang xử lý' : 'Đã giải quyết'}
                  </span>
                </td>
                <td>{r.result || '-'}</td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan="5" className="text-center" style={{ padding: '32px', color: 'var(--slate-400)' }}>Chưa có yêu cầu phúc khảo</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Gửi yêu cầu phúc khảo</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Chọn môn (điểm đã có)</label>
                <select className="form-control" value={form.grade_id} onChange={e => setForm({...form, grade_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {grades.filter(g => g.status === 'approved').map(g => (
                    <option key={g.class_id} value={g.class_id}>{g.subject_name} - {g.class_name} (Điểm: {g.final_score_10})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lý do phúc khảo</label>
                <textarea className="form-control" rows="4" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Mô tả lý do..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSubmit}>📤 Gửi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReviews;
