import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeacherGradeEntryFilter = () => {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [gradeItems, setGradeItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reviewConfig, setReviewConfig] = useState(null);

  useEffect(() => {
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
    api.get('/classes/').then(r => setAllClasses(r.data));
    api.get('/reviews/config').then(r => setReviewConfig(r.data)).catch(console.error);
  }, []);

  // Filter classes by selected subject/semester
  useEffect(() => {
    let filtered = allClasses;
    if (selectedSubject) {
      const subj = subjects.find(s => s.id === selectedSubject);
      if (subj) filtered = filtered.filter(c => c.subject_name === subj.name || c.subject_id === selectedSubject);
    }
    if (selectedSemester) {
      const sem = semesters.find(s => s.id === selectedSemester);
      if (sem) filtered = filtered.filter(c => c.semester_id === selectedSemester || (c.semester_name === sem.name && String(c.semester_year) === String(sem.year)));
    }
    setClasses(filtered);
  }, [selectedSubject, selectedSemester, allClasses, subjects, semesters]);

  const handleLoad = async () => {
    if (!selectedClass) { alert('Vui lòng chọn lớp học'); return; }
    try {
      const classRes = await api.get(`/classes/${selectedClass}`);
      const gradesRes = await api.get(`/grades/class/${selectedClass}`);
      setGradeItems(gradesRes.data.grade_items || []);
      setStatus(gradesRes.data.status || 'draft');

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
          status: existing?.status || gradesRes.data.status || 'draft',
        };
      });
      setGrades(gradesList);
      setLoaded(true);
    } catch (err) { console.error(err); alert('Lỗi tải dữ liệu'); }
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
      await api.put(`/grades/class/${selectedClass}`, payload);
      await handleLoad();
      alert('Đã lưu điểm!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi khi lưu'); }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!confirm('Nộp bảng điểm để admin duyệt?')) return;
    try {
      await api.post(`/grades/class/${selectedClass}/submit`);
      await handleLoad();
      alert('Đã nộp bảng điểm!');
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const canEdit = status === 'draft';

  // Find active review period
  const activePeriod = reviewConfig?.periods?.find(p => p.status === 'open');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nhập điểm</h1>
          <p>Cập nhật điểm thành phần và duyệt kết quả</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Môn học</label>
            <select className="form-control" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedClass(''); setLoaded(false); }}>
              <option value="">Tất cả</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Học kỳ</label>
            <select className="form-control" value={selectedSemester} onChange={e => { setSelectedSemester(e.target.value); setSelectedClass(''); setLoaded(false); }}>
              <option value="">Tất cả</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Lớp học</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleLoad} style={{ marginBottom: 0 }}>Tải danh sách</button>
        </div>
      </div>

      {loaded ? (
        <>
          {activePeriod ? (
            <div style={{ backgroundColor: '#0ea5e9', color: '#fff', padding: '16px 24px', marginBottom: '24px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Đang mở phúc khảo</h3>
              <p style={{ fontSize: '13px' }}>Từ {activePeriod.start_date} đến {activePeriod.end_date}. Giáo viên có thể nhập lại điểm cho các yêu cầu phúc khảo hợp lệ.</p>
            </div>
          ) : null}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Lớp</th>
                  {gradeItems.map(item => <th key={item.name}>{item.name} ({item.weight}%)</th>)}
                  <th>Trạng thái</th>
                  <th>Phúc khảo</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.student_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.student_code}</div>
                      <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{g.student_name}</div>
                    </td>
                    <td>{allClasses.find(c => c.id === selectedClass)?.name || '-'}</td>
                    {gradeItems.map(item => (
                      <td key={item.name}>
                        <input
                          type="number"
                          className="grade-input"
                          min="0" max="10" step="0.1"
                          style={{ backgroundColor: !canEdit ? '#f8fafc' : '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', width: '60px' }}
                          value={g.scores[item.name] ?? ''}
                          onChange={e => handleScoreChange(g.student_id, item.name, e.target.value)}
                          disabled={!canEdit}
                        />
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                         <span style={{ fontWeight: 600, color: '#334155' }}>{g.status === 'approved' ? 'Đã duyệt' : g.status === 'submitted' ? 'Đã nộp' : g.status === 'draft' ? 'Nháp' : g.status === 'N/A' ? 'N/A' : (g.status || '-')}</span>
                         <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {g.is_pass != null ? `${g.is_pass ? 'Pass' : 'Fail'} (${g.letter_grade || '-'})` : '- (-)'}
                         </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                    </td>
                  </tr>
                ))}
                {grades.length === 0 && (
                  <tr><td colSpan={3 + gradeItems.length} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Không có sinh viên trong lớp này hoặc chưa có cấu hình điểm cho môn học này.</td></tr>
                )}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px' }}>
            {canEdit && <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu nháp'}</button>}
            {canEdit && grades.length > 0 && <button className="btn btn-success" onClick={handleSubmit}>📤 Nộp duyệt</button>}
          </div>
        </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--slate-400)' }}>
          Chọn môn học, học kỳ và lớp để tải bảng điểm nhập cho học kỳ này.
        </div>
      )}
    </div>
  );
};

export default TeacherGradeEntryFilter;
