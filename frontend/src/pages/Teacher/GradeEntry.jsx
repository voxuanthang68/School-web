import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GradeEntry = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [gradeItems, setGradeItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [classId]);

  const fetchData = async () => {
    try {
      const classRes = await api.get(`/classes/${classId}`);
      setClassInfo(classRes.data);

      const gradesRes = await api.get(`/grades/class/${classId}`);
      setGradeItems(gradesRes.data.grade_items || []);
      setStatus(gradesRes.data.status || 'draft');

      // Build grades array from approved students
      const students = classRes.data.approved_students_info || [];
      const existingGrades = gradesRes.data.grades || [];

      const gradesMap = {};
      existingGrades.forEach(g => { gradesMap[g.student_id] = g; });

      const gradesList = students.map(s => {
        const existing = gradesMap[s.id];
        const scores = {};
        (gradesRes.data.grade_items || []).forEach(item => {
          scores[item.name] = existing?.scores?.[item.name] ?? '';
        });
        return {
          student_id: s.id,
          student_name: s.name,
          student_code: s.user_code,
          scores,
          final_score_10: existing?.final_score_10,
          letter_grade: existing?.letter_grade,
          is_pass: existing?.is_pass,
        };
      });
      setGrades(gradesList);
    } catch (err) { console.error(err); }
  };

  const handleScoreChange = (studentId, itemName, value) => {
    setGrades(prev => prev.map(g => {
      if (g.student_id !== studentId) return g;
      return { ...g, scores: { ...g.scores, [itemName]: value } };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        grades: grades.map(g => ({
          student_id: g.student_id,
          scores: Object.fromEntries(
            Object.entries(g.scores).map(([k, v]) => [k, v === '' ? null : parseFloat(v)])
          )
        }))
      };
      await api.put(`/grades/class/${classId}`, payload);
      await fetchData();
      alert('Đã lưu điểm!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi khi lưu'); }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!confirm('Nộp bảng điểm để admin duyệt?')) return;
    try {
      await api.post(`/grades/class/${classId}/submit`);
      await fetchData();
      alert('Đã nộp bảng điểm!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const canEdit = status === 'draft';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nhập điểm - {classInfo?.name}</h1>
          <p>{classInfo?.subject_name} | {classInfo?.semester_name} ({classInfo?.semester_year})</p>
          <div className="mt-2">
            Trạng thái: {status === 'draft' && <span className="badge badge-slate">Nháp</span>}
            {status === 'submitted' && <span className="badge badge-warning">Đã nộp - Chờ duyệt</span>}
            {status === 'approved' && <span className="badge badge-success">Đã duyệt</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Quay lại</button>
          {canEdit && <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu nháp'}</button>}
          {canEdit && grades.length > 0 && <button className="btn btn-success" onClick={handleSubmit}>📤 Nộp duyệt</button>}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã SV</th>
              <th>Họ tên</th>
              {gradeItems.map(item => <th key={item.name}>{item.name} ({item.weight}%)</th>)}
              <th>Điểm cuối</th>
              <th>Chữ</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(g => (
              <tr key={g.student_id}>
                <td>{g.student_code}</td>
                <td>{g.student_name}</td>
                {gradeItems.map(item => (
                  <td key={item.name}>
                    <input
                      type="number"
                      className="grade-input"
                      min="0"
                      max="10"
                      step="0.1"
                      value={g.scores[item.name] ?? ''}
                      onChange={e => handleScoreChange(g.student_id, item.name, e.target.value)}
                      disabled={!canEdit}
                    />
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{g.final_score_10 != null ? g.final_score_10 : '-'}</td>
                <td><span className="badge badge-primary">{g.letter_grade || '-'}</span></td>
                <td>
                  {g.is_pass != null && (
                    <span className={`badge ${g.is_pass ? 'badge-success' : 'badge-danger'}`}>
                      {g.is_pass ? 'Đậu' : 'Rớt'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeEntry;
