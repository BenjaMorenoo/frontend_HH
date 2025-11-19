
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import facebookIcon from "../assets/facebook-svgrepo-com.svg"
import googleIcon from "../assets/google-color-svgrepo-com.svg"
import mailIcon from "../assets/mail-svgrepo-com.svg"
import passwordIcon from "../assets/password-svgrepo-com.svg"
import unlockIcon from "../assets/visible-password-security-protect-svgrepo-com.svg"
import lockIcon from "../assets/eye-password-see-view-svgrepo-com.svg"

export default function Register() {
  const [primerNombre, setPrimerNombre] = useState("")
  const [segundoNombre, setSegundoNombre] = useState("")
  const [primerApellido, setPrimerApellido] = useState("")
  const [segundoApellido, setSegundoApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!primerNombre || !primerApellido || !email || !password || !confirmPassword || !phone || !address) {
      setError("Por favor completa todos los campos")
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email inválido")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setError("")
    // register using AuthContext then auto-login via context.login
    register({
      primer_nombre: primerNombre,
      segundo_nombre: segundoNombre,
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido,
      email,
      password,
      passwordConfirm: confirmPassword,
      phone,
      address,
    })
      .then(() => login(email, password))
      .then(() => {
        navigate('/')
      })
      .catch((err) => {
        setError(err?.message || 'Error registrando usuario')
      })
  }

  const navigate = useNavigate()
  const { register, login } = useAuth()

  return (
    <div>
      <Navbar />

      <main className="flex items-center justify-center bg-gray-100 px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
            Crear cuenta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo (separado) */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="primerNombre" className="block text-sm font-medium text-gray-700">Primer nombre</label>
              <input id="primerNombre" value={primerNombre} onChange={e => setPrimerNombre(e.target.value)} placeholder="Primer Nombre" className="mt-1 w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>
            <div>
              <label htmlFor="segundoNombre" className="block text-sm font-medium text-gray-700">Segundo nombre</label>
              <input id="segundoNombre" value={segundoNombre} onChange={e => setSegundoNombre(e.target.value)} placeholder="Segundo Nombre (opcional)" className="mt-1 w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>
            <div>
              <label htmlFor="primerApellido" className="block text-sm font-medium text-gray-700">Primer apellido</label>
              <input id="primerApellido" value={primerApellido} onChange={e => setPrimerApellido(e.target.value)} placeholder="Primer Apellido" className="mt-1 w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>
            <div>
              <label htmlFor="segundoApellido" className="block text-sm font-medium text-gray-700">Segundo apellido</label>
              <input id="segundoApellido" value={segundoApellido} onChange={e => setSegundoApellido(e.target.value)} placeholder="Segundo Apellido (opcional)" className="mt-1 w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <img src={mailIcon} alt="IconCorreo" className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="ejemplo@correo.com"
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
                <img src={passwordIcon} alt="IconPassword" className="h-4 w-4" />
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
                {showPassword ? (
                  <img src={unlockIcon} alt="Mostrar" className="h-4 w-4" />
                ) : (
                  <img src={lockIcon} alt="Ocultar" className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <img src={passwordIcon} alt="IconPassword" className="h-4 w-4" />
              </span>

              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? (
                  <img src={unlockIcon} alt="Mostrar" className="h-4 w-4" />
                ) : (
                  <img src={lockIcon} alt="Ocultar" className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <div className="relative mt-1">
              <input
                id="phone"
                type="text"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <div className="relative mt-1">
              <input
                id="address"
                type="text"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="Calle, número, ciudad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* error */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 transition"
          >
            Registrarme
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
              <img src={googleIcon} alt="Google" className="h-4 w-4" />
              Google
            </button>

            <button type="button" className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 text-sm hover:bg-gray-50">
              <img src={facebookIcon} alt="Facebook" className="h-4 w-4" />
              Facebook
            </button>
          </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </main>

      
    </div>
  )
}
