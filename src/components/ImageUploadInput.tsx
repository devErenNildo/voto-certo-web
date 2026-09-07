import { useState, useRef } from 'react';
import api from '../services/api';
import { SecureImage } from './SecureImage';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadInputProps {
  label: string;
  value?: string | null;
  onChange: (filename: string | null) => void;
  description?: string;
  tipo?: 'perfil' | 'titulo' | string;
}

export const ImageUploadInput = ({
  label,
  value,
  onChange,
  description
}: ImageUploadInputProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(response.data.filename);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar imagem', error);
      toast.error(error.response?.data?.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && <span className="text-xs text-gray-500">{description}</span>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-100 flex items-center justify-center">
            <SecureImage
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              fallbackIcon={<Camera size={20} className="text-gray-400" />}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">Foto enviada</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Salva com sucesso</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
            title="Remover foto"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-dashed border-gray-300 bg-white hover:bg-gray-50 hover:border-primary text-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin text-primary" />
              <span>Enviando foto...</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-gray-400" />
              <span>Selecionar foto</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
