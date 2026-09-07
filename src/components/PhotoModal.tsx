import { X, FileText } from 'lucide-react';
import { SecureImage } from './SecureImage';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageFilename?: string | null;
  filename?: string | null;
  subtitle?: string;
}

export const PhotoModal = ({
  isOpen,
  onClose,
  title,
  imageFilename,
  filename,
  subtitle
}: PhotoModalProps) => {
  const fileToDisplay = filename || imageFilename;
  if (!isOpen || !fileToDisplay) return null;

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
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
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
                <p className="text-sm">Não foi possível carregar a imagem do título.</p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
