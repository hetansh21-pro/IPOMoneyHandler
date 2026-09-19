export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-800 p-4">
      <h2 className="text-xl font-bold">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2">The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">
        Return Home
      </a>
    </div>
  );
}
