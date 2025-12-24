import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl">
        Welcome {user?.name} 👋
      </h1>
      <button
        onClick={logout}
        className="text-red-400 hover:underline"
      >
        Logout
      </button>
    </div>
  );
}
