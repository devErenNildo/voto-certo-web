import { useState, useEffect } from 'react';
import { X, Files, Eye, FileText, Trash2 } from 'lucide-react';
import { SecureImage } from './SecureImage';
import { PhotoModal } from './PhotoModal';
import { confirmDialog } from '../utils/confirm';
import api from '../services/api';
import toast from 'react-hot-toast';

interface DocumentGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  documentos: string[];
  onDocumentDeleted?: (filename: string) => void;
}

export const DocumentGalleryModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  documentos = [],
  onDocumentDeleted
}: DocumentGalleryModalProps) => {
  const [currentDocs, setCurrentDocs] = useState<string[]>(documentos);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    isOpen: boolean;
    title: string;
    filename?: string | null;
    subtitle?: string;
  }>({
    isOpen: false,
    title: '',
    filename: null,
    subtitle: ''
  });

  useEffect(() => {
    setCurrentDocs(documentos);
  }, [documentos]);

  const handleDelete = async (filename: string) => {
    const confirmed = await confirmDialog('Tem certeza que deseja apagar este documento? Esta ação removerá o arquivo permanentemente.');
    if (!confirmed) return;

    try {
      await api.delete(`/api/imagens/${filename}`);
      toast.success('Documento apagado com sucesso!');
      setCurrentDocs(prev => prev.filter(d => d !== filename));
      if (selectedPhoto.filename === filename) {
        setSelectedPhoto(prev => ({ ...prev, isOpen: false, filename: null }));
      }
      onDocumentDeleted?.(filename);
    } catch (error: any) {
      console.error('Erro ao apagar documento', error);
      toast.error(error.response?.data?.message || 'Erro ao apagar documento.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Files size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-950 text-base">{title}</h3>
                <p className="text-xs text-gray-500">
                  {subtitle || `${currentDocs.length} ${currentDocs.length === 1 ? 'documento anexado' : 'documentos anexados'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentDocs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText size={48} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-gray-600">Nenhum documento adicional anexado.</p>
                <p className="text-xs mt-1">Fotos de listas ou outros documentos anexados ao chefe aparecerão aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentDocs.map((filename, index) => (
                  <div
                    key={`${filename}-${index}`}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="relative aspect-4/3 bg-gray-100 overflow-hidden flex items-center justify-center">
                      <SecureImage
                        filename={filename}
                        alt={`Documento ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        fallback={
                          <div className="flex flex-col items-center justify-center p-4 text-gray-400">
                            <FileText size={32} className="mb-1 opacity-50" />
                            <span className="text-xs">Documento #{index + 1}</span>
                          </div>
                        }
                      />
                      <span className="absolute top-2 left-2 text-[11px] font-bold bg-black/70 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                        Documento #{index + 1}
                      </span>
                    </div>

                    <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <span className="text-xs font-semibold text-gray-700">Foto #{index + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({
                            isOpen: true,
                            title: `Documento #${index + 1} - ${title}`,
                            filename: filename,
                            subtitle: `Documento da Família`
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(filename)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Apagar este documento"
                        >
                          <Trash2 size={13} />
                          <span>Apagar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de visualização de foto em alta definição com opção de apagar */}
      <PhotoModal
        isOpen={selectedPhoto.isOpen}
        onClose={() => setSelectedPhoto(prev => ({ ...prev, isOpen: false }))}
        title={selectedPhoto.title}
        filename={selectedPhoto.filename}
        subtitle={selectedPhoto.subtitle}
        onDelete={selectedPhoto.filename ? () => handleDelete(selectedPhoto.filename!) : undefined}
        deleteTooltip="Apagar este documento permanentemente"
      />
    </>
  );
};
