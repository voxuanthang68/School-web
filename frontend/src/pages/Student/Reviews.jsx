import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/reviews/').then(r => setReviews(r.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Yêu cầu phúc khảo của tôi</h1>
          <p>Theo dõi các yêu cầu phúc khảo đã gửi</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Lớp</th>
                <th>Lý do</th>
                <th>Điểm cũ &rarr; mới</th>
                <th>Trạng thái</th>
                <th>Phản hồi</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>[{r.subject_name}] {r.semester_name || ''}</td>
                  <td>{r.class_name}</td>
                  <td style={{ maxWidth: '250px' }}>{r.reason}</td>
                  <td>{r.old_score || '-'} &rarr; {r.new_score || '-'}</td>
                  <td>
                    <span 
                      style={{ 
                        backgroundColor: r.status === 'resolved' ? '#3b82f6' : r.status === 'rejected' ? '#ef4444' : r.status === 'processing' ? '#eff6ff' : '#fff',
                        border: `1px solid ${r.status === 'resolved' || r.status === 'rejected' ? 'transparent' : r.status === 'pending' ? '#d1d5db' : '#bfdbfe'}`, 
                        borderRadius: '4px', 
                        padding: '2px 8px', 
                        fontSize: '12px',
                        color: r.status === 'resolved' || r.status === 'rejected' ? '#fff' : r.status === 'pending' ? '#4b5563' : '#1d4ed8'
                      }}
                    >
                      {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'processing' ? 'Đang xử lý' : r.status === 'resolved' ? 'Đã giải quyết' : r.status === 'rejected' ? 'Từ chối' : r.status}
                    </span>
                  </td>
                  <td>{r.result || '-'}</td>
                  <td style={{ color: 'var(--slate-500)', fontSize: '13px' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '-'}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '32px', color: 'var(--slate-400)' }}>
                    Chưa có yêu cầu phúc khảo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentReviews;
