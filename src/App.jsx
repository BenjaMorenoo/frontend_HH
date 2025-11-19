import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Products from "./pages/Products"
import Blog from "./pages/Blog"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Checkout from "./pages/Checkout"
import Orders from "./pages/Orders"
import { CartProvider } from "./context/CartContext"
import { AuthProvider } from "./context/AuthContext"
import CartPanel from "./components/CartPanel"
import FloatingCartButton from "./components/FloatingCartButton"
import Footer from "./components/Footer"

function App() {


  return (
    <AuthProvider>
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register/>} />
            <Route path="/profile" element={<Profile/>} />
            </Routes>
          </main>

          <FloatingCartButton />
          <CartPanel />

          <Footer />
        </div>
      </Router>
    </CartProvider>
    </AuthProvider>
  )
}

export default App
