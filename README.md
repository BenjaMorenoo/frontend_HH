# HuertoHogar (Frontend)

Breve README dirigido a dos públicos: usuarios no técnicos que quieran entender qué hace la web, y desarrolladores que necesiten ejecutar, desarrollar y probar la aplicación.

---

## Para usuarios (explicación no técnica)

- **¿Qué es esto?**
  - HuertoHogar es la tienda web frontend para comprar productos orgánicos locales. Los usuarios pueden navegar productos, añadirlos al carrito, registrarse e iniciar sesión, leer el blog y contactar al equipo.

- **¿Qué puedo hacer aquí?**
  - Ver listados de productos por categoría.
  - Buscar productos por nombre.
  - Añadir productos al carrito y hacer checkout (si el backend está conectado).
  - Leer el blog, ver posts y dejar reseñas.
  - Contactar a la tienda mediante la página de contacto.

- **¿Necesito algo especial para usarlo?**
  - Solo un navegador moderno (Chrome, Edge, Firefox, Safari). La web funciona en móviles y escritorio.

---

## Para administradores / usuarios avanzados (no desarrolladores)

- Hay una sección de **Admin** (si tu cuenta tiene permisos) para:
  - Ver pedidos
  - Añadir/editar/desactivar productos
  - Ver mensajes de contacto

- Si ves errores relacionados con "PocketBase" o falta de datos, significa que el backend (PocketBase) no está configurado o la URL no está apuntando a una instancia activa.

---

## Para desarrolladores (configuración técnica)

### Requisitos locales
- Node.js 18+ y npm.
- Chrome (para que Vitest ejecute Headless) — opcional pero recomendado.

### Instalación
1. Clona el repo y entra en la carpeta frontend:

```powershell
cd "C:\Users\benja\Desktop\Clases\FullStack 2\HuertoHogarREACT\frontend_HH"
```

2. Instala dependencias (si da conflictos con peer deps, usa la segunda línea):

```powershell
npm install
# o si falla por peer deps:
npm install --legacy-peer-deps
```

3. Variables de entorno (opcional):
- Para conectar a PocketBase local o remoto crea un archivo `.env` en la raíz o configura tu entorno con:

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Ejecutar en desarrollo

```powershell
npm run dev
```

Esto arranca Vite y abre la web en `http://localhost:5173` (o el puerto que muestre Vite).

### Compilar para producción

```powershell
npm run build
```

---

## Pruebas (Vitest + Testing Library)

Se añadió un conjunto de pruebas unitarias y de componentes con **Vitest** y **@testing-library/react**.

  - Tests de componentes: `test/components/`
  - Tests de utilidades/lógica: `test/utils/`
  - Snapshot tests: `test/snapshots/`


```powershell
npm test
```


```powershell
# Actualiza snapshots
npx vitest -u
# o usando npm script
npm test -- -u
```


```powershell
npm run coverage
```

### Notas sobre los tests


**Explicación Técnica**

- **Arquitectura general:** La aplicación es un frontend SPA construido con React y empaquetada con Vite. La UI se organiza en componentes reutilizables dentro de `src/components/` y las páginas principales en `src/pages/`. El enrutado se maneja con `react-router` (rutas para `/`, `/products`, `/admin`, `/login`, etc.).

- **Stack y herramientas:**
  - Framework: `react` (versión del proyecto).
  - Bundler/Dev: `vite` con `@vitejs/plugin-react-swc` (transformaciones con SWC para velocidad).
  - Estilos: Tailwind CSS (clases utilitarias en los componentes).
  - Testing: `vitest` + `@testing-library/react` para tests unitarios, snapshots y pruebas de comportamiento.

- **State management:** Se usa la Context API de React para el estado global principal:
  - `AuthContext` — maneja autenticación (login, logout), expone `user`, `isAuthenticated`, `login`, `logout`.
  - `CartContext` — maneja carrito, cantidad (`cartCount`) y apertura del panel (`setCartOpen`).
  - En tests, estos hooks se suelen *mockear* para aislar componentes.

- **Integración con backend (PocketBase):**
  - `src/utils/pocketApi.js` es el wrapper HTTP para PocketBase REST. Exporta helpers como `getRecords`, `getRecord`, `createRecord`, `createRecordForm` (FormData para subir archivos), `updateRecordForm`, `authWithPassword`, `registerUser` y `logout`.
  - Las llamadas usan `fetch` y normalizan errores; cuando PocketBase devuelve `Missing or invalid collection context` el helper añade una pista (hint) para ayudar al desarrollador a verificar el slug de la colección.
  - La URL base se configura vía `import.meta.env.VITE_POCKETBASE_URL`.

- **Autenticación y persistencia:**
  - Tras `authWithPassword` si la respuesta contiene `token` se guarda en `localStorage` con la clave `pb_token` y el usuario en `pb_user`.
  - `setAuthToken` y las operaciones de almacenamiento manejan excepciones (p. ej. quota) para no romper la UX si `localStorage` falla.
  - En componentes se comprueba `user.role` — soportamos tanto `user.role` como booleano (`true`/`false`) y campos legacy como `isAdmin` o `is_admin`. La lógica de admin está en `Navbar.jsx` (ver `isAdmin` inmediato).

- **Subidas de archivos:** Para crear o actualizar registros con archivos se usan funciones que envían `FormData` (p. ej. `createRecordForm`, `updateRecordForm`). Los tests mockean `fetch` para simular respuestas del servidor.

- **Rutas y búsqueda:** La búsqueda en `/products` sincroniza el parámetro `q` con el campo de búsqueda. `Navbar` maneja el submit del formulario y redirige a `/products` (con o sin query) usando `useNavigate`.

- **Tests y mocks:**
  - Los tests unitarios usan mocks para `useAuth`, `useCart` y `react-router` hooks (`useNavigate`, `useLocation`) cuando es necesario.
  - Los tests de utilidades (`test/utils/pocketApi.spec.js`) cubren casos de éxito, errores 4xx/5xx, parsing de mensajes y manejo de `localStorage`.

- **Build / Deploy:**
  - `npm run build` genera los artefactos estáticos en `dist/`. El resultado se puede servir en cualquier servidor estático (Netlify, Vercel, servidores tradicionales) o integrarse con el backend que haga de proxy.

- **Buenas prácticas y convenciones:**
  - Components: preferir funciones puras y extraer lógica compleja a hooks o utilidades (`src/utils/`).
  - Tests: mockear efectos externos (`fetch`, `localStorage`) y centrarse en el comportamiento observable del componente.
  - Internationalization: actualmente el proyecto está en español; para internacionalizar sería ideal extraer textos a archivos de localización.


- `src/` — código fuente React.
  - `src/components/` — componentes UI (Navbar, Footer, CartPanel, etc.).
  - `src/pages/` — páginas (Home, Products, Admin, etc.).
  - `src/context/` — context providers (`AuthContext`, `CartContext`).
  - `src/utils/pocketApi.js` — helpers para interactuar con PocketBase.
- `test/` — pruebas unitarias y snapshots.

---

## Problemas comunes y soluciones rápidas
- Error `useCart must be used inside CartProvider` en tests: mockea `useCart` o renderiza el componente envuelto con `CartProvider`.
- Error de peer deps al instalar: vuelve a ejecutar `npm install --legacy-peer-deps`.
- Error `@vitejs/plugin-react` no encontrado: el proyecto usa `@vitejs/plugin-react-swc` y `vite.config.js` ya fue actualizado.

---
