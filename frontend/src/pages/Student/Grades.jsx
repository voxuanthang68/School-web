import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    api.get('/semesters/').then(r => setSemesters(r.data));
    fetchGrades();
  }, []);

  useEffect(() => { fetchGrades(); }, [selectedSemester]);

  const fetchGrades = async () => {
    const params = selectedSemester ? `?semester_id=${selectedSemester}` : '';
    const r = await api.get(`/grades/my${params}`);
    setGrades(r.data);
  };

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge badge-success">Đã duyệt</span>;
    if (s === 'submitted') return <span className="badge badge-warning">Chờ duyệt</span>;
    if (s === 'draft') return <span className="badge badge-slate">Nháp</span>;
    return <span className="badge badge-slate">N/A</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Xem điểm</h1><p>Bảng điểm cá nhân theo học kỳ</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Học kỳ:</label>
          <select className="form-control" style={{ width: '200px' }} value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
            <option value="">Tất cả</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
          </select>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px', color: 'var(--slate-400)' }}>
          <p>Chưa có dữ liệu điểm cho học kỳ này.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Lớp</th>
                <th>Tín chỉ</th>
                <th>Điểm thành phần</th>
                <th>Điểm cuối (10)</th>
                <th>Thang 4</th>
                <th>Chữ</th>
                <th>Kết quả</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{g.subject_code} - {g.subject_name}</td>
                  <td>{g.class_name}</td>
                  <td>{g.credits}</td>
                  <td>
                    {g.grade_items && g.grade_items.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {g.grade_items.map(item => (
                          <span key={item.name} className="badge badge-info" style={{ fontSize: '11px' }}>
                            {item.name}: {g.scores?.[item.name] ?? '-'}
                          </span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '15px' }}>{g.final_score_10 != null ? g.final_score_10 : '-'}</td>
                  <td>{g.final_score_4 != null ? g.final_score_4 : '-'}</td>
                  <td><span className="badge badge-primary">{g.letter_grade || '-'}</span></td>
                  <td>
                    {g.is_pass != null ? (
                      <span className={`badge ${g.is_pass ? 'badge-success' : 'badge-danger'}`}>
                        {g.is_pass ? '✓ Đậu' : '✗ Rớt'}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{statusBadge(g.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
