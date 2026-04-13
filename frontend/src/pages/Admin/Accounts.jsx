import { useState, useEffect } from 'react';
import api from '../../services/api';

const Accounts = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', password: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await api.get('/users/');
    setUsers(res.data);
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        await api.post('/users/create', { ...form, password: form.password || '123456' });
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: 'student', password: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tài khoản</h1>
          <p>Chỉnh sửa tên hiển thị của tài khoản (chỉ admin)</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}>
              <option>10</option><option>25</option><option>50</option>
            </select> dòng
          </div>
          <div className="table-search">
            Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <table>
          <thead>
            <tr><th>ID</th><th>Tên</th><th>Email</th><th>Vai trò</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map((u, i) => (
              <tr key={u.id}>
                <td>{(page - 1) * perPage + i + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'teacher' ? 'badge-info' : 'badge-success'}`}>{u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Teacher' : 'Student'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEdit(u)}>✎ Sửa tên</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-pagination">
          <span>Showing {(page-1)*perPage+1} to {Math.min(page*perPage, filtered.length)} of {filtered.length} entries</span>
          <div className="table-pagination-buttons">
            <button onClick={() => setPage(Math.max(1, page-1))}>«</button>
            {Array.from({length: Math.min(totalPages, 7)}, (_, i) => i + 1).map(p => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page+1))}>»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editUser ? 'Sửa tài khoản' : 'Thêm tài khoản'}</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Tên</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="form-group"><label>Vai trò</label><select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option></select></div>
              {!editUser && <div className="form-group"><label>Mật khẩu</label><input type="password" className="form-control" placeholder="Mặc định: 123456" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
