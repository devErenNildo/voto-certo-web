import toast from 'react-hot-toast';

export const confirmDialog = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[260px]">
        <p className="text-gray-800 font-medium text-sm">{message}</p>
        <div className="flex justify-end gap-2">
          <button 
            type="button"
            className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              toast.remove(t.id);
              resolve(false);
            }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              toast.remove(t.id);
              resolve(true);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ), {
      id: 'confirm-dialog',
      duration: Infinity,
      position: 'top-center',
      style: {
        border: '1px solid #ef4444',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }
    });
  });
};
