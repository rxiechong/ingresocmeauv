import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, ArrowLeft } from 'lucide-react';
import { FormData } from './types';

interface Props {
  code: string;
  formData: FormData;
  onHome: () => void;
}

export default function Success({ code, formData, onHome }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `comprobante-${code}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error generating image', err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
      <div 
        ref={cardRef} 
        className="bg-white p-8 md:p-12 w-full text-center shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-4 bg-[#040823]"></div>
        
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-2 mt-4 text-[#040823]">¡Registro Exitoso!</h2>
        <p className="text-gray-500 font-bold uppercase text-sm mb-8 tracking-widest">Taller Integrado UV 2026</p>
        
        <div className="border-4 border-gray-500 p-6 mb-8 bg-gray-50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Tu Código de Seguimiento</p>
          <p className="text-5xl md:text-6xl font-mono font-black tracking-tighter text-[#040823]">{code}</p>
        </div>
        
        <div className="text-left space-y-4 border-t-4 border-gray-200 pt-8 mt-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Responsable</p>
            <p className="font-bold text-lg uppercase">{formData.firstName} {formData.lastName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Proyecto</p>
            <p className="font-bold text-lg uppercase">{formData.projectName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taller</p>
            <p className="font-bold text-lg uppercase">{formData.workshop}</p>
          </div>
          {formData.type === 'grupal' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo</p>
              <p className="font-bold text-lg uppercase">Trabajo Grupal ({formData.members.length + 1} integrantes)</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm font-bold text-gray-500 mt-6 text-center max-w-md">
        Por favor toma un pantallazo o descarga este comprobante y guarda tu código. No enviaremos correo de confirmación. En caso de olvidarlo, siempre podrás recuperar tu código en la pantalla de inicio con tu RUT y correo.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
        <button 
          onClick={handleDownload}
          className="flex-1 bg-[#040823] text-white px-6 py-4 font-black uppercase hover:opacity-80 transition-opacity flex items-center justify-center gap-2 border-4 border-transparent"
        >
          <Download className="w-5 h-5" /> Descargar 
        </button>
        <button 
          onClick={onHome}
          className="flex-1 bg-white text-black px-6 py-4 font-black uppercase hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border-4 border-gray-500"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al Inicio
        </button>
      </div>
    </div>
  );
}
