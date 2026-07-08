import React, { useState, useEffect } from 'react';
import { Loader2, Download, LogOut } from 'lucide-react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchSubmissions(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        fetchSubmissions(data.token);
      } else {
        setLoginError(data.error || 'Error de autenticación');
      }
    } catch (error) {
      setLoginError('Error de red');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async (token: string) => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setSubmissions([]);
    setUsername('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
          <h2 className="text-2xl font-black uppercase italic mb-6">Acceso Administración</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white"
              />
            </div>
            {loginError && (
              <div className="border-2 border-gray-500 bg-red-100 p-3">
                <p className="text-xs font-bold text-red-700 uppercase">{loginError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#040823] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500 cursor-pointer flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4 md:p-8">
      <header className="flex justify-between items-center bg-[#040823] text-white p-4 border-4 border-gray-500 mb-6">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest">Panel de Administración</h1>
        <div className="flex gap-4">
          <a
            href="/api/submissions/export"
            className="flex items-center gap-2 bg-white text-[#040823] px-4 py-2 font-bold uppercase hover:bg-gray-200 transition-colors border-2 border-transparent"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 font-bold uppercase hover:bg-red-700 transition-colors border-2 border-transparent"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="bg-white border-4 border-gray-500 p-4 flex-1 overflow-auto">
        <h2 className="text-lg font-black uppercase mb-4">Registros Ingresados ({submissions.length})</h2>
        {isLoadingData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-200 text-xs uppercase tracking-wider">
                  <th className="p-3 border-2 border-gray-400">Código</th>
                  <th className="p-3 border-2 border-gray-400">Tipo</th>
                  <th className="p-3 border-2 border-gray-400">RUT</th>
                  <th className="p-3 border-2 border-gray-400">Responsable</th>
                  <th className="p-3 border-2 border-gray-400">Otros Miembros</th>
                  <th className="p-3 border-2 border-gray-400">Email</th>
                  <th className="p-3 border-2 border-gray-400">Taller</th>
                  <th className="p-3 border-2 border-gray-400">Proyecto</th>
                  <th className="p-3 border-2 border-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  let members = [];
                  try {
                    members = JSON.parse(sub.members || '[]');
                  } catch(e) {}
                  
                  const isUnassigned = !sub.email;

                  return (
                  <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 border-2 border-gray-200 font-mono text-sm font-bold">{sub.code}</td>
                    <td className="p-3 border-2 border-gray-200 text-sm font-bold capitalize">
                      {isUnassigned ? <span className="text-gray-400 italic">Libre</span> : sub.type}
                    </td>
                    <td className="p-3 border-2 border-gray-200 text-sm">
                      {isUnassigned ? '-' : sub.rut}
                    </td>
                    <td className="p-3 border-2 border-gray-200 text-sm">
                      {isUnassigned ? '-' : `${sub.firstName} ${sub.middleName} ${sub.lastName} ${sub.secondLastName}`}
                    </td>
                    <td className="p-3 border-2 border-gray-200 text-sm">
                      {isUnassigned ? '-' : members.map((m: any, i: number) => (
                        <div key={i}>{m.firstName} {m.lastName}</div>
                      ))}
                    </td>
                    <td className="p-3 border-2 border-gray-200 text-sm">{isUnassigned ? '-' : sub.email}</td>
                    <td className="p-3 border-2 border-gray-200 text-sm">{isUnassigned ? '-' : sub.workshop}</td>
                    <td className="p-3 border-2 border-gray-200 text-sm font-bold">{isUnassigned ? '-' : sub.projectName}</td>
                    <td className="p-3 border-2 border-gray-200 text-xs">
                      {isUnassigned ? '-' : new Date(sub.createdAt).toLocaleString()}
                    </td>
                  </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500 font-bold uppercase">
                      No hay registros todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
