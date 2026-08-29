import toast from 'react-hot-toast';

export const confirmDialog = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[250px]">
        <p className="text-gray-800 font-medium">{message}</p>
        <div className="flex justify-end gap-2">
          <button 
            className="px-3 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
          >
            Cancelar
          </button>
          <button 
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        border: '1px solid #ef4444',
        padding: '16px',
      }
    });
  });
};
