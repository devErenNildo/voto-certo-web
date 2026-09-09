import { useState, useRef } from 'react';
import api from '../services/api';
import { SecureImage } from './SecureImage';
import { Upload, X, Loader2, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface MultiImageUploadInputProps {
  label: string;
  description?: string;
  maxFiles?: number;
  values: string[];
  onChange: (filenames: string[]) => void;
  onViewImage?: (filename: string, index: number) => void;
}

export const MultiImageUploadInput = ({
  label,
  description = 'Envie fotos de documentos (RG, CNH, Comprovante de Residência ou Lista de Eleitores).',
  maxFiles = 5,
  values = [],
  onChange,
  onViewImage
}: MultiImageUploadInputProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = maxFiles - values.length;
    if (availableSlots <= 0) {
      toast.error(`Limite máximo de ${maxFiles} documentos atingido.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast(`Apenas os primeiros ${availableSlots} arquivos selecionados foram enviados (limite de ${maxFiles}).`, {
        icon: 'ℹ️'
      });
    }

    setIsUploading(true);
    const newUploadedFilenames: string[] = [];

    try {
      for (const file of filesToUpload) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`O arquivo "${file.name}" excede o tamanho máximo de 50MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data && response.data.filename) {
          newUploadedFilenames.push(response.data.filename);
        }
      }

      if (newUploadedFilenames.length > 0) {
        onChange([...values, ...newUploadedFilenames]);
        toast.success(`${newUploadedFilenames.length} ${newUploadedFilenames.length === 1 ? 'documento anexado' : 'documentos anexados'} com sucesso!`);
      }
    } catch (error: any) {
      console.error('Erro ao enviar documentos', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar alguns arquivos.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (filenameToRemove: string, indexToRemove: number) => {
    const updated = values.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    try {
      setRemovingIndex(indexToRemove);
      await api.delete(`/api/imagens/${filenameToRemove}`);
      toast.success('Documento removido.');
    } catch (error: any) {
      console.warn('Aviso: falha ao remover arquivo do disco', error);
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          values.length >= maxFiles ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {values.length}/{maxFiles} documentos
        </span>
      </div>
      {description && <span className="text-xs text-gray-500">{description}</span>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        multiple
        className="hidden"
        disabled={isUploading || values.length >= maxFiles}
      />

      {/* Grid de fotos anexadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
        {values.map((filename, index) => (
          <div
            key={`${filename}-${index}`}
            className="group relative aspect-square rounded-xl border border-gray-200 overflow-hidden bg-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-full h-full">
              <SecureImage
                filename={filename}
                alt={`Documento ${index + 1}`}
                className="w-full h-full object-cover"
                fallback={
                  <div className="flex flex-col items-center justify-center w-full h-full p-2 text-gray-400">
                    <FileText size={22} className="mb-1" />
                    <span className="text-[10px] text-center font-medium">Doc {index + 1}</span>
                  </div>
                }
              />
            </div>

            {/* Overlay com Ações */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1.5">
              {onViewImage && (
                <button
                  type="button"
                  onClick={() => onViewImage(filename, index)}
                  className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm hover:scale-105 transition-all cursor-pointer"
                  title="Ampliar documento"
                >
                  <Eye size={15} />
                </button>
              )}
              <button
                type="button"
                disabled={removingIndex === index}
                onClick={() => handleRemove(filename, index)}
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                title="Remover documento"
              >
                {removingIndex === index ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <X size={15} />
                )}
              </button>
            </div>

            {/* Badge de numeração */}
            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
              #{index + 1}
            </span>
          </div>
        ))}

        {/* Botão de Adicionar Mais (se < maxFiles) */}
        {values.length < maxFiles && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary bg-white hover:bg-blue-50/50 text-gray-500 hover:text-primary transition-all disabled:opacity-50 cursor-pointer group"
          >
            {isUploading ? (
              <>
                <Loader2 size={22} className="animate-spin text-primary" />
                <span className="text-[11px] font-medium">Enviando...</span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-blue-100 text-gray-400 group-hover:text-primary transition-colors">
                  <Upload size={18} />
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight">
                  + Adicionar Documento
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
