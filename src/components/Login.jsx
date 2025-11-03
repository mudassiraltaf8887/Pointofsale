import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// BLACK-RED THEME
const THEME = {
  PRIMARY: "#ef4444",
  PRIMARY_DARK: "#dc2626",
  SECONDARY: "#1a1a1a",
  SIDEBAR_BG: "#0a0a0a",
  CARD_BG: "#141414",
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#a3a3a3",
  TEXT_MUTED: "#737373",
  SIDEBAR_HOVER: "#1f1f1f",
  SHADOW_MD: "0 4px 12px rgba(0,0,0,0.4)",
  GRADIENT_PRIMARY: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in:', userCredential.user);
      alert('Login successful! ✅');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email!');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password!');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address!');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google user:', result.user);
      alert('Google login successful! ✅');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.SECONDARY,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: THEME.CARD_BG,
        borderRadius: '12px',
        boxShadow: THEME.SHADOW_MD,
        border: `1px solid ${THEME.SIDEBAR_HOVER}`,
        width: '100%',
        maxWidth: '450px',
        padding: '40px'
      }}>
        
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            borderRadius: '20px',
            background: THEME.GRADIENT_PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
          }}>
            ST
          </div>
        </div>

        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: THEME.TEXT_PRIMARY,
          marginBottom: '10px',
          textAlign: 'center'
        }}>Welcome Back 👋</h2>
        
        <p style={{
          color: THEME.TEXT_SECONDARY,
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>Login to your account</p>

        {error && (
          <div style={{
            background: `${THEME.PRIMARY}20`,
            border: `1px solid ${THEME.PRIMARY}40`,
            color: THEME.PRIMARY,
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: THEME.TEXT_PRIMARY,
              marginBottom: '8px'
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                border: `1px solid ${THEME.SIDEBAR_HOVER}`,
                borderRadius: '8px',
                boxSizing: 'border-box',
                background: THEME.SIDEBAR_BG,
                color: THEME.TEXT_PRIMARY,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = THEME.PRIMARY}
              onBlur={(e) => e.currentTarget.style.borderColor = THEME.SIDEBAR_HOVER}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: THEME.TEXT_PRIMARY,
              marginBottom: '8px'
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: '50px',
                  fontSize: '15px',
                  border: `1px solid ${THEME.SIDEBAR_HOVER}`,
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  background: THEME.SIDEBAR_BG,
                  color: THEME.TEXT_PRIMARY,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = THEME.PRIMARY}
                onBlur={(e) => e.currentTarget.style.borderColor = THEME.SIDEBAR_HOVER}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: THEME.PRIMARY,
                  fontWeight: '600'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '700',
              color: 'white',
              background: loading ? THEME.SIDEBAR_HOVER : THEME.GRADIENT_PRIMARY,
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            {loading ? '⏳ Logging in...' : '🔓 Login'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          margin: '20px 0',
          color: THEME.TEXT_MUTED,
          fontSize: '14px',
          position: 'relative'
        }}>
          <span style={{
            background: THEME.CARD_BG,
            padding: '0 10px',
            position: 'relative',
            zIndex: 1
          }}>OR</span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            background: THEME.SIDEBAR_HOVER,
            zIndex: 0
          }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '600',
            color: THEME.TEXT_PRIMARY,
            background: THEME.SIDEBAR_BG,
            border: `1px solid ${THEME.SIDEBAR_HOVER}`,
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = THEME.SIDEBAR_HOVER;
              e.currentTarget.style.borderColor = THEME.PRIMARY;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = THEME.SIDEBAR_BG;
            e.currentTarget.style.borderColor = THEME.SIDEBAR_HOVER;
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: THEME.TEXT_SECONDARY,
          marginTop: '24px'
        }}>
          Don't have an account?{' '}
          <button 
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.PRIMARY,
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;