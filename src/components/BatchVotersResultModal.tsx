import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileText, Eye, Users } from 'lucide-react';
import type { TituloExtracaoResponse } from '../types';
import { PhotoModal } from './PhotoModal';

interface BatchVotersResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TituloExtracaoResponse | null;
  chefeNome?: string;
}

export const BatchVotersResultModal = ({
  isOpen,
  onClose,
  result,
  chefeNome
}: BatchVotersResultModalProps) => {
  const [showOriginalDoc, setShowOriginalDoc] = useState(false);

  if (!isOpen || !result) return null;

  const eleitores = result.eleitoresSalvos || [];
  const total = result.totalSalvos || eleitores.length;
  const docFilename = result.documentoSalvoEmChefe || result.fotoDocumento;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-950 text-lg flex items-center gap-2">
                  <span>{total} {total === 1 ? 'Eleitor Cadastrado' : 'Eleitores Cadastrados'} Automaticamente!</span>
                </h3>
                <p className="text-xs text-gray-600">
                  {chefeNome ? `Vinculados à família de ${chefeNome}` : 'Eleitores inseridos no banco de dados com sucesso.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* ALERTA DE CONFERÊNCIA OBRIGATÓRIA */}
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3 shadow-xs">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle size={22} className="text-amber-700" />
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <h4 className="font-bold text-amber-900 text-sm sm:text-base">
                  ⚠️ ATENÇÃO: Conferência Obrigatória dos Dados!
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  Os dados acima foram lidos e interpretados por Inteligência Artificial diretamente a partir do documento (especialmente em listas manuscritas).
                </p>
                <p className="text-amber-900 font-semibold leading-relaxed">
                  Podem ocorrer pequenas divergências ou imprecisões de leitura em nomes, números de títulos, zonas ou seções. Por favor, <u>revise e verifique</u> se todos os dados cadastrados estão corretos na listagem.
                </p>
              </div>
            </div>

            {/* Aviso sobre Documento salvo no Chefe */}
            {docFilename && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-semibold block">Documento Arquivado no Chefe de Família</span>
                    <span className="text-blue-700">A foto original da lista foi salva nos Documentos do Chefe para consulta.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOriginalDoc(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Eye size={14} />
                  <span>Ver Foto Original</span>
                </button>
              </div>
            )}

            {/* Lista dos Eleitores Salvos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={16} className="text-gray-400" />
                  <span>Eleitores Identificados e Salvos ({eleitores.length})</span>
                </h4>
                <span className="text-[11px] text-gray-500">Já gravados no banco</span>
              </div>

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                {eleitores.map((eleitor, idx) => (
                  <div key={eleitor.id || idx} className="p-3.5 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{eleitor.nome}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                          <span>Título: <strong className="text-gray-700 font-medium">{eleitor.tituloEleitor || 'Não informado'}</strong></span>
                          <span>Zona: <strong className="text-gray-700 font-medium">{eleitor.zona || '-'}</strong></span>
                          <span>Seção: <strong className="text-gray-700 font-medium">{eleitor.secao || '-'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-xs text-gray-600 shrink-0">
                      {eleitor.telefone && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          📞 {eleitor.telefone}
                        </span>
                      )}
                      {eleitor.dataNascimento && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          🎂 {new Date(eleitor.dataNascimento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Você pode editar qualquer dado dos eleitores na tela principal a qualquer momento.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all hover:shadow active:scale-95 cursor-pointer ml-auto"
            >
              Entendido, vou conferir os cadastros
            </button>
          </div>
        </div>
      </div>

      {/* Modal de foto original */}
      {docFilename && (
        <PhotoModal
          isOpen={showOriginalDoc}
          onClose={() => setShowOriginalDoc(false)}
          title="Documento / Lista Original Escaneada"
          filename={docFilename}
          subtitle={chefeNome ? `Arquivo salvo nos documentos de ${chefeNome}` : 'Documento da Lista de Eleitores'}
        />
      )}
    </>
  );
};
