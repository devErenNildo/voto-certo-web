import { useState, useRef } from 'react';
import api from '../services/api';
import type { TituloExtracaoResponse } from '../types';
import { Sparkles, Camera, Loader2, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentScannerBannerProps {
  onDataExtracted: (data: TituloExtracaoResponse) => void;
  className?: string;
}

export const DocumentScannerBanner = ({
  onDataExtracted,
  className = ''
}: DocumentScannerBannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Analisando Título de Eleitor com IA DeepSeek...');

    try {
      const response = await api.post<TituloExtracaoResponse>('/api/ocr/extrair-titulo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      if (data) {
        onDataExtracted(data);
        if (data.sucesso) {
          toast.success('Dados do Título extraídos com sucesso! Formulário preenchido.', { id: toastId });
          setLastScannedName(data.nome || 'Documento lido');
        } else {
          toast(data.mensagem || 'Foto anexada. Alguns campos não puderam ser lidos automaticamente.', {
            id: toastId,
            icon: '⚠️',
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao analisar título', error);
      toast.error(
        error.response?.data?.message || 'Não foi possível ler o documento com a IA. Você pode preencher manualmente.',
        { id: toastId }
      );
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/50 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
            {isScanning ? (
              <Loader2 size={20} className="animate-spin" />
            ) : lastScannedName ? (
              <FileCheck size={20} className="text-emerald-300" />
            ) : (
              <Sparkles size={20} />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-gray-900">
                Preenchimento Inteligente com IA
              </h4>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                DeepSeek Vision
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Tire foto ou envie o arquivo do Título (físico ou e-Título) para preencher os dados automaticamente.
            </p>
            {lastScannedName && !isScanning && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                ✓ Último lido: <strong>{lastScannedName}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isScanning}
          />
          <button
            type="button"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Lendo documento...</span>
              </>
            ) : (
              <>
                <Camera size={16} />
                <span>Escanear Título</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
