import React, { useState, useEffect } from 'react';
import { X, Crown, Users, Eye, AlertCircle, Check, Trash2, Edit2, Loader2, MapPin } from 'lucide-react';
import type { TituloExtracaoResponse, EleitorExtraido, ChefeFamiliaResponse, CadastroFamiliaComListaRequest } from '../types';
import { PhotoModal } from './PhotoModal';
import api from '../services/api';
import toast from 'react-hot-toast';

interface EscolhaChefeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TituloExtracaoResponse | null;
  onSuccess: (chefe: ChefeFamiliaResponse) => void;
}

export const EscolhaChefeModal: React.FC<EscolhaChefeModalProps> = ({
  isOpen,
  onClose,
  result,
  onSuccess,
}) => {
  const [eleitores, setEleitores] = useState<EleitorExtraido[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [endereco, setEndereco] = useState<string>('');
  const [bairro, setBairro] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOriginalDoc, setShowOriginalDoc] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (result && result.eleitoresIdentificados && result.eleitoresIdentificados.length > 0) {
      setEleitores([...result.eleitoresIdentificados]);
      setSelectedIndex(0);
      setEndereco('');
      setBairro('');
      setEditingIndex(null);
    } else {
      setEleitores([]);
    }
  }, [result]);

  if (!isOpen || !result) return null;

  const docFilename = result.fotoDocumento;
  const chefeSelecionado = eleitores[selectedIndex];

  const handleUpdateField = (index: number, field: keyof EleitorExtraido, value: string) => {
    setEleitores((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveEleitor = (indexToRemove: number) => {
    if (eleitores.length <= 1) {
      toast.error('A lista precisa de pelo menos 1 pessoa para ser cadastrada.');
      return;
    }

    const novosEleitores = eleitores.filter((_, idx) => idx !== indexToRemove);
    setEleitores(novosEleitores);

    if (selectedIndex === indexToRemove) {
      setSelectedIndex(0);
    } else if (selectedIndex > indexToRemove) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleConfirmar = async () => {
    if (!chefeSelecionado || !chefeSelecionado.nome?.trim()) {
      toast.error('Selecione uma pessoa com nome válido para ser o Chefe de Família.');
      return;
    }

    const integrantes = eleitores.filter((_, idx) => idx !== selectedIndex);

    const payload: CadastroFamiliaComListaRequest = {
      chefe: {
        nome: chefeSelecionado.nome.trim(),
        tituloEleitor: chefeSelecionado.tituloEleitor?.trim() || null,
        zona: chefeSelecionado.zona?.trim() || null,
        secao: chefeSelecionado.secao?.trim() || null,
        telefone: chefeSelecionado.telefone?.trim() || null,
        dataNascimento: chefeSelecionado.dataNascimento?.trim() || null,
      },
      integrantes: integrantes.map((integ) => ({
        nome: integ.nome.trim(),
        tituloEleitor: integ.tituloEleitor?.trim() || null,
        zona: integ.zona?.trim() || null,
        secao: integ.secao?.trim() || null,
        telefone: integ.telefone?.trim() || null,
        dataNascimento: integ.dataNascimento?.trim() || null,
      })),
      endereco: endereco.trim() || undefined,
      bairro: bairro.trim() || undefined,
      fotoDocumento: docFilename || undefined,
    };

    setIsSubmitting(true);
    const toastId = toast.loading('Cadastrando chefe e integrantes da família...');

    try {
      const response = await api.post<ChefeFamiliaResponse>('/api/chefes-familia/cadastrar-com-lista', payload);
      toast.success(
        `✨ Família de ${response.data.nome} cadastrada com sucesso com ${integrantes.length} integrantes!`,
        { id: toastId, duration: 5000 }
      );
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar com lista', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar família a partir da lista.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <Crown size={22} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-gray-950 text-base sm:text-lg flex items-center gap-2">
                  Escolha o Chefe de Família
                </h3>
                <p className="text-xs text-gray-600">
                  {eleitores.length} {eleitores.length === 1 ? 'eleitor identificado' : 'eleitores identificados'} na lista. Selecione quem será o Chefe.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Action card & info banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0 mt-0.5">
                  <AlertCircle size={20} className="text-blue-700" />
                </div>
                <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  <span className="font-bold">Como funciona:</span> Clique em uma pessoa para defini-la como{' '}
                  <span className="font-bold text-blue-700">👑 Chefe de Família</span>. Todos os demais serão salvos como seus integrantes. A imagem original será anexada aos documentos do chefe.
                </div>
              </div>

              {docFilename && (
                <button
                  type="button"
                  onClick={() => setShowOriginalDoc(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Ver Foto da Lista</span>
                </button>
              )}
            </div>

            {/* Endereço da Família (Opcional) */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <MapPin size={14} className="text-blue-600" />
                <span>Endereço da Família (Opcional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Logradouro, número, complemento (ex: Rua das Flores, 120)"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Bairro (ex: Centro)"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* List of voters */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-gray-500" />
                  <span>Pessoas Identificadas na Lista ({eleitores.length})</span>
                </h4>
                <span className="text-[11px] text-gray-500">
                  Clique no card para escolher como Chefe
                </span>
              </div>

              <div className="space-y-2">
                {eleitores.map((eleitor, idx) => {
                  const isChefe = selectedIndex === idx;
                  const isEditing = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isEditing && setSelectedIndex(idx)}
                      className={`relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                        isChefe
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50/90 to-indigo-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Radio selection and main info */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          {/* Selection indicator */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors ${
                              isChefe
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'border-2 border-gray-300 bg-white text-transparent'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2 pr-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={eleitor.nome}
                                  onChange={(e) => handleUpdateField(idx, 'nome', e.target.value)}
                                  placeholder="Nome completo"
                                  className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-blue-400 rounded-md focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <input
                                    type="text"
                                    value={eleitor.tituloEleitor || ''}
                                    onChange={(e) => handleUpdateField(idx, 'tituloEleitor', e.target.value)}
                                    placeholder="Título"
                                    className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    value={eleitor.zona || ''}
                                    onChange={(e) => handleUpdateField(idx, 'zona', e.target.value)}
                                    placeholder="Zona"
                                    className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    value={eleitor.secao || ''}
                                    onChange={(e) => handleUpdateField(idx, 'secao', e.target.value)}
                                    placeholder="Seção"
                                    className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    value={eleitor.telefone || ''}
                                    onChange={(e) => handleUpdateField(idx, 'telefone', e.target.value)}
                                    placeholder="Telefone"
                                    className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded-md"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {eleitor.nome || 'Nome não identificado'}
                                  </span>
                                  {isChefe ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                      <Crown size={11} className="text-amber-300" />
                                      CHEFE DE FAMÍLIA
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      Integrante
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                  {eleitor.tituloEleitor && (
                                    <span>
                                      Título: <strong className="text-gray-700">{eleitor.tituloEleitor}</strong>
                                    </span>
                                  )}
                                  {(eleitor.zona || eleitor.secao) && (
                                    <span>
                                      Zona/Seção: <strong className="text-gray-700">{eleitor.zona || '-'} / {eleitor.secao || '-'}</strong>
                                    </span>
                                  )}
                                  {eleitor.dataNascimento && (
                                    <span>
                                      Nasc: <strong className="text-gray-700">{eleitor.dataNascimento}</strong>
                                    </span>
                                  )}
                                  {eleitor.telefone && (
                                    <span>
                                      Tel: <strong className="text-gray-700">{eleitor.telefone}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick card actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIndex(isEditing ? null : idx);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title={isEditing ? 'Concluir edição' : 'Editar dados'}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveEleitor(idx);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remover da lista"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-gray-600 text-center sm:text-left">
              Chefe escolhido:{' '}
              <strong className="text-blue-700">
                {chefeSelecionado?.nome || 'Nenhum'}
              </strong>{' '}
              + {Math.max(0, eleitores.length - 1)} integrantes vinculados.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={isSubmitting || !chefeSelecionado}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Cadastrando Família...</span>
                  </>
                ) : (
                  <>
                    <Crown size={15} className="text-amber-300" />
                    <span>Salvar Chefe e Família</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizador do documento original da lista */}
      {docFilename && (
        <PhotoModal
          isOpen={showOriginalDoc}
          onClose={() => setShowOriginalDoc(false)}
          title="Documento da Lista Digitalizada"
          filename={docFilename}
          subtitle="Lista enviada e interpretada pela Inteligência Artificial"
        />
      )}
    </>
  );
};
