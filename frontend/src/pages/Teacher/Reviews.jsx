import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [reviewConfig, setReviewConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { 
    api.get('/reviews/').then(r => setReviews(r.data)); 
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/reviews/config').then(r => setReviewConfig(r.data)).catch(console.error);
  }, []);

  const handleOpenUpdate = (r) => {
    setSelectedReview(r);
    setUpdateStatus(r.status);
    setShowModal(true);
  };

  const submitUpdate = async () => {
    if (!selectedReview) return;
    await api.put(`/reviews/${selectedReview.id}`, { status: updateStatus, result: updateStatus === 'resolved' ? 'Đã xử lý' : '' });
    const r = await api.get('/reviews/');
    setReviews(r.data);
    setShowModal(false);
  };

  const handleFilter = () => {
    // Implement filter logic based on selectedSubject and selectedSemester
    // For now we'll just mock it or rely on backend parameters if supported
    // e.g. api.get(`/reviews/?subject_id=${selectedSubject}&semester_id=${selectedSemester}`)
    api.get('/reviews/').then(r => {
      let filtered = r.data;
      if (selectedSubject) filtered = filtered.filter(f => f.subject_id === selectedSubject || f.subject_name === subjects.find(s=>s.id===selectedSubject)?.name);
      if (selectedSemester) filtered = filtered.filter(f => f.semester_id === selectedSemester || f.semester_name === semesters.find(s=>s.id===selectedSemester)?.name);
      setReviews(filtered);
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Yêu cầu phúc khảo</h1>
          <p>Xử lý yêu cầu phúc khảo của sinh viên</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
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
        <button className="btn btn-primary" onClick={handleFilter} style={{ marginBottom: 0, padding: '8px 48px' }}>Lọc</button>
      </div>

      <div className="card">
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Tổng {reviews.length} yêu cầu</div>
          <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
            {(() => {
              const activePeriod = reviewConfig?.periods?.find(p => p.status === 'open');
              return activePeriod
                ? `Đợt phúc khảo đang mở: ${activePeriod.start_date} - ${activePeriod.end_date}`
                : 'Không có đợt phúc khảo đang mở';
            })()}
          </div>
        </div>
        
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Lớp</th>
                <th>Lý do</th>
                <th>Điểm cũ &rarr; mới</th>
                <th>Trạng thái</th>
                <th>Phản hồi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>[{r.student_code}] {r.student_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{r.subject_name} - {r.semester_name || ''}</div>
                  </td>
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
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenUpdate(r)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        &#9998; Cập nhật
                      </button>
                      <button 
                        onClick={() => navigate(`/teacher/grade-entry`)} // mock navigate to entry
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        &#10065; Nhập điểm
                      </button>
                    </div>
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

      {showModal && selectedReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 'bold' }}>Cập nhật yêu cầu</h2>
            
            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
              <strong>Sinh viên:</strong> {selectedReview.student_name}
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <select className="form-control" style={{ width: '100%' }} value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button 
                onClick={submitUpdate}
                style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
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

export default TeacherReviews;
