import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

const AuthModal = ({ isOpen, onClose, initialMode = 'login', addAsNewAccount = false }) => {
  const [mode, setMode] = useState(initialMode)
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(0); // 0=email, 1=code, 2=new password
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })
  const [validationErrors, setValidationErrors] = useState({})
  const { login, register, googleLogin, error } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}

    if (!formData.email) {
      errors.email = 'Електронна пошта обов\'язкова'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Невірна електронна пошта'
    }

    if (mode === 'register') {
      if (!formData.username) {
        errors.username = 'Ім\'я користувача обов\'язкове'
      } else if (formData.username.length < 3) {
        errors.username = 'Ім\'я користувача має містити мінімум 3 символи'
      } else if (formData.username.length > 50) {
        errors.username = 'Ім\'я користувача має бути менше 50 символів'
      }
    }

    if (!formData.password) {
      errors.password = 'Пароль обов\'язковий'
    } else if (mode === 'register' && formData.password.length < 6) {
      errors.password = 'Пароль має містити мінімум 6 символів'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    let result
    if (mode === 'login') {
      result = await login(formData.email, formData.password, addAsNewAccount)
    } else {
      result = await register(
        formData.email,
        formData.password,
        formData.username,
        addAsNewAccount
      )
    }

    if (result.success) {
      onClose()
      setFormData({ email: '', password: '', username: '' })
      setValidationErrors({})
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setFormData({ email: '', password: '', username: '' })
    setValidationErrors({})
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = async (response) => {
    // response.credential contains the ID token
    const result = await googleLogin(response.credential);
    if (result.success) {
      onClose();
      setFormData({ email: '', password: '', username: '' });
      setValidationErrors({});
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    if (resetStep === 0) {
      // Send reset code
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.success) {
        setResetStep(1);
      } else {
        setResetError(data.message || "Не вдалося надіслати код");
      }
    } else if (resetStep === 1) {
      // Verify code
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode })
      });
      const data = await res.json();
      if (data.success) {
        setResetStep(2);
      } else {
        setResetError(data.message || "Невірний код");
      }
    } else if (resetStep === 2) {
      // Set new password
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setResetMode(false);
        setResetStep(0);
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setResetError("");
        alert("Пароль успішно змінено!");
      } else {
        setResetError(data.message || "Не вдалося змінити пароль");
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !clientId) {
      if (!clientId) {
        console.warn('Google login disabled: VITE_GOOGLE_CLIENT_ID is not set');
      }
      return;
    }

    if (window.google && clientId) {
      const container = document.getElementById('google-login-button');
      if (!container) return;

      // Очистити можливу попередню кнопку
      container.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
      });
    }
  }, [isOpen, clientId, mode]);
  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="auth-modal-header">
          <h1>Inspira</h1>
          <h2>{mode === 'login' ? 'Ласкаво просимо назад' : 'Створіть обліковий запис'}</h2>
        </div>

        <div
          id="google-login-button"
          className="google-login-button"
          style={{ width: '100%', marginBottom: '20px' }}
        ></div>
        {!clientId && (
          <p className="google-disabled-note">
            Google login не настроен. Установите <code>VITE_GOOGLE_CLIENT_ID</code> в
            <code>.env</code> и перезапустите dev‑сервер.
          </p>
        )}

        <div className="auth-divider">
          <span>Або увійдіть за допомогою пошти</span>
        </div>

        {resetMode ? (
          <form onSubmit={handleResetPassword} className="auth-modal-form">
            {resetStep === 0 && (
              <div className="form-group">
                <label htmlFor="resetEmail">Електронна пошта</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="Введіть вашу електронну пошту"
                />
              </div>
            )}
            {resetStep === 1 && (
              <div className="form-group">
                <label htmlFor="resetCode">Код з пошти</label>
                <input
                  type="text"
                  id="resetCode"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="Введіть код"
                />
              </div>
            )}
            {resetStep === 2 && (
              <div className="form-group">
                <label htmlFor="newPassword">Новий пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Введіть новий пароль"
                />
              </div>
            )}
            {resetError && <div className="error-message">{resetError}</div>}
            <button type="submit" className="auth-modal-button">
              {resetStep === 0 ? "Надіслати код" : resetStep === 1 ? "Підтвердити код" : "Змінити пароль"}
            </button>
            <button type="button" className="link-button" onClick={() => { setResetMode(false); setResetStep(0); setResetError(""); }}>
              Назад до входу
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-modal-form">
            {error && <div className="error-message">{error}</div>}

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="username">Ім'я користувача</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={validationErrors.username ? 'error' : ''}
                  placeholder="Оберіть ім'я користувача"
                />
                {validationErrors.username && (
                  <span className="field-error">{validationErrors.username}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Електронна пошта</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={validationErrors.email ? 'error' : ''}
                placeholder="Введіть вашу електронну пошту"
              />
              {validationErrors.email && (
                <span className="field-error">{validationErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={validationErrors.password ? 'error' : ''}
                placeholder={
                  mode === 'login'
                    ? 'Введіть ваш пароль'
                    : 'Створіть пароль'
                }
              />
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
            </div>

            <button type="submit" className="auth-modal-button">
              {mode === 'login' ? 'Увійти' : 'Зареєструватися'}
            </button>
            {mode === 'login' && (
              <button type="button" className="link-button" onClick={() => setResetMode(true)}>
                Забули пароль?
              </button>
            )}
          </form>
        )}

        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p>
              Немає облікового запису?{' '}
              <button
                className="link-button"
                onClick={() => switchMode('register')}
              >
                Зареєструватися
              </button>
            </p>
          ) : (
            <p>
              Вже є обліковий запис?{' '}
              <button
                className="link-button"
                onClick={() => switchMode('login')}
              >
                Увійти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal

