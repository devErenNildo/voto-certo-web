import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../services/api';
import type { LiderancaResponse, ChefeFamiliaResponse, IntegranteResponse } from '../types';
import { SecureImage } from './SecureImage';
import { 
  Users, 
  Home, 
  Phone, 
  MapPin, 
  Calendar, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { maskPhone } from '../utils/masks';

interface DetalhesLiderancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lideranca: LiderancaResponse | null;
}

export const DetalhesLiderancaModal: React.FC<DetalhesLiderancaModalProps> = ({
  isOpen,
  onClose,
  lideranca,
}) => {
  const [chefes, setChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [isLoadingChefes, setIsLoadingChefes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para os integrantes expandidos por chefe
  const [expandedChefeIds, setExpandedChefeIds] = useState<Record<number, boolean>>({});
  const [integrantesPorChefe, setIntegrantesPorChefe] = useState<Record<number, IntegranteResponse[]>>({});
  const [loadingIntegrantes, setLoadingIntegrantes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && lideranca) {
      fetchChefesDaLideranca(lideranca.id);
      setSearchTerm('');
      setExpandedChefeIds({});
      setIntegrantesPorChefe({});
    }
  }, [isOpen, lideranca?.id]);

  const fetchChefesDaLideranca = async (liderancaId: number) => {
    setIsLoadingChefes(true);
    try {
      const response = await api.get<ChefeFamiliaResponse[] | { content: ChefeFamiliaResponse[] }>(
        `/api/chefes-familia?liderancaId=${liderancaId}`
      );
      if (Array.isArray(response.data)) {
        setChefes(response.data);
      } else if (response.data && Array.isArray((response.data as any).content)) {
        setChefes((response.data as any).content);
      } else {
        setChefes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar chefes da liderança', error);
      setChefes([]);
    } finally {
      setIsLoadingChefes(false);
    }
  };

  const toggleExpandChefe = async (chefeId: number) => {
    const nextState = !expandedChefeIds[chefeId];
    setExpandedChefeIds((prev) => ({ ...prev, [chefeId]: nextState }));

    // Se expandiu e ainda não buscou os integrantes, busca agora
    if (nextState && !integrantesPorChefe[chefeId]) {
      setLoadingIntegrantes((prev) => ({ ...prev, [chefeId]: true }));
      try {
        const response = await api.get<IntegranteResponse[] | { content: IntegranteResponse[] }>(
          `/api/integrantes/por-chefe/${chefeId}`
        );
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.content || [];
        setIntegrantesPorChefe((prev) => ({ ...prev, [chefeId]: data }));
      } catch (err) {
        console.error('Erro ao buscar integrantes do chefe', err);
        setIntegrantesPorChefe((prev) => ({ ...prev, [chefeId]: [] }));
      } finally {
        setLoadingIntegrantes((prev) => ({ ...prev, [chefeId]: false }));
      }
    }
  };

  if (!lideranca) return null;

  const totalVotosLideranca = lideranca.totalVotos ?? (lideranca.totalChefes + lideranca.totalIntegrantes);

  // Filtra os chefes pelo termo digitado
  const filteredChefes = chefes.filter((chefe) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      chefe.nome?.toLowerCase().includes(term) ||
      chefe.cpf?.includes(term) ||
      chefe.tituloEleitor?.includes(term) ||
      chefe.bairro?.toLowerCase().includes(term) ||
      chefe.endereco?.toLowerCase().includes(term) ||
      chefe.zona?.includes(term) ||
      chefe.secao?.includes(term)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lideranca.name}
      subtitle={`Liderança Responsável: @${lideranca.username}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Painel com Informações e Métricas da Liderança */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-purple-50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {lideranca.name?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{lideranca.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    Liderança
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Usuário: <span className="font-medium text-gray-700">@{lideranca.username}</span></p>
              </div>
            </div>

            {/* Ações / Contato Rápido */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {lideranca.telefone && (
                <a
                  href={`tel:${lideranca.telefone.replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  <Phone size={13} className="text-emerald-600" />
                  <span>{maskPhone(lideranca.telefone)}</span>
                </a>
              )}
              {lideranca.bairro && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-600 font-medium">
                  <MapPin size={13} className="text-blue-500" />
                  <span>Bairro {lideranca.bairro}</span>
                </div>
              )}
              {lideranca.dataNascimento && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-600 font-medium">
                  <Calendar size={13} className="text-purple-500" />
                  <span>Nasc: {new Date(lideranca.dataNascimento).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cards de Totais da Liderança */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="bg-white/90 p-3 rounded-xl border border-emerald-100/80 shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium mb-1">
                <Home size={14} className="text-emerald-500" />
                <span>Chefes de Família</span>
              </div>
              <div className="text-2xl font-black text-emerald-900">{lideranca.totalChefes}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Famílias cadastradas</p>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-purple-100/80 shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs text-purple-700 font-medium mb-1">
                <Users size={14} className="text-purple-500" />
                <span>Integrantes</span>
              </div>
              <div className="text-2xl font-black text-purple-900">{lideranca.totalIntegrantes}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Membros familiares</p>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-blue-100/80 shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700 font-medium mb-1">
                <UserCheck size={14} className="text-blue-500" />
                <span>Total de Votos</span>
              </div>
              <div className="text-2xl font-black text-blue-900">{totalVotosLideranca}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Chefes + Integrantes</p>
            </div>
          </div>
        </div>

        {/* Seção de Famílias / Chefes Vinculados */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Chefes de Família da Liderança</span>
                <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                  {filteredChefes.length} {filteredChefes.length === 1 ? 'família' : 'famílias'}
                </span>
              </h4>
              <p className="text-xs text-gray-500">Exibindo apenas os eleitores e famílias vinculados a {lideranca.name}</p>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Buscar chefe, bairro, zona..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Listagem */}
          {isLoadingChefes ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent mb-2"></div>
              <p className="text-xs">Carregando famílias da liderança...</p>
            </div>
          ) : filteredChefes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <AlertCircle size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {searchTerm ? 'Nenhum chefe encontrado para esta busca.' : 'Esta liderança ainda não possui chefes de família cadastrados.'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? 'Tente buscar com outro termo.' : 'Cadastre uma nova família atribuindo a esta liderança.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredChefes.map((chefe) => {
                const isExpanded = !!expandedChefeIds[chefe.id];
                const integrantes = integrantesPorChefe[chefe.id] || [];
                const isLoadingInt = !!loadingIntegrantes[chefe.id];
                const totalEleitoresFamilia = chefe.totalEleitores ?? (1 + (chefe.totalIntegrantes || 0));

                return (
                  <div
                    key={chefe.id}
                    className="border border-gray-200 rounded-xl bg-white hover:border-blue-200 transition-all shadow-2xs overflow-hidden"
                  >
                    {/* Linha Principal do Chefe */}
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Foto / Avatar do Chefe */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center">
                          {chefe.fotoPerfil ? (
                            <SecureImage
                              filename={chefe.fotoPerfil}
                              alt={chefe.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon size={18} className="text-gray-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-sm text-gray-900 leading-snug">{chefe.nome}</h5>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                              Chefe
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            {chefe.telefone && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Phone size={12} className="text-gray-400" />
                                {maskPhone(chefe.telefone)}
                              </span>
                            )}
                            {(chefe.bairro || chefe.endereco) && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <MapPin size={12} className="text-gray-400" />
                                {chefe.bairro ? `Bairro ${chefe.bairro}` : chefe.endereco}
                              </span>
                            )}
                            {(chefe.zona || chefe.secao) && (
                              <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                                Zona {chefe.zona || '-'} / Seção {chefe.secao || '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contador de Eleitores da Família e Botão de Expandir */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {/* Destaque do Total de Eleitores */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 shadow-2xs">
                          <Users size={14} className="text-emerald-600" />
                          <span className="text-xs font-bold">
                            {totalEleitoresFamilia} {totalEleitoresFamilia === 1 ? 'Eleitor' : 'Eleitores'}
                          </span>
                          <span className="text-[10px] text-emerald-700/80 hidden sm:inline">
                            (1 chefe + {chefe.totalIntegrantes || 0})
                          </span>
                        </div>

                        {/* Botão de Expandir Integrantes */}
                        <button
                          type="button"
                          onClick={() => toggleExpandChefe(chefe.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver membros desta família"
                        >
                          <span>Integrantes ({chefe.totalIntegrantes || 0})</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Acordeão de Integrantes da Família */}
                    {isExpanded && (
                      <div className="bg-gray-50/80 border-t border-gray-100 p-3 sm:p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Users size={13} className="text-blue-500" />
                            <span>Integrantes da Família ({integrantes.length})</span>
                          </p>
                          <span className="text-[11px] text-gray-400">
                            Total da casa: 1 chefe + {integrantes.length} integrantes = {1 + integrantes.length} votos
                          </span>
                        </div>

                        {isLoadingInt ? (
                          <div className="flex items-center justify-center py-4 text-xs text-gray-400">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2"></div>
                            Buscando integrantes da família...
                          </div>
                        ) : integrantes.length === 0 ? (
                          <p className="text-xs text-gray-500 italic py-1">
                            Nenhum integrante adicional cadastrado nesta família (apenas o chefe é eleitor).
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {integrantes.map((int) => (
                              <div
                                key={int.id}
                                className="bg-white p-2.5 rounded-lg border border-gray-200/80 text-xs shadow-2xs flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {int.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-semibold text-gray-800 truncate">{int.nome}</p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                      {int.tituloEleitor ? `Título: ${int.tituloEleitor}` : 'Sem título informado'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold">
                                    Z: {int.zona || '-'} / S: {int.secao || '-'}
                                  </span>
                                  {int.telefone && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">{int.telefone}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Cadastrada em: {new Date(lideranca.createdAt).toLocaleDateString('pt-BR')}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
