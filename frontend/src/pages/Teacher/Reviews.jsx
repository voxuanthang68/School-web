import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api.get('/reviews/').then(r => setReviews(r.data)); }, []);

  const handleUpdate = async (id, status) => {
    await api.put(`/reviews/${id}`, { status, result: status === 'resolved' ? 'Đã xử lý' : '' });
    const r = await api.get('/reviews/');
    setReviews(r.data);
  };

  return (
    <div>
      <div className="page-header"><div><h1>Phúc khảo</h1><p>Yêu cầu phúc khảo từ sinh viên</p></div></div>
      <div className="table-container">
        <table>
          <thead><tr><th>Mã SV</th><th>Sinh viên</th><th>Lớp</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td>{r.student_code}</td><td>{r.student_name}</td><td>{r.class_name}</td>
                <td>{r.reason}</td>
                <td><span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'processing' ? 'badge-info' : 'badge-success'}`}>{r.status}</span></td>
                <td>
                  {r.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(r.id, 'processing')}>▶ Xử lý</button>}
                  {r.status === 'processing' && <button className="btn btn-sm btn-success" onClick={() => handleUpdate(r.id, 'resolved')}>✓ Hoàn tất</button>}
                </td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan="6" className="text-center" style={{ padding: '32px', color: 'var(--slate-400)' }}>Chưa có yêu cầu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherReviews;
