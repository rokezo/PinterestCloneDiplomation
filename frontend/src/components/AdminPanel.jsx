import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { adminService } from "../api/admin";
import "./AdminPanel.css";
import { messagesService } from "../api/messages";
import { useChat } from "../context/ChatContext";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { openChat } = useChat();

  const loadUsers = async (p = 1, retry = true) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(p, pageSize);
      setUsers(res.users);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error loading users", err);
      if (err.response && err.response.status === 403) {
        if (retry) {
          // try refreshing current user (which may update token) then retry once
          try {
            const { authService } = await import('../api/auth');
            await authService.getCurrentUser();
            await loadUsers(p, false);
            return;
          } catch (e) {
            // fall through to error message below
          }
        }
        setError("Недостатньо прав для доступу до адмін панелі");
      } else {
        setError("Помилка при завантаженні користувачів");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      await loadUsers(page);
    } catch (err) {
      alert("Не вдалося змінити роль");
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Деактивувати цей обліковий запис?")) return;
    try {
      await adminService.deactivateUser(userId);
      await loadUsers(page);
    } catch (err) {
      alert("Не вдалося деактивувати користувача");
    }
  };

  const handleBlock = async (userId, blocked) => {
    try {
      if (blocked) {
        await messagesService.unblockUser(userId);
      } else {
        await messagesService.blockUser(userId);
      }
      await loadUsers(page);
    } catch (err) {
      alert("Не вдалося змінити статус блокування");
    }
  };

  const handleMessage = (user) => {
    openChat({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });
  };

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    loadUsers(p);
  };

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-panel">
        <h2>Адмін панель</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>Завантаження...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Аватар</th>
                  <th>Логін</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Акції</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.isDeactivated ? "deactivated" : ""}>
                    <td>{u.id}</td>
                    <td>
                      {u.avatarUrl ? (
                        <img
                          src={
                            u.avatarUrl.startsWith('http')
                              ? u.avatarUrl
                              : `http://localhost:5001${u.avatarUrl}`
                          }
                          alt="avatar"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <span className="avatar-placeholder">
                          {u.username[0]?.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.status}</td>
                    <td>
                      <button onClick={() => handleMessage(u)}>Написати</button>
                      <button onClick={() => handleBlock(u.id, u.isBlocked)}>
                        {u.isBlocked ? "Розблокувати" : "Блокувати"}
                      </button>
                      <button onClick={() => handleDeactivate(u.id)}>
                        Деактивувати
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => gotoPage(page - 1)} disabled={page <= 1}>
                &lt;
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => gotoPage(page + 1)}
                disabled={page >= totalPages}
              >
                &gt;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
