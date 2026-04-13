import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherGrades = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/grades/class/${classId}`).then(r => setData(r.data)); }, [classId]);

  if (!data) return <p>Đang tải...</p>;

  const exportGrades = async (fmt) => {
    try {
      const res = await api.get(`/grades/export/${fmt}/${classId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades_${classId}.${fmt}`;
      link.click();
    } catch (err) { alert('Lỗi xuất file'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng điểm lớp</h1>
          <p>Trạng thái: {data.status === 'approved' ? <span className="badge badge-success">Đã duyệt</span> : data.status === 'submitted' ? <span className="badge badge-warning">Chờ duyệt</span> : <span className="badge badge-slate">Nháp</span>}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Quay lại</button>
          <button className="btn btn-success" onClick={() => exportGrades('xlsx')}>📥 Xuất Excel</button>
          <button className="btn btn-outline" onClick={() => exportGrades('csv')}>📥 CSV</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã SV</th><th>Họ tên</th>
              {(data.grade_items || []).map(item => <th key={item.name}>{item.name} ({item.weight}%)</th>)}
              <th>Điểm cuối</th><th>Thang 4</th><th>Chữ</th><th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {(data.grades || []).map(g => (
              <tr key={g.student_id}>
                <td>{g.student_code}</td><td>{g.student_name}</td>
                {(data.grade_items || []).map(item => <td key={item.name}>{g.scores?.[item.name] ?? '-'}</td>)}
                <td style={{ fontWeight: 700 }}>{g.final_score_10 ?? '-'}</td>
                <td>{g.final_score_4 ?? '-'}</td>
                <td><span className="badge badge-primary">{g.letter_grade || '-'}</span></td>
                <td><span className={`badge ${g.is_pass ? 'badge-success' : 'badge-danger'}`}>{g.is_pass ? 'Đậu' : 'Rớt'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherGrades;
