import React, { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { FormData, Member, Submission } from './types';

interface Props {
  initialData?: Submission;
  mode: 'individual' | 'grupal' | 'edit';
  onSubmit: (data: FormData, code?: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const WORKSHOPS = [
  'TI11 - 1A — Taller Integrado 1A (Romina Araya + Enrique Rivadeneira)',
  'TI11 - 1B — Taller Integrado 1B (Massiel Pérez + Ninoska Soza)',
  'TI11 - 1C — Taller Integrado 1C (José Tapia + Josefina Salgado)',
  'TI11 - 1D — Taller Integrado 1D (Matías Antezana + Adolfo Guzmán)',
  'TI12 — Taller Integrado 2 (José Sánchez + Reinaldo Chong)',
  'TIL21 - 1A — Taller Integrado Lugar 1 (Araceli Rodríguez + Pablo Duarte)',
  'TIL21 - 1B — Taller Integrado Lugar 1 (Tegualda Quiroga + Josefa Avendaño)',
  'TIC21 - 1A — Taller Integrado Ciudad 1 (Mabel Santibáñez + Marcela Canales)',
  'TIC21 - 1B — Taller Integrado Ciudad 1 (Juan Luis Moraga + Alexander Garrido)',
  'TIT21 - 1A — Taller Integrado Territorio 1 (Gustavo Ávila + Eduardo Hofmann + Silvia Dazarola)',
  'TIT21 - 1B — Taller Integrado Territorio 1 (Sven Martin + Diego Navarro)',
  'TIL-TIC-TIT21 - 1C — Taller Integrado Lugar-Ciudad-Territorio (Cristian Rojas + Nicolás Cuadra + Manuel Recabal)',
  'TFC22 - 1A — Taller Integrado Fin de Ciclo 1 (Gonzalo Fernández + Fidel Olfos)',
  'TFC22 - 1B — Taller Integrado Fin de Ciclo 1 (Daniela Fullerton + Matías Olivero)',
  'TIL31 - A — Taller Integrado Lugar 2: Obra, Lugar, Materialidad (Rogelio Arancibia + Jorge Heen)',
  'TIL31 - B — Taller Integrado Lugar 2: Asentamientos Costeros (Eduardo Emparanza + Franz Stark)',
  'TIC31 - A — Taller Integrado Ciudad 2: Arquitectura de la Ciudad (Gonzalo Abarca + José Agustín Vásquez)',
  'TIC31 - B — Taller Integrado Ciudad 2: Taller Valparaíso (Claudio Vergara + Andrés Oyarzún + Gonzalo Herrera)',
  'TIT31 - A — Taller Integrado Territorio 2: Planificación Urbana Integral (Lautaro Ojeda + Sara Toledo)',
  'TIT31 - B — Taller Integrado Territorio 2: Arquitectura y Medioambiente (Aldo Boteselle + Paulo Donghi)',
  'TFC32 - A — Taller Integrado Fin de Ciclo 2 (Marco Ávila + Mauricio Ortiz + Diego Ramírez)',
  'TFC32 - B — Taller Integrado Fin de Ciclo 2 (Marco Ávila + Mauricio Ortiz + Diego Ramírez)'
];

export default function AppForm({ initialData, mode, onSubmit, onCancel, isSubmitting }: Props) {
  const isGrupal = mode === 'grupal' || (mode === 'edit' && initialData?.type === 'grupal');
  
  const [formData, setFormData] = useState<FormData>(initialData || {
    type: mode === 'grupal' ? 'grupal' : 'individual',
    members: [],
    rut: '',
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    email: '',
    workshop: '',
    projectName: '',
    projectDescription: '',
    materials: ''
  });

  const [emailPrefix, setEmailPrefix] = useState(
    initialData ? initialData.email.split('@')[0] : ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
  };

  const addMember = () => {
    setFormData({ ...formData, members: [...formData.members, { firstName: '', lastName: '' }] });
  };

  const removeMember = (index: number) => {
    const newMembers = [...formData.members];
    newMembers.splice(index, 1);
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (formData.projectDescription.split(/\s+/).length > 250) {
      newErrors.projectDescription = 'Máximo 250 palabras.';
    }
    if (formData.materials.split(/\s+/).length > 150) {
      newErrors.materials = 'Máximo 150 palabras.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalData = {
      ...formData,
      email: `${emailPrefix}@estudiantes.uv.cl`
    };

    onSubmit(finalData, initialData?.code);
  };

  return (
    <div className="bg-white shadow-xl p-6 md:p-10 mb-8 max-w-5xl mx-auto w-full relative z-10">
      <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-8 border-b-4 border-gray-500 pb-4">
        {mode === 'edit' ? 'Modificar Registro' : (isGrupal ? 'Ingreso Maqueta/modelo Grupal' : 'Ingreso Maqueta/modelo Individual')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Personal Details */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-8 w-8 bg-[#4B577E] text-white flex items-center justify-center font-black text-xl">1</div>
            <h2 className="text-xl md:text-2xl font-black uppercase">Datos {isGrupal ? 'Representante' : 'Estudiante'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">RUT (Sin puntos ni guión)</label>
              <input required name="rut" value={formData.rut} onChange={handleChange} type="text" placeholder="12345678" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Primer Nombre</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} type="text" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Segundo Nombre (Opcional)</label>
              <input name="middleName" value={formData.middleName} onChange={handleChange} type="text" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Apellido Paterno</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} type="text" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Apellido Materno</label>
              <input required name="secondLastName" value={formData.secondLastName} onChange={handleChange} type="text" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Correo Institucional</label>
              <div className="flex flex-col sm:flex-row border-2 border-gray-500">
                <input required value={emailPrefix} onChange={(e) => setEmailPrefix(e.target.value)} type="text" placeholder="marcelo.rios" className="w-full p-3 text-base outline-none focus:bg-gray-700 focus:text-white min-w-0" />
                <span className="bg-gray-700 text-white p-3 sm:border-l-2 border-gray-500 flex items-center justify-center font-mono text-xs shrink-0 whitespace-nowrap">@estudiantes.uv.cl</span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest">Sección Taller Integrado</label>
              <select required name="workshop" value={formData.workshop} onChange={handleChange} className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white cursor-pointer bg-white">
                <option value="" disabled>SELECCIONAR SECCIÓN...</option>
                {WORKSHOPS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
        </section>

        {isGrupal && (
          <section className="border-t-4 border-gray-500 pt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-8 w-8 bg-[#4B577E] text-white flex items-center justify-center font-black text-xl">2</div>
              <h2 className="text-xl md:text-2xl font-black uppercase">Otros Integrantes</h2>
            </div>
            <div className="space-y-4">
              {formData.members.map((member, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 border-2 border-gray-300">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-black uppercase tracking-widest mb-1">Nombres</label>
                    <input required value={member.firstName} onChange={(e) => handleMemberChange(index, 'firstName', e.target.value)} type="text" className="w-full border-2 border-gray-500 p-2 text-base outline-none focus:bg-gray-700 focus:text-white uppercase" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-black uppercase tracking-widest mb-1">Apellidos</label>
                    <input required value={member.lastName} onChange={(e) => handleMemberChange(index, 'lastName', e.target.value)} type="text" className="w-full border-2 border-gray-500 p-2 text-base outline-none focus:bg-gray-700 focus:text-white uppercase" />
                  </div>
                  <button type="button" onClick={() => removeMember(index)} className="bg-red-600 text-white p-3 hover:bg-red-700 transition-colors shrink-0 w-full sm:w-auto flex justify-center">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addMember} className="flex items-center gap-2 font-bold uppercase text-sm border-2 border-dashed border-gray-500 p-4 w-full justify-center hover:bg-gray-100 transition-colors text-gray-700">
                <Plus className="w-5 h-5" /> Añadir Integrante
              </button>
            </div>
          </section>
        )}

        {/* Project Details */}
        <section className="border-t-4 border-gray-500 pt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-8 w-8 bg-[#4B577E] text-white flex items-center justify-center font-black text-xl">{isGrupal ? '3' : '2'}</div>
            <h2 className="text-xl md:text-2xl font-black uppercase">Ficha Técnica</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest">Nombre del Proyecto</label>
              <input required name="projectName" value={formData.projectName} onChange={handleChange} type="text" className="w-full border-2 border-gray-500 p-3 text-base font-bold outline-none focus:bg-gray-700 focus:text-white uppercase" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-xs font-black uppercase tracking-widest">Memoria de Proyecto</label>
                <span className="text-[10px] font-mono font-bold text-gray-500">{formData.projectDescription.split(/\s+/).filter(w => w.length > 0).length}/250 palabras</span>
              </div>
              <textarea required name="projectDescription" value={formData.projectDescription} onChange={handleChange} rows={6} className="w-full border-2 border-gray-500 p-3 text-base outline-none focus:bg-gray-700 focus:text-white resize-none" />
              {errors.projectDescription && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.projectDescription}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-xs font-black uppercase tracking-widest">Materialidades</label>
                <span className="text-[10px] font-mono font-bold text-gray-500">{formData.materials.split(/\s+/).filter(w => w.length > 0).length}/150 palabras</span>
              </div>
              <textarea required name="materials" value={formData.materials} onChange={handleChange} rows={4} className="w-full border-2 border-gray-500 p-3 text-base outline-none focus:bg-gray-700 focus:text-white resize-none" />
              {errors.materials && <p className="text-[10px] font-bold text-red-600 uppercase">{errors.materials}</p>}
            </div>
          </div>
        </section>

        {/* Submit */}
        <section className="border-t-4 border-gray-500 pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto bg-white border-4 border-gray-500 text-black px-8 py-4 font-black uppercase hover:bg-gray-100 transition-colors">
            Volver
          </button>
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-[#4B577E] text-white px-8 py-4 text-xl md:text-xl font-black uppercase hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center border-4 border-transparent hover:border-gray-500">
            {isSubmitting ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> PROCESANDO...</> : (mode === 'edit' ? 'Actualizar Registro' : 'Enviar Registro')}
          </button>
        </section>
      </form>
    </div>
  );
}
