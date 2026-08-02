import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from './LanguageToggle.jsx';
import { API_BASE } from '../api/index.js';
import '../styles/login.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});
  const countdownRef = useRef(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');

    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrors((prev) => ({ ...prev, login: '' }));

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const text = await res.text();
        setErrors((prev) => ({ ...prev, login: text || t('login.errors.loginFailed') }));
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (rememberMe) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('savedPassword', password);
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }
      navigate('/query');
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({ ...prev, login: t('login.errors.loginError') }));
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setRecoveryUsername('');
    setRecoveryPhone('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      setCountdown(0);
    }
  };

  const showForgotPasswordModal = () => {
    setShowForgotPassword(true);
    resetForm();
  };

  const closeModal = () => {
    setShowForgotPassword(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const validateCurrentStep = () => {
    const nextErrors = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!recoveryUsername) {
        nextErrors.username = t('login.errors.usernameRequired');
        isValid = false;
      }
      if (!recoveryPhone) {
        nextErrors.phone = t('login.errors.phoneRequired');
        isValid = false;
      } else if (!/^1[3-9]\d{9}$/.test(recoveryPhone)) {
        nextErrors.phone = t('login.errors.phoneInvalid');
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (!verificationCode) {
        nextErrors.code = t('login.errors.codeRequired');
        isValid = false;
      } else if (!/^\d{6}$/.test(verificationCode)) {
        nextErrors.code = t('login.errors.codeInvalid');
        isValid = false;
      }
    }

    setErrors(nextErrors);
    return isValid;
  };

  const validatePassword = () => {
    const nextErrors = {};
    let isValid = true;

    if (!newPassword) {
      nextErrors.newPassword = t('login.errors.newPasswordRequired');
      isValid = false;
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = t('login.errors.newPasswordShort');
      isValid = false;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t('login.errors.confirmPasswordRequired');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = t('login.errors.confirmPasswordMismatch');
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const startCountdown = () => {
    setCountdown(60);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    if (currentStep === 1) {
      startCountdown();
    }
    if (currentStep < 3) {
      setCurrentStep((value) => value + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((value) => value - 1);
    }
  };

  const resetPassword = () => {
    if (!validatePassword()) return;
    setCurrentStep(4);
  };

  const completeReset = () => {
    closeModal();
    resetForm();
  };

  const resendCode = () => {
    if (countdown <= 0) {
      startCountdown();
    }
  };

  return (
    <div className="login-container">
      <div className="container">
        <div className="right-panel">
          <div className="login-lang">
            <LanguageToggle />
          </div>
          <div className="login-header">
            <h2>{t('login.title')}</h2>
            <p>{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">{t('login.usernameLabel')}</label>
              <div className="input-with-icon">
                <i className="fas fa-user" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('login.passwordLabel')}</label>
              <div className="input-with-icon">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
              </div>
            </div>

            {errors.login ? <div className="error-message">{errors.login}</div> : null}

            <div className="remember-forgot">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <label htmlFor="remember">{t('login.rememberMe')}</label>
              </div>
              <button type="button" className="forgot-password" onClick={showForgotPasswordModal}>
                {t('login.forgotPassword')}
              </button>
            </div>

            <button type="submit" className="login-btn">
              {t('login.submit')}
            </button>
          </form>
        </div>
      </div>

      {showForgotPassword ? (
        <div className="modal" onClick={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('login.recoverTitle')}</h3>
              <button className="close-btn" onClick={closeModal} type="button">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="step-indicator">
                <div className={`step ${currentStep === 1 ? 'active' : ''}`}>1</div>
                <div className="step-line" />
                <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2</div>
                <div className="step-line" />
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
              </div>

              {currentStep === 1 ? (
                <div className="step-content active">
                  <p>{t('login.step1Desc')}</p>
                  <div className="modal-form-group">
                    <label htmlFor="recovery-username">{t('login.recoveryUsernameLabel')}</label>
                    <input
                      type="text"
                      id="recovery-username"
                      value={recoveryUsername}
                      onChange={(event) => setRecoveryUsername(event.target.value)}
                      placeholder={t('login.recoveryUsernamePlaceholder')}
                    />
                    {errors.username ? <div className="error-message">{errors.username}</div> : null}
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="recovery-phone">{t('login.recoveryPhoneLabel')}</label>
                    <input
                      type="text"
                      id="recovery-phone"
                      value={recoveryPhone}
                      onChange={(event) => setRecoveryPhone(event.target.value)}
                      placeholder={t('login.recoveryPhonePlaceholder')}
                    />
                    {errors.phone ? <div className="error-message">{errors.phone}</div> : null}
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="step-content active">
                  <p>{t('login.step2Desc')}</p>
                  <div className="modal-form-group">
                    <label htmlFor="verification-code">{t('login.verificationCodeLabel')}</label>
                    <div className="verification-code-group">
                      <input
                        type="text"
                        id="verification-code"
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value)}
                        placeholder={t('login.verificationCodePlaceholder')}
                      />
                      <button
                        type="button"
                        className="countdown-btn"
                        disabled={countdown > 0}
                        onClick={resendCode}
                      >
                        {countdown > 0
                          ? t('login.resendCountdown', { count: countdown })
                          : t('login.resend')}
                      </button>
                    </div>
                    {errors.code ? <div className="error-message">{errors.code}</div> : null}
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="step-content active">
                  <p>{t('login.step3Desc')}</p>
                  <div className="modal-form-group">
                    <label htmlFor="new-password">{t('login.newPasswordLabel')}</label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder={t('login.newPasswordPlaceholder')}
                    />
                    {errors.newPassword ? <div className="error-message">{errors.newPassword}</div> : null}
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="confirm-password">{t('login.confirmPasswordLabel')}</label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={t('login.confirmPasswordPlaceholder')}
                    />
                    {errors.confirmPassword ? (
                      <div className="error-message">{errors.confirmPassword}</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="step-content active">
                  <div className="success-message">
                    <i className="fas fa-check-circle" />
                    <h3>{t('login.step4Title')}</h3>
                    <p>{t('login.step4Desc')}</p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              {currentStep > 1 && currentStep < 4 ? (
                <button className="modal-btn" onClick={prevStep} type="button">
                  {t('login.prevStep')}
                </button>
              ) : null}
              {currentStep < 3 ? (
                <button className="modal-btn" onClick={nextStep} type="button">
                  {t('login.nextStep')}
                </button>
              ) : null}
              {currentStep === 3 ? (
                <button className="modal-btn" onClick={resetPassword} type="button">
                  {t('login.resetPassword')}
                </button>
              ) : null}
              {currentStep === 4 ? (
                <button className="modal-btn" onClick={completeReset} type="button">
                  {t('login.done')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
