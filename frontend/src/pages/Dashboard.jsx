import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, UserCheck, BookOpen, Calendar, School, FileSearch, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);

  const [studentGrades, setStudentGrades] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/reports/dashboard').then(r => setStats(r.data)).catch(console.error);
      api.get('/reports/grade-distribution').then(r => setDistribution(r.data)).catch(console.error);
    } else if (user?.role === 'student') {
      api.get('/grades/my').then(r => setStudentGrades(r.data)).catch(console.error);
    }
  }, [user]);

  if (user?.role === 'student') {
    const needImprovement = studentGrades.filter(g => g.is_pass === false || (g.is_pass === null && g.status === 'draft'));

    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Kết quả học tập</h1>
            <p>Xem nhanh tất cả môn học và các môn cần cải thiện</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>
             <span style={{ fontSize: '18px', fontWeight: '700' }}>Điểm tất cả các môn</span>
             <br/><span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--slate-500)' }}>Bao gồm học kỳ và trạng thái bảng điểm</span>
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Học kỳ</th>
                  <th>Điểm 10</th>
                  <th>Điểm 4</th>
                  <th>Chữ</th>
                  <th>Pass/Fail</th>
                  <th>Trạng thái bảng điểm</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{g.subject_name || g.subject_code}</td>
                    <td>{g.semester_name} ({g.semester_year})</td>
                    <td>{g.final_score_10 != null ? g.final_score_10 : '—'}</td>
                    <td>{g.final_score_4 != null ? parseFloat(g.final_score_4).toFixed(2) : '—'}</td>
                    <td>{g.letter_grade || '—'}</td>
                    <td>
                      {g.is_pass != null ? (
                        <span style={{ color: g.is_pass ? 'inherit' : 'var(--danger)', fontWeight: g.is_pass ? 400 : 600 }}>
                          {g.is_pass ? 'Pass' : 'Chưa có'}
                        </span>
                      ) : g.status === 'approved' && g.is_pass ? 'Pass' : g.status === 'draft' ? 'Chưa có' : 'Chưa có'}
                    </td>
                    <td>{g.status}</td>
                  </tr>
                ))}
                {studentGrades.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)' }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>Môn cần cải thiện</span>
             <br/><span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--slate-500)' }}>Hiển thị các môn chưa đạt hoặc chưa có kết quả</span>
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Học kỳ</th>
                  <th>Điểm 10</th>
                  <th>Điểm 4</th>
                  <th>Chữ</th>
                  <th>Pass/Fail</th>
                </tr>
              </thead>
              <tbody>
                {needImprovement.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{g.subject_name || g.subject_code}</td>
                    <td>{g.semester_name} ({g.semester_year})</td>
                    <td>{g.final_score_10 != null ? g.final_score_10 : '—'}</td>
                    <td>{g.final_score_4 != null ? parseFloat(g.final_score_4).toFixed(2) : '—'}</td>
                    <td>{g.letter_grade || '—'}</td>
                    <td>
                      <span style={{ color: g.is_pass === false ? 'var(--danger)' : 'inherit', fontWeight: g.is_pass === false ? 600 : 400 }}>
                        {g.is_pass === false ? 'Rớt' : 'Chưa có'}
                      </span>
                    </td>
                  </tr>
                ))}
                {needImprovement.length === 0 && (
                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)' }}>Không có môn nào cần cải thiện</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Teacher / Admin default dashboard
  if (user?.role === 'admin') {
    const distData = distribution ? Object.entries(distribution).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0) : [];

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>TỔNG QUAN</div>
        <h1 style={{ marginBottom: '24px' }}>Bảng điều khiển</h1>

        {stats && (
          <>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-card-icon"><Users size={24} /></div>
                <div><div className="stat-card-label">Sinh viên</div><div className="stat-card-value">{stats.students}</div></div>
              </div>
              <div className="stat-card green">
                <div className="stat-card-icon"><UserCheck size={24} /></div>
                <div><div className="stat-card-label">Giáo viên</div><div className="stat-card-value">{stats.teachers}</div></div>
              </div>
              <div className="stat-card orange">
                <div className="stat-card-icon"><BookOpen size={24} /></div>
                <div><div className="stat-card-label">Môn học</div><div className="stat-card-value">{stats.subjects}</div></div>
              </div>
              <div className="stat-card purple">
                <div className="stat-card-icon"><Calendar size={24} /></div>
                <div><div className="stat-card-label">Học kỳ</div><div className="stat-card-value">{stats.semesters}</div></div>
              </div>
            </div>

            <div className="info-cards-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="info-card">
                <div className="info-card-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}><School size={20} /></div>
                <div><div className="info-card-value">{stats.open_classes}</div><div className="info-card-label">Lớp đang mở</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><Calendar size={20} /></div>
                <div><div className="info-card-value">{stats.open_semesters}</div><div className="info-card-label">HK đang mở</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><FileSearch size={20} /></div>
                <div><div className="info-card-value">{stats.pending_reviews}</div><div className="info-card-label">Phúc khảo đợi</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}><FileSearch size={20} /></div>
                <div><div className="info-card-value">{stats.processing_reviews}</div><div className="info-card-label">Đang xử lý</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircle size={20} /></div>
                <div>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Đậu: {stats.pass_rate}%</span>
                    {' - '}
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ Rớt: {stats.fail_rate}%</span>
                  </div>
                  <div className="info-card-label">Tỉ lệ đậu/rớt</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Biểu đồ tổng quan</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Sinh viên', value: stats.students },
                    { name: 'Giáo viên', value: stats.teachers },
                    { name: 'Môn học', value: stats.subjects },
                    { name: 'Học kỳ', value: stats.semesters },
                  ]}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--primary-600)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Phân bố điểm chữ</h3>
                {distData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: 'var(--slate-400)', textAlign: 'center', padding: '40px' }}>Chưa có dữ liệu điểm</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Teacher / Student simple dashboard
  return (
    <div>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>TỔNG QUAN</div>
      <h1 style={{ marginBottom: '16px' }}>Xin chào, {user?.name}</h1>
      <p style={{ color: 'var(--slate-500)' }}>
        {user?.role === 'teacher' ? 'Chào mừng giảng viên! Vui lòng chọn mục bên trái để bắt đầu.' : 'Chào mừng sinh viên! Tra cứu điểm và đăng ký lớp từ menu bên trái.'}
      </p>
    </div>
  );
};

export default Dashboard;
