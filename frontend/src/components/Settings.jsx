import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { useState } from "react"; // required for help section state management
import { useAuth } from "../context/AuthContext";
import { usersService } from "../api/users";
import { authService } from "../api/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import GeneralSettings from "./GeneralSettings";
import RecommendationSettings from "./RecommendationSettings";
// connected accounts removed from menu
import PrivacySettings from "./PrivacySettings";
import NotificationSettings from "./NotificationSettings";
import "./Settings.css";

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="settings-page inspira-settings-page">
        <Navbar />
        <div className="home-layout">
          <Sidebar />
          <div className="settings-main-container inspira-settings-main" style={{ flex: 1 }}>
            <div className="inspira-settings-panel" style={{ margin: 32 }}>
              <h1>Налаштування</h1>
              <p>Будь ласка, увійдіть, щоб переглянути налаштування.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const settingsMenuItems = [
    { id: "profile", label: "Редагування профілю", path: "/settings", icon: "profile" },
    { id: "account", label: "Керування обліковими записами", path: "/settings/account", icon: "account" },
    { id: "recommendations", label: "Налаштуйте рекомендації", path: "/settings/recommendations", icon: "recommendations" },
    { id: "notifications", label: "Сповіщення", path: "/settings/notifications", icon: "notifications" },
    // removed "brand" and "connect" sections per request
    { id: "security", label: "Безпека", path: "/settings/security", icon: "security" },
    { id: "privacy", label: "Конфіденційність і дані", path: "/settings/privacy", icon: "privacy" },
    { id: "help", label: "Get help", path: "/settings/help", icon: "help" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      profile: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      account: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      visibility: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      recommendations: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      notifications: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      brand: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        </svg>
      ),
      connect: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      ),
      security: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      privacy: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      help: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  const handleItemClick = (item) => navigate(item.path);

  const isActive = (path) => {
    if (path === "/settings") return location.pathname === "/settings";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="settings-page inspira-settings-page">
      <Navbar />
      <div className="home-layout">
        <Sidebar />
        <div className="settings-main-container inspira-settings-main">
          <div className="settings-menu-container inspira-settings-menu">
            <h2 className="inspira-settings-title">Налаштування</h2>
            {settingsMenuItems.map((item) => (
              <button
                key={item.id}
                className={`settings-menu-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="settings-menu-icon">{getIcon(item.icon)}</span>
                <span className="settings-menu-label">{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-arrow">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </button>
            ))}
            <div className="inspira-settings-gear">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </div>
          </div>

          <div className="settings-content-wrapper inspira-settings-content">
            <Routes>
              <Route path="/" element={<GeneralSettings />} />
              <Route path="/account" element={<AccountManagementPlaceholder />} />
              <Route path="/recommendations" element={<RecommendationSettings />} />
              <Route path="/notifications" element={<NotificationSettings />} />
              <Route path="/security" element={<SecurityPlaceholder />} />
              <Route path="/privacy" element={<PrivacySettings />} />
              <Route path="/help" element={<HelpPlaceholder />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountManagementPlaceholder = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError("");
    if (newPwd !== confirmPwd) {
      setPwdError("Новий пароль і підтвердження не збігаються");
      return;
    }
    try {
      await authService.changePassword(currentPwd, newPwd);
      alert("Пароль успішно змінено");
      setShowPasswordForm(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      console.error("Password change error", err);
      const msg = err.response?.data?.message || "Не вдалося змінити пароль.";
      setPwdError(msg);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    if (!window.confirm("Ви впевнені, що хочете деактивувати обліковий запис? Ви зможете відновити його пізніше.")) return;
    try {
      await usersService.deactivateAccount(user.id);
      logout();
      navigate("/");
    } catch (err) {
      console.error("Error deactivating account", err);
      alert("Не вдалося деактивувати обліковий запис.");
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm("Видалити обліковий запис назавжди? Ця дія не може бути скасована.")) return;
    try {
      await usersService.deleteAccount(user.id);
      logout();
      navigate("/");
    } catch (err) {
      console.error("Error deleting account", err);
      alert("Не вдалося видалити обліковий запис.");
    }
  };

  return (
    <div className="inspira-settings-panel">
      <h1>Керування обліковими записами</h1>
      <p className="section-desc">Ви можете змінити персональні дані або тип облікового запису.</p>
      <div className="inspira-settings-block">
        <h3>Ваш обліковий запис</h3>
        <div className="form-row">
          <label>Електронна пошта</label>
          <input
            type="text"
            placeholder="email@example.com"
            value={user?.email || ''}
            readOnly
            className="inspira-input"
          />
        </div>
        <div className="form-row actions-row">
          <span>Пароль</span>
          <button className="inspira-btn-primary" onClick={() => setShowPasswordForm(true)}>
            Змінити
          </button>
        </div>
        {showPasswordForm && (
          <form className="password-form" onSubmit={handlePasswordChange}>
            <div className="form-row">
              <label>Поточний пароль</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="inspira-input"
                required
              />
            </div>
            <div className="form-row">
              <label>Новий пароль</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="inspira-input"
                required
              />
            </div>
            <div className="form-row">
              <label>Підтвердження пароля</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="inspira-input"
                required
              />
            </div>
            {pwdError && <p className="error-text">{pwdError}</p>}
            <div className="form-row actions-row">
              <button type="submit" className="inspira-btn-primary">
                Оновити
              </button>
              <button type="button" className="inspira-btn-secondary" onClick={() => setShowPasswordForm(false)}>
                Скасувати
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="inspira-settings-block">
        <h3>Деактивація та видалення</h3>
        <p>Тимчасово приховайте свій профіль, піни й дошки.</p>
        <button className="inspira-btn-primary" onClick={handleDeactivate}>
          Деактивувати обліковий запис
        </button>
        <p>
          Остаточно видаліть свої дані й усе, що пов'язано з вашим обліковим
          записом
        </p>
        <button
          className="inspira-btn-primary inspira-btn-danger"
          onClick={handleDelete}
        >
          Видалити обліковий запис
        </button>
      </div>
    </div>
  );
};





const SecurityPlaceholder = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);
  const [updating2fa, setUpdating2fa] = useState(false);

  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const res = await usersService.getSessions(user.id);
      setSessions(res.sessions || []);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load sessions", err);
      alert("Не вдалося завантажити сеанси.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (id) => {
    if (!window.confirm("Видалити цей сеанс?") ) return;
    try {
      await usersService.deleteSession(id);
      setSessions((prev) => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to revoke session", err);
      alert("Не вдалося видалити сеанс.");
    }
  };

  const toggleTwoFactor = async () => {
    setUpdating2fa(true);
    try {
      const res = await authService.changeTwoFactor(!twoFactor);
      setTwoFactor(res.enabled);
    } catch (err) {
      console.error("Failed to update 2FA", err);
      alert("Не вдалося оновити двофакторну автентифікацію.");
    } finally {
      setUpdating2fa(false);
    }
  };

  return (
    <div className="inspira-settings-panel">
      <h1>Безпека</h1>
      <p>
        Використовуйте додаткові заходи безпеки, наприклад, увімкніть двофакторну
        автентифікацію та перевірте список підключених пристроїв, щоб захистити
        обліковий запис, піни та дошки. <a href="#">Докладніше</a>
      </p>
      <div className="inspira-settings-block">
        <h3>Вхід у додатки</h3>
        <p>
          Стежте за тим, де ви використовували для входу свій профіль Inspira. <a href="#">Докладніше</a>
        </p>
        <p className="status">Ви не створили жодного додатка</p>
      </div>
      <div className="inspira-settings-block">
        <h3>Двофакторна автентифікація</h3>
        <p>Це забезпечує додатковий захист вашого облікового запису. <a href="#">Докладніше</a></p>
        <label className="switch">
          <input
            type="checkbox"
            checked={twoFactor}
            disabled={updating2fa}
            onChange={toggleTwoFactor}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="inspira-settings-block">
        <h3>Підключені пристрої</h3>
        <p>
          Ось список пристроїв, з яких ви входили у ваш обліковий запис. <a href="#">Докладніше</a>
        </p>
        <button className="inspira-btn-primary" onClick={loadSessions} disabled={loadingSessions}>
          {loadingSessions ? "Завантаження..." : "Показати сеанси"}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Сеанси</h2>
            <button className="close" onClick={() => setShowModal(false)}>×</button>
            <ul className="session-list">
              {sessions.map(s => (
                <li key={s.id}>
                  <span>{s.deviceInfo || "Невідомий пристрій"}</span>
                  <span>{new Date(s.createdAt).toLocaleString()}</span>
                  <button onClick={() => revokeSession(s.id)}>Видалити</button>
                </li>
              ))}
              {sessions.length === 0 && <li>Немає сеансів</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const HelpPlaceholder = () => {
  const helpData = [
    {
      title: "Почніть",
      items: [
        "Отримайте обліковий запис Inspira",
        "Знайдіть свій профіль",
        "Оновіть програму Inspira",
        "Типи відео на Inspira",
      ],
    },
    {
      title: "Керування обліковим записом та налаштуваннями",
      items: [
        "Вхід та вихід із Inspira",
        "Не можу увійти в Inspira",
        "Змінити налаштування персоналізації",
        "Скинути або змінити пароль",
      ],
    },
    {
      title: "Знайдіть і збережіть",
      items: [
        "Відкрийте піни або дошки",
        "Завантажити зображення або відео",
        "Обстежте Inspira",
        "Збереження відео на дошці",
      ],
    },
  ];

  const [expanded, setExpanded] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleCategory = (title) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const onClickItem = (item) => {
    // instead of a plain alert, show some generated information below
    setSelectedItem(item);
  };

  return (
    <div className="inspira-settings-panel inspira-help-panel">
      <h1>Потрібна допомога?</h1>
      <div className="help-categories">
        {helpData.map((cat) => (
          <div key={cat.title} className="help-category">
            <h4 onClick={() => toggleCategory(cat.title)} style={{ cursor: "pointer" }}>
              {cat.title}
            </h4>
            {expanded[cat.title] && (
              <ul>
                {cat.items.map((item) => (
                  <li key={item} onClick={() => onClickItem(item)}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <button
              className="inspira-btn-outline"
              onClick={() => toggleCategory(cat.title)}
            >
              {expanded[cat.title] ? "Згорнути" : "Більше"}
            </button>
          </div>
        ))}
      </div>
      {selectedItem && (
        <div className="help-detail">
          <h2>{selectedItem}</h2>
          <p>
            {helpContent[selectedItem] ||
              `Тут можна розмістити детальну інформацію щодо "${selectedItem}". ` +
              `Це згенерований приклад тексту, щоб продемонструвати, як працює сторінка довідки.`}
          </p>
          <p>
            Для повної документації відвідайте&nbsp;
            <a href="https://example.com/help" target="_blank" rel="noopener noreferrer">
              наш сайт підтримки
            </a>.
          </p>
        </div>
      )}
    </div>
  );
};

// sample help text mapping, could be expanded or replaced with real data
const helpContent = {
  "Отримайте обліковий запис Inspira":
    "Щоб створити обліковий запис, натисніть кнопку реєстрації на головній сторінці і дотримуйтеся інструкцій.",
  "Змінити налаштування персоналізації":
    "Перейдіть до налаштувань свого профілю, щоб оновити персональні уподобання та мовні налаштування.",
  // add more entries as desired
};

export default Settings;
