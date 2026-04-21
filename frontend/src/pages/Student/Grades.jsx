import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Review Modal State
  const [showModal, setShowModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ grade_id: '', subject_name: '', reason: '' });
  const [reviewConfig, setReviewConfig] = useState(null);

  useEffect(() => {
    api.get('/semesters/').then(r => setSemesters(r.data));
    fetchGrades();
    fetchReviews();
    api.get('/reviews/config').then(r => setReviewConfig(r.data)).catch(console.error);
  }, []);

  const fetchReviews = async () => {
    try {
      const r = await api.get('/reviews/');
      setReviews(r.data);
    } catch(err) { console.error(err); }
  };

  const fetchGrades = async () => {
    const params = selectedSemester ? `?semester_id=${selectedSemester}` : '';
    const r = await api.get(`/grades/my${params}`);
    setGrades(r.data);
  };

  const handleOpenReview = (g) => {
    setReviewForm({ grade_id: g.grade_id, subject_name: g.subject_name || g.subject_code, reason: '' });
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }
    if (!reviewForm.grade_id) {
      alert('Không tìm thấy bản điểm để phúc khảo');
      return;
    }
    try {
      await api.post('/reviews/', { grade_id: reviewForm.grade_id, reason: reviewForm.reason });
      setShowModal(false);
      fetchReviews();
      alert('Đã gửi yêu cầu phúc khảo!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi gửi phúc khảo'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Kết quả học tập của tôi</h1>
          <p>Theo dõi điểm số từng học kỳ</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>Học kỳ</label>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select className="form-control" style={{ width: '250px' }} value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
            <option value="">Tất cả học kỳ</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchGrades} style={{ width: '100px' }}>Xem</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Điểm thành phần</th>
                <th>Điểm 10</th>
                <th>Điểm 4</th>
                <th>Chữ</th>
                <th>Pass/Fail</th>
                <th>Trạng thái bảng điểm</th>
                <th>Phúc khảo</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => {
                const parts = g.grade_items?.map(item => `${item.name}: ${g.scores?.[item.name] != null ? parseFloat(g.scores[item.name]).toFixed(2) : '-'}`).join(', ') || '';
                const review = reviews.find(r => r.grade_id === g.grade_id);

                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{g.subject_name || g.subject_code}</td>
                    <td>
                      {parts ? (
                        <span style={{ backgroundColor: '#fff', color: '#4b5563', padding: '4px 0', fontSize: '13px' }}>
                          {parts}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{g.final_score_10 != null ? parseFloat(g.final_score_10).toFixed(2) : '-'}</td>
                    <td>{g.final_score_4 != null ? parseFloat(g.final_score_4).toFixed(2) : '-'}</td>
                    <td>{g.letter_grade || '-'}</td>
                    <td>{g.is_pass != null ? (g.is_pass ? 'Pass' : 'Fail') : '-'}</td>
                    <td>{g.status === 'approved' ? 'Đã duyệt' : g.status === 'submitted' ? 'Đã nộp' : g.status === 'draft' ? 'Nháp' : g.status === 'N/A' ? 'N/A' : (g.status || '-')}</td>
                    <td style={{ fontSize: '13px', width: '220px' }}>
                      {review ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <div style={{ color: '#64748b' }}>Trạng thái: <span style={{ color: '#475569', fontWeight: 500 }}>{review.status === 'pending' ? 'Chờ xử lý' : review.status === 'processing' ? 'Đang xử lý' : review.status === 'resolved' ? 'Đã giải quyết' : review.status === 'rejected' ? 'Từ chối' : review.status}</span></div>
                          <div style={{ display: 'inline-block', padding: '2px 6px', border: '1px solid #bae6fd', backgroundColor: '#e0f2fe', borderRadius: '4px', color: '#0369a1', fontSize: '11px' }}>
                            {(() => {
                              const p = reviewConfig?.periods?.find(p => p.status === 'open');
                              return p ? `Phúc khảo từ ${p.start_date} đến ${p.end_date}` : 'Phúc khảo';
                            })()}
                          </div>
                          {review.result && <div style={{ color: '#64748b', fontSize: '12px' }}>Phản hồi: {review.result}</div>}
                        </div>
                      ) : g.status === 'approved' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <div style={{ padding: '2px 6px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', borderRadius: '4px', color: '#0369a1', fontSize: '11px' }}>
                            {(() => {
                              const p = reviewConfig?.periods?.find(p => p.status === 'open');
                              return p ? `Phúc khảo từ ${p.start_date} đến ${p.end_date}` : 'Phúc khảo';
                            })()}
                          </div>
                          <button 
                            onClick={() => handleOpenReview(g)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                          >
                             <span style={{ color: '#3b82f6' }}>&#9998;</span> Yêu cầu phúc khảo
                          </button>
                        </div>
                      ) : g.status === 'submitted' ? (
                        <span style={{ color: 'var(--slate-400)' }}>Ngoài thời gian phúc khảo</span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
              {grades.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)' }}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', backgroundColor: '#fff', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>Lịch sử phúc khảo</h3>
        {reviews.length > 0 ? (
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Môn học</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Lý do</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Điểm cũ &rarr; mới</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Phản hồi</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ fontWeight: 600, padding: '16px' }}>{r.subject_name}</td>
                    <td style={{ padding: '16px', fontSize: '13px' }}>{r.reason}</td>
                    <td style={{ padding: '16px', fontSize: '13px' }}>{r.old_score || '-'} &rarr; {r.new_score || '-'}</td>
                    <td style={{ padding: '16px' }}>
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
                    <td style={{ padding: '16px', fontSize: '13px' }}>{r.result || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>
                      {new Date(r.created_at + 'Z').toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--slate-500)' }}>Chưa có yêu cầu phúc khảo.</p>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '450px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Yêu cầu phúc khảo</h2>
            <div style={{ marginBottom: '16px', fontWeight: 600}}>Môn: <span style={{ fontWeight: 400 }}>{reviewForm.subject_name}</span></div>
            <textarea 
              autoFocus
              className="form-control" 
              rows="4" 
              placeholder="Nhập lý do phúc khảo của bạn..."
              value={reviewForm.reason}
              onChange={e => setReviewForm({...reviewForm, reason: e.target.value})}
              style={{ width: '100%', marginBottom: '24px', padding: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button 
                onClick={handleSubmitReview}
                style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
