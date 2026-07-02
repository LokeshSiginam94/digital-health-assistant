import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  
  // Step 4: Get the logged-in username and check if token exists
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  // Step 3: Implement logout functionality
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
      {/* Brand Logo / Home Link */}
      <Link to="/" className="flex items-center space-x-2">
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
          SmartHealth AI
        </span>
      </Link>

      {/* Auth State Control Section */}
      <div className="flex items-center space-x-6">
        {token ? (
          // If the user is logged in, show their username and the logout button
          <>
            <p className="text-slate-300 text-sm font-medium">
              Welcome, <span className="text-cyan-400 font-semibold">{username}</span>
            </p>
            
            {/* Step 5: Logout Button UI */}
            <button
              onClick={logout}
              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              Logout
            </button>
          </>
        ) : (
          // If the user is logged out, show the navigation link to log back in
          <Link
            to="/login"
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}