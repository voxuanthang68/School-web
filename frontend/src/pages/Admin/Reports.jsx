import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [topGpa, setTopGpa] = useState([]);
  const [distribution, setDistribution] = useState(null);

  useEffect(() => {
    api.get('/reports/top-gpa?limit=10').then(r => setTopGpa(r.data)).catch(console.error);
    api.get('/reports/grade-distribution').then(r => setDistribution(r.data)).catch(console.error);
  }, []);

  const distData = distribution ? Object.entries(distribution).map(([k, v]) => ({ name: k, count: v })) : [];

  return (
    <div>
      <div className="page-header"><div><h1>Báo cáo</h1><p>Thống kê nhanh về hệ thống</p></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Top 10 GPA cao nhất</h3>
          <table>
            <thead><tr><th>#</th><th>Mã SV</th><th>Họ tên</th><th>GPA (4.0)</th><th>TB (10)</th><th>Số môn</th></tr></thead>
            <tbody>
              {topGpa.map((s, i) => (
                <tr key={s.student_id}>
                  <td>{i + 1}</td><td>{s.student_code}</td><td>{s.student_name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{s.avg_gpa_4}</td>
                  <td>{s.avg_score_10}</td><td>{s.total_subjects}</td>
                </tr>
              ))}
              {topGpa.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--slate-400)' }}>Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Phân bố điểm chữ</h3>
          {distData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--slate-400)', textAlign: 'center', padding: '40px' }}>Chưa có dữ liệu</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
