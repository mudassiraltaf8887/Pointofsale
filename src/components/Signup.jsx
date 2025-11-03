import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged
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

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // 🔥 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters!');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      console.log('User registered:', userCredential.user);
      alert('Account created successfully! ✅');
      
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered!');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address!');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak!');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google signup successful:', result.user);
      alert('Signed up with Google successfully! ✅');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Google signup error:', error);
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
        }}>Create Account 🚀</h2>
        
        <p style={{
          color: THEME.TEXT_SECONDARY,
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>Sign up to get started</p>

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

        <form onSubmit={handleSignup}>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: THEME.TEXT_PRIMARY,
              marginBottom: '8px'
            }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
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
            />
          </div>

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
              name="email"
              value={formData.email}
              onChange={handleChange}
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
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: THEME.TEXT_PRIMARY,
              marginBottom: '8px'
            }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
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
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? 'Hide' : 'Show'}
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
          >
            {loading ? '⏳ Creating...' : '🎉 Sign Up'}
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
          onClick={handleGoogleSignup}
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
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: THEME.TEXT_SECONDARY,
          marginTop: '24px'
        }}>
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.PRIMARY,
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
