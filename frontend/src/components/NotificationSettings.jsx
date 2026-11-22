import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../api/auth";
import "./Settings.css";

const NotificationSettings = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await authService.getSettings();
      setSettings({
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
      });
    } catch (err) {
      console.error("Error loading notification settings:", err);
      setError("Не вдалося завантажити налаштування");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await authService.updateNotifications({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
      });

      setMessage("Налаштування сповіщень збережено!");
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Error saving notification settings:", err);
      setError(
        err.response?.data?.message || "Не вдалося зберегти налаштування"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inspira-settings-panel">
      <h1>Налаштування повідомлень</h1>
      <p className="section-desc">
        Керуйте тим, як ви отримуєте сповіщення про активність у Inspira.
      </p>

      {message && (
        <div className="settings-message success">{message}</div>
      )}
      {error && <div className="settings-message error">{error}</div>}

      <form onSubmit={handleSave} className="settings-form">
        <div className="inspira-settings-block">
          <h3>Сповіщення</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailNotifications: e.target.checked,
                  })
                }
              />
              <span>Електронні сповіщення</span>
            </label>
            <small>Отримувати сповіщення на електронну пошту</small>
          </div>
          <div className="checkbox-group" style={{ marginTop: 16 }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pushNotifications: e.target.checked,
                  })
                }
              />
              <span>Push-сповіщення</span>
            </label>
            <small>Отримувати сповіщення на пристрої</small>
          </div>
        </div>

        <div className="settings-actions">
          <button
            type="submit"
            className="inspira-btn-primary"
            disabled={saving}
          >
            {saving ? "Збереження..." : "Зберегти зміни"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
