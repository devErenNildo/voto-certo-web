import { useState } from 'react';
import { X, FileText, Trash2, Loader2 } from 'lucide-react';
import { SecureImage } from './SecureImage';
import { confirmDialog } from '../utils/confirm';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageFilename?: string | null;
  filename?: string | null;
  subtitle?: string;
  onDelete?: () => Promise<void> | void;
  deleteTooltip?: string;
}

export const PhotoModal = ({
  isOpen,
  onClose,
  title,
  imageFilename,
  filename,
  subtitle,
  onDelete,
  deleteTooltip
}: PhotoModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const fileToDisplay = filename || imageFilename;
  if (!isOpen || !fileToDisplay) return null;

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = await confirmDialog('Tem certeza que deseja apagar esta foto? O arquivo será excluído permanentemente do servidor.');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      console.error('Erro ao apagar foto no modal', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-xl border border-red-200 hover:border-red-600 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title={deleteTooltip || 'Apagar esta foto'}
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>{isDeleting ? 'Apagando...' : 'Apagar Foto'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900/5 flex items-center justify-center min-h-[300px]">
          <SecureImage
            src={fileToDisplay}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
            fallbackIcon={
              <div className="text-center p-8 text-gray-400">
                <FileText size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Não foi possível carregar a imagem.</p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
