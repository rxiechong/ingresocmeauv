import React, { useState, useEffect, useRef } from 'react';
import AppForm from './Form';
import Success from './Success';
import { FormData, Submission } from './types';
import { Loader2, HelpCircle, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

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
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
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

  const TUTORIAL_STEPS = [
    {
      title: "1. Tipo de Ingreso",
      description: "Elige si estás registrando una maqueta o modelo individual o de trabajo grupal. En la opción grupal podrás registrar y añadir a todos los integrantes de tu equipo."
    },
    {
      title: "2. Identificación",
      description: "Ingresa tu RUT sin puntos ni guion, y tu nombre completo. Se requiere tu correo electrónico de estudiante de la Universidad de Valparaíso (@estudiantes.uv.cl) para vincular tu registro."
    },
    {
      title: "3. Ficha Técnica",
      description: "Selecciona tu taller en el menú desplegable, define el nombre de tu proyecto, y añade una descripción breve (máximo 250 palabras) y la lista de materiales principales que usaste (máximo 150 palabras)."
    },
    {
      title: "4. Tu Código Único",
      description: "Al enviar, verás una pantalla con tu Código único de seguimiento. ¡Importante! No se enviará ningún correo de confirmación. Es fundamental que tomes un pantallazo de tu código o que hagas clic en el botón 'Descargar' para guardar la imagen con el comprobante de tu registro."
    },
    {
      title: "5. Modificar o Recuperar",
      description: "Si necesitas corregir algún dato técnico o si pierdes tu código de seguimiento, puedes recuperarlo o ingresar a editarlo en cualquier momento desde la pantalla de inicio usando tu RUT y correo institucional."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-sans selection:bg-[#4B577E] selection:text-white flex flex-col relative z-0">
      {/* Animated Background */}
      <Crosses color="#4B577E" opacity={0.12} className="fixed inset-0 w-full h-full z-50 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col relative z-10 pb-32 md:pb-40">
        {view === 'menu' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
            <header className="w-full shadow-xl relative bg-[#4B577E]">
              <div ref={headerRef} className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden group">
                <img src="/portada.jpg" alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* White crosses aligned with background */}
                <Crosses 
                  color="#ffffff" 
                  opacity={0.17} 
                  className="absolute w-screen h-screen z-50 pointer-events-none" 
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} 
                />
                
              </div>
            </header>
            
            <div className="sticky top-0 z-40 w-full flex justify-center mb-8 bg-white pb-4 pt-0">
              <div className="w-full">
                <img src="/inter.png?v=2" alt="Campos Materiales" className="w-full h-auto block pointer-events-none" />
              </div>
            </div>

            <div className="w-full space-y-4 relative z-30">
              <button onClick={() => setView('individual')} className="w-full bg-[#4B577E] text-white p-6 text-xl font-black uppercase hover:bg-opacity-90 transition-all border-4 border-transparent hover:border-gray-500 text-left relative group overflow-hidden">
                <span className="relative z-10">1. Ingreso Maqueta/modelo Individual</span>
                <div className="absolute top-0 right-0 h-full w-2 bg-gray-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
              </button>
              
              <button onClick={() => setView('grupal')} className="w-full bg-[#4B577E] text-white p-6 text-xl font-black uppercase hover:bg-opacity-90 transition-all border-4 border-transparent hover:border-gray-500 text-left relative group overflow-hidden">
                <span className="relative z-10">2. Ingreso Maqueta/modelo Grupal</span>
                <div className="absolute top-0 right-0 h-full w-2 bg-gray-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
              </button>
              
              <button onClick={() => setShowRecoverModal(true)} className="w-full bg-white text-[#4B577E] p-6 text-xl font-black uppercase hover:bg-gray-100 transition-all border-4 border-[#4B577E] hover:border-gray-500 text-left">
                3. Recuperar Código
              </button>

              <button onClick={() => setShowLoginModal(true)} className="w-full bg-white text-[#4B577E] p-6 text-xl font-black uppercase hover:bg-gray-100 transition-all border-4 border-[#4B577E] hover:border-gray-500 text-left">
                4. Modificar Registro
              </button>

              <button onClick={() => { setTutorialStep(0); setShowTutorialModal(true); }} className="w-full bg-[#4B577E] text-white p-6 text-xl font-black uppercase hover:bg-opacity-90 transition-all border-4 border-transparent hover:border-gray-500 text-left relative group overflow-hidden flex items-center justify-between">
                <span className="relative z-10">5. Tutorial y Ayuda de Registro</span>
                <HelpCircle className="w-6 h-6 text-gray-300 relative z-10 animate-pulse" />
                <div className="absolute top-0 right-0 h-full w-2 bg-gray-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
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

      <footer className="fixed bottom-0 left-0 w-full z-40 pointer-events-none">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto w-full flex justify-center">
            <img src="/footer.jpg" alt="Escuela de Arquitectura, Universidad de Valparaíso - 2026" className="w-full h-auto block" />
          </div>
        </div>
      </footer>

      {/* Recover Modal */}
      {showRecoverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-[#4B577E]">Recuperar Código</h2>
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
                  <button type="submit" disabled={isRecovering} className="flex-1 bg-[#4B577E] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500">
                    {isRecovering ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Consultar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-sm font-bold">Hemos encontrado tu registro. Tu código es:</p>
                <div className="border-4 border-gray-500 p-4 bg-[#4B577E] text-white text-center">
                  <p className="text-3xl font-mono font-black">{recoveredCode}</p>
                </div>
                <div className="pt-4 border-t-4 border-gray-500 mt-6">
                  <button type="button" onClick={() => { setShowRecoverModal(false); setRecoveredCode(null); }} className="w-full bg-[#4B577E] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity border-4 border-transparent hover:border-gray-500">
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
            <h2 className="text-2xl font-black uppercase italic mb-6 text-[#4B577E]">Modificar Registro</h2>
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
                <button type="submit" disabled={isLoggingIn} className="flex-1 bg-[#4B577E] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500">
                  {isLoggingIn ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[8px] border-gray-500 p-6 md:p-8 w-full max-w-lg relative">
            <button 
              onClick={() => setShowTutorialModal(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-[#4B577E]" />
              <h2 className="text-2xl font-black uppercase italic text-[#4B577E]">Guía de Registro</h2>
            </div>
            
            {/* Progress indicators */}
            <div className="flex gap-1 mb-6">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 flex-1 transition-all duration-300`}
                  style={{ backgroundColor: idx === tutorialStep ? '#4B577E' : idx < tutorialStep ? '#6B7280' : '#E5E7EB' }}
                />
              ))}
            </div>
            
            <div className="min-h-[160px] flex flex-col justify-between mb-6">
              <div>
                <h3 className="text-lg font-black uppercase text-[#4B577E] mb-2">
                  {TUTORIAL_STEPS[tutorialStep].title}
                </h3>
                <p className="text-sm font-bold text-gray-600 leading-relaxed">
                  {TUTORIAL_STEPS[tutorialStep].description}
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-gray-400 mt-4 uppercase tracking-wider text-right">
                Paso {tutorialStep + 1} de {TUTORIAL_STEPS.length}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t-4 border-gray-500">
              <button 
                type="button" 
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep(prev => prev - 1)} 
                className="flex-1 bg-white border-4 border-gray-500 text-black px-4 py-3 font-black uppercase hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button 
                  type="button" 
                  onClick={() => setTutorialStep(prev => prev + 1)} 
                  className="flex-1 bg-[#4B577E] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity border-4 border-transparent hover:border-gray-500 flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowTutorialModal(false)} 
                  className="flex-1 bg-[#4B577E] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity border-4 border-transparent hover:border-gray-500 flex items-center justify-center gap-2"
                >
                  ¡Entendido!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
