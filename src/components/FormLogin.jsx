import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import facebookIcon from "../assets/facebook-svgrepo-com.svg";
import googleIcon from "../assets/google-color-svgrepo-com.svg";
import mailIcon from "../assets/mail-svgrepo-com.svg";
import passwordIcon from "../assets/password-svgrepo-com.svg";
import unlockIcon from "../assets/visible-password-security-protect-svgrepo-com.svg";
import lockIcon from "../assets/eye-password-see-view-svgrepo-com.svg";


export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    setError("");
    // use AuthContext login so UI updates immediately
    login(email, password)
      .then(() => {
        navigate('/')
      })
      .catch((err) => {
        setError(err?.message || 'Error iniciando sesión')
      })
  };

  const navigate = useNavigate()
  const { login } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {/* mail icon */}
                <img src={mailIcon} alt="IconCorreo" className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {/* lock icon */}
                <img src={passwordIcon} alt="IconCorreo" className="h-4 w-4" />
              </span>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {/* eye icon */}
                {showPassword ? (
                  <img src={unlockIcon} alt="IconCorreo" className="h-4 w-4" />
                ) : (
                  <img src={lockIcon} alt="IconCorreo" className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* error */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          {/* Remember / Forgot row */}
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span>Recordarme</span>
            </label>
            <a href="#" className="text-sm text-gray-600 hover:underline">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 transition"
          >
            Iniciar Sesión
          </button>

          {/* divider */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-gray-300" />
            <span className="text-xs text-gray-500">O continúa con</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 text-sm hover:bg-gray-50">
              {/* Google icon */}
              <img src={googleIcon} alt="Google" className="h-4 w-4" />
              Google
            </button>

            <button type="button" className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 text-sm hover:bg-gray-50">
              {/* Facebook icon */}
              <img src={facebookIcon} alt="Facebook" className="h-4 w-4" />
              Facebook
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <a href="#" className="font-medium text-green-600 hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
