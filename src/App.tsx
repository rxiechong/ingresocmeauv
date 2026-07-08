import React, { useState, useEffect, useRef } from 'react';
import AppForm from './Form';
import Success from './Success';
import { FormData, Submission } from './types';
import { Loader2 } from 'lucide-react';

type ViewMode = 'menu' | 'individual' | 'grupal' | 'edit' | 'success';

const Crosses = ({ color, opacity, className, style }: { color: string, opacity: number, className?: string, style?: React.CSSProperties }) => (
  <svg className={`pointer-events-none ${className}`} style={style} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="crossPattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <g className="cross-wrapper">
          <g className="cross-anim" stroke={color} strokeWidth="2" strokeOpacity={opacity} strokeLinecap="butt">
            <line x1="24" y1="18" x2="24" y2="30" className="cross-line-v" />
            <line x1="18" y1="24" x2="30" y2="24" className="cross-line-h" />
          </g>
        </g>
      </pattern>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#crossPattern)" />
  </svg>
);

export default function App() {
  const [view, setView] = useState<ViewMode>('menu');
  const [submissionCode, setSubmissionCode] = useState<string>('');
  const [formData, setFormData] = useState<FormData | null>(null);
  
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [recoverError, setRecoverError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [recoveredCode, setRecoveredCode] = useState<string | null>(null);

  const [initialEditData, setInitialEditData] = useState<Submission | undefined>(undefined);

  const handleSubmit = async (data: FormData, editCode?: string) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editCode;
      const url = isEdit ? `/api/submissions/${editCode}` : '/api/submissions';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          members: JSON.stringify(data.members)
        }),
      });

      const resData = await res.json();
      
      if (res.ok && resData.success) {
        setSubmissionCode(resData.code);
        setFormData(data);
        setView('success');
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (error) {
      alert('Error de red');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateOffset = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setOffset({ x: -rect.left, y: -rect.top });
      }
    };
    window.addEventListener('scroll', updateOffset);
    window.addEventListener('resize', updateOffset);
    updateOffset();
    return () => {
      window.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateOffset);
    };
  }, []);

  const handleRecover = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRecovering(true);
    setRecoverError('');
    
    const target = e.currentTarget;
    const rut = (target.elements.namedItem('rut') as HTMLInputElement).value;
    const emailPrefix = (target.elements.namedItem('emailPrefix') as HTMLInputElement).value;
    const email = `${emailPrefix}@estudiantes.uv.cl`;

    try {
      const res = await fetch('/api/submissions/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rut }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveredCode(data.code);
      } else {
        setRecoverError(data.error || 'No se encontró el registro');
      }
    } catch (error) {
      setRecoverError('Error de conexión');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    const target = e.currentTarget;
    const rut = (target.elements.namedItem('rut') as HTMLInputElement).value;
    const emailPrefix = (target.elements.namedItem('emailPrefix') as HTMLInputElement).value;
    const email = `${emailPrefix}@estudiantes.uv.cl`;

    try {
      const res = await fetch('/api/submissions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const sub = data.submission;
        setInitialEditData({
          ...sub,
          members: JSON.parse(sub.members || '[]')
        });
        setShowLoginModal(false);
        setView('edit');
      } else {
        setLoginError(data.error || 'No se encontró el registro');
      }
    } catch (error) {
      setLoginError('Error de conexión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#1A1A1A] font-sans overflow-x-hidden selection:bg-[#040823] selection:text-white flex flex-col relative z-0">
      {/* Animated Background */}
      <Crosses color="#040823" opacity={0.12} className="fixed inset-0 w-full h-full z-50 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col relative z-10">
        {view === 'menu' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
            <header className="mb-12 w-full shadow-xl relative bg-[#040823]">
              <div ref={headerRef} className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden group">
                <img src="/portada.jpg" alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* White crosses aligned with background */}
                <Crosses 
                  color="#ffffff" 
                  opacity={0.17} 
                  className="absolute w-screen h-screen z-50 pointer-events-none" 
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} 
                />
                
                {/* Overlay Text */}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4 text-center">
                  <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-lg">
                    CAMPOS MATERIALES
                  </h1>
                  <p className="text-sm md:text-base font-black italic text-gray-200 mt-2 max-w-md drop-shadow-md">
                    Ingreso concurso exposición 2026
                  </p>
                </div>
              </div>
            </header>

            <div className="w-full space-y-4">
              <button onClick={() => setView('individual')} className="w-full bg-[#040823] text-white p-6 text-xl font-black uppercase hover:bg-opacity-90 transition-all border-4 border-transparent hover:border-gray-500 text-left relative group overflow-hidden">
                <span className="relative z-10">1. Ingreso Trabajo Individual</span>
                <div className="absolute top-0 right-0 h-full w-2 bg-gray-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
              </button>
              
              <button onClick={() => setView('grupal')} className="w-full bg-[#040823] text-white p-6 text-xl font-black uppercase hover:bg-opacity-90 transition-all border-4 border-transparent hover:border-gray-500 text-left relative group overflow-hidden">
                <span className="relative z-10">2. Ingreso Trabajo Grupal</span>
                <div className="absolute top-0 right-0 h-full w-2 bg-gray-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
              </button>
              
              <button onClick={() => setShowRecoverModal(true)} className="w-full bg-white text-[#040823] p-6 text-xl font-black uppercase hover:bg-gray-100 transition-all border-4 border-[#040823] hover:border-gray-500 text-left">
                3. Recuperar Código
              </button>

              <button onClick={() => setShowLoginModal(true)} className="w-full bg-white text-[#040823] p-6 text-xl font-black uppercase hover:bg-gray-100 transition-all border-4 border-[#040823] hover:border-gray-500 text-left">
                4. Modificar Registro
              </button>
            </div>
            
            <div className="mt-16 text-center">
              <a href="/admin" className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                Ingreso Centinela (Admin)
              </a>
            </div>
          </div>
        )}

        {(view === 'individual' || view === 'grupal' || view === 'edit') && (
          <AppForm 
            mode={view} 
            initialData={initialEditData}
            onSubmit={handleSubmit} 
            onCancel={() => { setView('menu'); setInitialEditData(undefined); }} 
            isSubmitting={isSubmitting} 
          />
        )}

        {view === 'success' && formData && (
          <Success code={submissionCode} formData={formData} onHome={() => setView('menu')} />
        )}
      </div>

      <footer className="mt-auto py-8 text-center text-xs font-mono uppercase bg-[#040823] text-white w-full z-10 relative">
        Escuela de Arquitectura, Universidad de Valparaíso - 2026
      </footer>

      {/* Recover Modal */}
      {showRecoverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-[#040823]">Recuperar Código</h2>
            {!recoveredCode ? (
              <form onSubmit={handleRecover} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest">RUT (Sin puntos ni guión)</label>
                  <input required name="rut" type="text" placeholder="12345678" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional</label>
                  <div className="flex flex-col border-2 border-gray-500">
                    <input required name="emailPrefix" type="text" placeholder="marcelo.rios" className="w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0" />
                    <span className="bg-gray-700 text-white p-2 border-t-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0">@estudiantes.uv.cl</span>
                  </div>
                </div>
                {recoverError && (
                  <div className="border-2 border-gray-500 bg-red-100 p-3">
                    <p className="text-xs font-bold text-red-700 uppercase">{recoverError}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-4 border-t-4 border-gray-500 mt-6">
                  <button type="button" onClick={() => setShowRecoverModal(false)} className="flex-1 bg-white border-4 border-gray-500 text-black px-4 py-3 font-black uppercase hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isRecovering} className="flex-1 bg-[#040823] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500">
                    {isRecovering ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Consultar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-sm font-bold">Hemos encontrado tu registro. Tu código es:</p>
                <div className="border-4 border-gray-500 p-4 bg-[#040823] text-white text-center">
                  <p className="text-3xl font-mono font-black">{recoveredCode}</p>
                </div>
                <div className="pt-4 border-t-4 border-gray-500 mt-6">
                  <button type="button" onClick={() => { setShowRecoverModal(false); setRecoveredCode(null); }} className="w-full bg-[#040823] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity border-4 border-transparent hover:border-gray-500">
                    Aceptar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-[#040823]">Modificar Registro</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">RUT (Sin puntos ni guión)</label>
                <input required name="rut" type="text" placeholder="12345678" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional</label>
                <div className="flex flex-col border-2 border-gray-500">
                  <input required name="emailPrefix" type="text" placeholder="marcelo.rios" className="w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0" />
                  <span className="bg-gray-700 text-white p-2 border-t-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0">@estudiantes.uv.cl</span>
                </div>
              </div>
              {loginError && (
                <div className="border-2 border-gray-500 bg-red-100 p-3">
                  <p className="text-xs font-bold text-red-700 uppercase">{loginError}</p>
                </div>
              )}
              <div className="flex gap-4 pt-4 border-t-4 border-gray-500 mt-6">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-white border-4 border-gray-500 text-black px-4 py-3 font-black uppercase hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isLoggingIn} className="flex-1 bg-[#040823] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500">
                  {isLoggingIn ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
