/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Download, Send, Loader2, Mail, Camera } from 'lucide-react';

interface FormData {
  rutMain: string;
  rutDv: string;
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  workshop: string;
  projectName: string;
  projectDescription: string;
  materials: string;
}

export default function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Login & Edit state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [editModeCode, setEditModeCode] = useState<string | null>(null);

  // Recover state
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoveredCode, setRecoveredCode] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const projectDescriptionWatch = watch('projectDescription') || '';
  const wordCount = projectDescriptionWatch.trim().split(/\s+/).filter(Boolean).length;

  const formatRutMain = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;
    const emailPrefix = formData.get('emailPrefix') as string;
    const cleanEmailPrefix = emailPrefix.replace(/@.*$/, '');
    const email = `${cleanEmailPrefix}@estudiantes.uv.cl`;

    try {
      const res = await fetch('/api/submissions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      
      // Populate form
      const submission = data.submission;
      const strippedEmail = submission.email.replace('@estudiantes.uv.cl', '');
      const [rutMain, rutDv] = (submission.rut || '').split('-');
      reset({ ...submission, email: strippedEmail, rutMain: rutMain?.trim() || '', rutDv: rutDv?.trim() || '' });
      setEditModeCode(submission.code);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRecoverCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRecoverError(null);
    setRecoveredCode(null);
    setIsRecovering(true);
    const formData = new FormData(e.currentTarget);
    const emailPrefix = formData.get('emailPrefix') as string;
    const cleanEmailPrefix = emailPrefix.replace(/@.*$/, '');
    const email = `${cleanEmailPrefix}@estudiantes.uv.cl`;

    try {
      const res = await fetch('/api/submissions/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al recuperar');
      
      setRecoveredCode(data.code);
    } catch (err) {
      setRecoverError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsRecovering(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setErrorMsg(null);
    try {
      const url = editModeCode ? `/api/submissions/${editModeCode}` : '/api/submissions';
      const method = editModeCode ? 'PUT' : 'POST';

      const cleanEmail = data.email.replace(/@.*$/, '');
      const submitData = { ...data, email: `${cleanEmail}@estudiantes.uv.cl`, rut: `${data.rutMain}-${data.rutDv}` };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el formulario');
      }

      const result = await response.json();
      setSubmittedCode(result.code);
      setSubmittedEmail(`${data.email}@estudiantes.uv.cl`);
      reset();
      setEditModeCode(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/submissions/export';
  };

  if (submittedCode) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex flex-col p-2 sm:p-4 md:p-8">
        <div className="flex-1 flex flex-col border-[6px] sm:border-[8px] md:border-[12px] border-gray-500">
          <header className="border-b-[6px] border-gray-500 p-4 sm:p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start bg-[#003C58] text-white gap-6 xl:gap-0">
            <div className="flex flex-col justify-end mt-auto">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">Registro<br/>Exitoso</h1>
              <p className="mt-2 font-mono text-xs sm:text-sm md:text-base uppercase">SISTEMA DE REGISTRO ACADÉMICO / JULIO 2026</p>
            </div>
            <div className="flex gap-4 items-center self-start xl:self-auto h-full">
              <img src="/logo-eauv.png" alt="EAUV" className="h-6 sm:h-8 md:h-10 object-contain" />
              <img src="/logo-uv.png" alt="Universidad de Valparaíso" className="h-6 sm:h-8 md:h-10 object-contain" />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-8 flex flex-col gap-6 items-center justify-center">
            <h2 className="text-3xl font-black uppercase italic text-center">¡Formulario Recibido!</h2>
            
            <div className="flex flex-col items-center mt-4">
              <Camera className="w-16 h-16 text-gray-400 mb-2" strokeWidth={1} />
              <p className="text-2xl font-black tracking-widest text-[#003C58]">GUARDA TU CÓDIGO AHORA</p>
            </div>

            <div className="mt-4 border-4 border-gray-500 p-8 bg-[#003C58] text-white text-center w-full max-w-md shadow-[8px_8px_0px_0px_rgba(107,114,128,1)]">
              <p className="text-sm font-black uppercase tracking-widest mb-2">Tu código de estudiante es</p>
              <p className="text-5xl font-mono font-black">{submittedCode}</p>
            </div>
            
            <div className="mt-6 flex flex-col items-center max-w-lg text-center gap-2">
              <Mail className="w-8 h-8 text-gray-500 mb-1" />
              <p className="text-sm font-bold border-l-4 border-gray-500 pl-3">
                El código ha sido enviado a tu correo institucional <strong>{submittedEmail}</strong>. 
                Revisa la casilla OTROS si no aparece.
              </p>
              <p className="text-xs font-bold text-gray-500 mt-2">
                De igual manera podrás consultar tu código único de seguimiento en el botón "Consultar Código Único de Seguimiento" del inicio.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
               <button
                  onClick={() => {
                    setSubmittedCode(null);
                    setSubmittedEmail(null);
                  }}
                  className="bg-[#003C58] text-white px-8 py-4 text-xl font-black uppercase hover:opacity-80 transition-opacity cursor-pointer border-4 border-transparent hover:border-black"
                >
                  Volver al inicio
                </button>
            </div>
          </main>
          <footer className="bg-[#003C58] text-white p-3 flex justify-end items-center mt-auto">
            <div className="text-[10px] font-mono uppercase text-right">Escuela de Arquitectura, Universidad de Valparaíso - 2026</div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col p-2 sm:p-4 md:p-8">
      <div className="flex-1 flex flex-col border-[6px] sm:border-[8px] md:border-[12px] border-gray-500">
        <header className="border-b-[6px] border-gray-500 p-4 sm:p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start bg-[#003C58] text-white gap-6 xl:gap-0">
          <div className="flex flex-col justify-end mt-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">CAMPOS<br/>MATERIALES</h1>
            <p className="mt-2 font-mono text-xs sm:text-sm md:text-base uppercase">SISTEMA DE REGISTRO ACADÉMICO / JULIO 2026</p>
          </div>
          <div className="flex gap-4 items-center self-start xl:self-auto h-full">
            <img src="/logo-eauv.png" alt="EAUV" className="h-6 sm:h-8 md:h-10 object-contain" />
            <img src="/logo-uv.png" alt="Universidad de Valparaíso" className="h-6 sm:h-8 md:h-10 object-contain" />
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 grid grid-cols-1 md:grid-cols-12">
          <section className="md:col-span-5 lg:col-span-4 border-b-[6px] md:border-b-0 md:border-r-[6px] border-gray-500 p-4 sm:p-6 md:p-8 flex flex-col gap-6 bg-white">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic">INGRESO ESTUDIANTE</h2>
              <p className="text-sm leading-tight font-bold border-l-4 border-gray-500 pl-3">
                INGRESE SUS DATOS PERSONALES Y CONTACTO INSTITUCIONAL. 
              </p>
            </div>

            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">Nombre Estudiante</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      {...register('firstName', { required: 'Obligatorio' })}
                      type="text" 
                      placeholder="Primer Nombre *" 
                      className={`w-full border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none ${errors.firstName ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                    />
                    {errors.firstName && <span className="text-[10px] font-bold text-red-600 uppercase">{errors.firstName.message}</span>}
                  </div>
                  <div>
                    <input
                      {...register('middleName')}
                      type="text" 
                      placeholder="Segundo Nombre" 
                      className="w-full border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none opacity-60"
                    />
                  </div>
                  <div>
                    <input
                      {...register('lastName', { required: 'Obligatorio' })}
                      type="text" 
                      placeholder="Apellido Paterno *" 
                      className={`w-full border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none ${errors.lastName ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                    />
                    {errors.lastName && <span className="text-[10px] font-bold text-red-600 uppercase">{errors.lastName.message}</span>}
                  </div>
                  <div>
                    <input
                      {...register('secondLastName', { required: 'Obligatorio' })}
                      type="text" 
                      placeholder="Apellido Materno *" 
                      className={`w-full border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none ${errors.secondLastName ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                    />
                    {errors.secondLastName && <span className="text-[10px] font-bold text-red-600 uppercase">{errors.secondLastName.message}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">RUT *</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      {...register('rutMain', { 
                        required: 'Obligatorio',
                        onChange: (e) => {
                          e.target.value = formatRutMain(e.target.value);
                        }
                      })}
                      type="text" 
                      placeholder="20.005.222" 
                      className={`w-full border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none ${errors.rutMain ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                    />
                  </div>
                  <span className="font-bold text-gray-500">-</span>
                  <div className="w-16">
                    <input
                      {...register('rutDv', { required: 'Obligatorio' })}
                      type="text" 
                      placeholder="K" 
                      maxLength={1}
                      className={`w-full text-center border-2 border-gray-500 p-2 text-sm focus:bg-gray-700 focus:text-white outline-none uppercase ${errors.rutDv ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                    />
                  </div>
                </div>
                {(errors.rutMain || errors.rutDv) && <p className="text-[10px] font-bold text-red-600 uppercase">RUT Obligatorio</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional *</label>
                <div className={`flex flex-col border-2 border-gray-500 ${errors.email ? 'border-red-500 bg-red-50' : ''}`}>
                  <input
                    {...register('email', {
                      required: 'El correo es obligatorio',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+$/,
                        message: 'Ingrese solo el usuario',
                      },
                    })}
                    type="text" 
                    placeholder="marcelo.rios" 
                    className={`w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0 ${errors.email ? 'bg-transparent text-red-900 placeholder:text-red-400' : ''}`}
                  />
                  <span className={`bg-gray-700 text-white p-2 border-t-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0 ${errors.email ? 'bg-red-500 border-red-500' : ''}`}>@estudiantes.uv.cl</span>
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.email.message}</p>}
              </div>
            </div>
            
            {errorMsg && (
              <div className="mt-4 border-2 border-gray-500 bg-red-100 p-3">
                 <p className="text-xs font-bold text-red-700 uppercase">{errorMsg}</p>
              </div>
            )}
            
            <div className="mt-auto pt-8 border-t-4 border-gray-500 flex flex-col gap-4">
               <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="w-full bg-gray-200 border-2 border-gray-500 text-black px-6 py-4 text-sm font-black uppercase hover:bg-gray-300 transition-colors cursor-pointer text-center"
                >
                  Modificar Registro
                </button>
               <button
                  type="button"
                  onClick={() => setShowRecoverModal(true)}
                  className="w-full bg-gray-200 border-2 border-gray-500 text-black px-6 py-4 text-sm font-black uppercase hover:bg-gray-300 transition-colors cursor-pointer text-center"
                >
                  Consultar Código Único de Seguimiento
                </button>
            </div>
          </section>

          <section className="md:col-span-7 lg:col-span-8 p-4 sm:p-6 md:p-8 flex flex-col gap-6 bg-white">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">Taller Integrado *</label>
                <select 
                  {...register('workshop', { required: 'Selecciona un taller' })}
                  className={`w-full border-2 border-gray-500 p-3 text-base md:text-lg font-bold appearance-none bg-white cursor-pointer hover:bg-gray-100 outline-none focus:ring-4 focus:ring-gray-700/20 ${errors.workshop ? 'border-red-500 bg-red-50 text-red-900' : ''}`}
                >
                  <option value="">SELECCIONAR TALLER...</option>
                  <optgroup label="PRIMER CICLO">
                    <option value="TI11 - 1A — Taller Integrado 1A">TI11 - 1A — Taller Integrado 1A (Romina Araya + Enrique Rivadeneira)</option>
                    <option value="TI11 - 1B — Taller Integrado 1B">TI11 - 1B — Taller Integrado 1B (Massiel Pérez + Ninoska Soza)</option>
                    <option value="TI11 - 1C — Taller Integrado 1C">TI11 - 1C — Taller Integrado 1C (José Tapia + Josefina Salgado)</option>
                    <option value="TI11 - 1D — Taller Integrado 1D">TI11 - 1D — Taller Integrado 1D (Matías Antezana + Adolfo Guzmán)</option>
                    <option value="TI12 - U — Taller Integrado 2">TI12 - U — Taller Integrado 2 (José Sánchez + Reinaldo Chong)</option>
                  </optgroup>
                  <optgroup label="SEGUNDO CICLO">
                    <option value="TIL21 - 1A — Taller Integrado Lugar 1">TIL21 - 1A — Taller Integrado Lugar 1 (Araceli Rodríguez + Pablo Duarte)</option>
                    <option value="TIL21 - 1B — Taller Integrado Lugar 1">TIL21 - 1B — Taller Integrado Lugar 1 (Tegualda Quiroga + Josefa Avendaño)</option>
                    <option value="TIC21 - 1A — Taller Integrado Ciudad 1">TIC21 - 1A — Taller Integrado Ciudad 1 (Mabel Santibáñez + Marcela Canales)</option>
                    <option value="TIC21 - 1B — Taller Integrado Ciudad 1">TIC21 - 1B — Taller Integrado Ciudad 1 (Juan Luis Moraga + Alexander Garrido)</option>
                    <option value="TIT21 - 1A — Taller Integrado Territorio 1">TIT21 - 1A — Taller Integrado Territorio 1 (Gustavo Ávila + Eduardo Hofmann + Silvia Dazarola)</option>
                    <option value="TIT21 - 1B — Taller Integrado Territorio 1">TIT21 - 1B — Taller Integrado Territorio 1 (Sven Martin + Diego Navarro)</option>
                    <option value="TIL-TIC-TIT21 - 1C — Taller Integrado Lugar-Ciudad-Territorio">TIL-TIC-TIT21 - 1C — Taller Integrado Lugar-Ciudad-Territorio (Cristian Rojas + Nicolás Cuadra + Manuel Recabal)</option>
                    <option value="TFC22 - 1A — Taller Integrado Fin de Ciclo 1">TFC22 - 1A — Taller Integrado Fin de Ciclo 1 (Gonzalo Fernández + Fidel Olfos)</option>
                    <option value="TFC22 - 1B — Taller Integrado Fin de Ciclo 1">TFC22 - 1B — Taller Integrado Fin de Ciclo 1 (Daniela Fullerton + Matías Olivero)</option>
                  </optgroup>
                  <optgroup label="TERCER CICLO">
                    <option value="TIL31 - A — Taller Integrado Lugar 2">TIL31 - A — Taller Integrado Lugar 2: Obra, Lugar, Materialidad (Rogelio Arancibia + Jorge Heen)</option>
                    <option value="TIL31 - B — Taller Integrado Lugar 2">TIL31 - B — Taller Integrado Lugar 2: Asentamientos Costeros (Eduardo Emparanza + Franz Stark)</option>
                    <option value="TIC31 - A — Taller Integrado Ciudad 2">TIC31 - A — Taller Integrado Ciudad 2: Arquitectura de la Ciudad (Gonzalo Abarca + José Agustín Vásquez)</option>
                    <option value="TIC31 - B — Taller Integrado Ciudad 2">TIC31 - B — Taller Integrado Ciudad 2: Taller Valparaíso (Claudio Vergara + Andrés Oyarzún + Gonzalo Herrera)</option>
                    <option value="TIT31 - A — Taller Integrado Territorio 2">TIT31 - A — Taller Integrado Territorio 2: Planificación Urbana Integral (Lautaro Ojeda + Sara Toledo)</option>
                    <option value="TIT31 - B — Taller Integrado Territorio 2">TIT31 - B — Taller Integrado Territorio 2: Arquitectura y Medioambiente (Aldo Boteselle + Paulo Donghi)</option>
                    <option value="TFC32 - A — Taller Integrado Fin de Ciclo 2">TFC32 - A — Taller Integrado Fin de Ciclo 2 (Marco Ávila + Mauricio Ortiz + Diego Ramírez)</option>
                    <option value="TFC32 - B — Taller Integrado Fin de Ciclo 2">TFC32 - B — Taller Integrado Fin de Ciclo 2 (Marco Ávila + Mauricio Ortiz + Diego Ramírez)</option>
                  </optgroup>
                </select>
                {errors.workshop && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.workshop.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest">Nombre del Proyecto *</label>
                <input 
                  {...register('projectName', { required: 'Obligatorio' })}
                  type="text" 
                  placeholder="TÍTULO DE LA OBRA" 
                  className={`w-full border-2 border-gray-500 p-3 text-base md:text-lg font-bold outline-none focus:bg-gray-700 focus:text-white ${errors.projectName ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                />
                {errors.projectName && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.projectName.message}</p>}
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-[120px]">
              <label className="block text-xs font-black uppercase tracking-widest">Breve Memoria Proyecto *</label>
              <textarea 
                {...register('projectDescription', { 
                  required: 'Obligatorio',
                  validate: value => (value.trim().split(/\s+/).filter(Boolean).length <= 300) || 'Límite de 300 palabras excedido'
                })}
                className={`w-full flex-1 min-h-[100px] border-2 border-gray-500 p-3 text-sm resize-none outline-none focus:bg-gray-700 focus:text-white ${errors.projectDescription ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                placeholder="Describa el concepto principal y los objetivos..."
              ></textarea>
              <div className="flex justify-between items-start mt-1">
                <span className="text-[10px] font-bold text-gray-500 block text-right w-full">{wordCount} / 300 palabras</span>
              </div>
              {errors.projectDescription && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.projectDescription.message}</p>}
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-[120px]">
              <label className="block text-xs font-black uppercase tracking-widest">Materiales Utilizados en Maqueta/Modelo *</label>
              <textarea 
                {...register('materials', { required: 'Obligatorio' })}
                className={`w-full flex-1 min-h-[100px] border-2 border-gray-500 p-3 text-sm resize-none outline-none focus:bg-gray-700 focus:text-white ${errors.materials ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : ''}`}
                placeholder="Cartón madera, acrílico, impresión 3D, filamento PLA..."
              ></textarea>
              {errors.materials && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.materials.message}</p>}
            </div>

            <div className="mt-auto flex flex-col xl:flex-row items-center justify-between border-t-4 border-gray-500 pt-6 gap-6">
              <div className="flex flex-col gap-2 w-full xl:w-auto">
                 <p className="text-[10px] font-bold max-w-[400px] leading-tight uppercase">
                    Al enviar, se generará un código único de seguimiento que será el identificador de su registro.
                 </p>
                 <p className="text-[10px] font-bold max-w-[400px] leading-tight text-gray-500">
                    *Equipo curatorial se reservará el derecho de editar memoria proyecto para unificar estilos de redaccion y longitud de textos.
                 </p>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full xl:w-auto bg-[#003C58] text-white px-8 md:px-12 py-4 text-xl md:text-2xl font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center border-4 border-transparent hover:border-gray-500 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> PROCESANDO...</>
                ) : (
                  editModeCode ? 'Actualizar Registro' : 'Enviar Registro'
                )}
              </button>
            </div>
          </section>
        </form>

        <footer className="bg-[#003C58] text-white p-3 flex flex-col sm:flex-row justify-end items-center gap-2 mt-auto">
          <div className="text-[10px] font-mono uppercase text-center sm:text-right">Escuela de Arquitectura, Universidad de Valparaíso - 2026</div>
        </footer>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
              <h2 className="text-2xl font-black uppercase italic mb-6">Modificar Ingreso</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest">Código de Estudiante</label>
                  <input
                    name="code"
                    required
                    type="text"
                    placeholder="UV-2026-XXXX"
                    className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional</label>
                  <div className="flex flex-col border-2 border-gray-500">
                    <input
                      name="emailPrefix"
                      required
                      type="text"
                      placeholder="marcelo.rios"
                      className="w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0"
                    />
                    <span className="bg-gray-700 text-white p-2 border-t-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0">@estudiantes.uv.cl</span>
                  </div>
                </div>

                {loginError && (
                  <div className="border-2 border-gray-500 bg-red-100 p-3">
                    <p className="text-xs font-bold text-red-700 uppercase">{loginError}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t-4 border-gray-500 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 bg-white border-4 border-gray-500 text-black px-4 py-3 font-black uppercase hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="flex-1 bg-[#003C58] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500 cursor-pointer"
                  >
                    {isLoggingIn ? 'Cargando...' : 'Ingresar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRecoverModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-[8px] border-gray-500 p-8 w-full max-w-md">
              <h2 className="text-2xl font-black uppercase italic mb-6">Consultar Código</h2>
              
              {!recoveredCode ? (
                <form onSubmit={handleRecoverCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional</label>
                    <div className="flex flex-col border-2 border-gray-500">
                      <input
                        name="emailPrefix"
                        required
                        type="text"
                        placeholder="marcelo.rios"
                        className="w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0"
                      />
                      <span className="bg-gray-700 text-white p-2 border-t-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0">@estudiantes.uv.cl</span>
                    </div>
                  </div>

                  {recoverError && (
                    <div className="border-2 border-gray-500 bg-red-100 p-3">
                      <p className="text-xs font-bold text-red-700 uppercase">{recoverError}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t-4 border-gray-500 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowRecoverModal(false)}
                      className="flex-1 bg-white border-4 border-gray-500 text-black px-4 py-3 font-black uppercase hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isRecovering}
                      className="flex-1 bg-[#003C58] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 border-4 border-transparent hover:border-gray-500 cursor-pointer"
                    >
                      {isRecovering ? 'Cargando...' : 'Consultar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm font-bold">Hemos encontrado tu registro. Tu código es:</p>
                  <div className="border-4 border-gray-500 p-4 bg-[#003C58] text-white text-center">
                    <p className="text-3xl font-mono font-black">{recoveredCode}</p>
                  </div>
                  <div className="pt-4 border-t-4 border-gray-500 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoverModal(false);
                        setRecoveredCode(null);
                      }}
                      className="w-full bg-[#003C58] text-white px-4 py-3 font-black uppercase hover:opacity-80 transition-opacity cursor-pointer border-4 border-transparent hover:border-gray-500"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
