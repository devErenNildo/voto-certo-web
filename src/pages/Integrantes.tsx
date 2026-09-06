import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { IntegranteResponse, ChefeFamiliaResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Edit2, Trash2, X, Search, Users, UserCheck, Home, ExternalLink } from 'lucide-react';
import { maskDate, parseDateToApi, parseDateFromApi, maskPhone } from '../utils/masks';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const Integrantes = () => {
  const navigate = useNavigate();
  const [integrantes, setIntegrantes] = useState<IntegranteResponse[]>([]);
  const [chefes, setChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    nome: '',
    tituloEleitor: '',
    zona: '',
    secao: '',
    chefeFamiliaId: 0,
    telefone: '',
    dataNascimento: ''
  });

  const fetchData = async () => {
    try {
      const [intRes, chefesRes] = await Promise.all([
        api.get('/api/integrantes'),
        api.get('/api/chefes-familia')
      ]);
      setIntegrantes(intRes.data);
      setChefes(chefesRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados', error);
      toast.error('Erro ao carregar lista de eleitores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalChefes = chefes.length;
  const totalIntegrantes = integrantes.length;
  const totalEleitores = totalChefes + totalIntegrantes;

  // Agrupamento por Chefe de Família
  const groupedData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return chefes
      .map((chefe) => {
        const familyIntegrantes = integrantes.filter((i) => i.chefeFamiliaId === chefe.id);

        const chefeMatches =
          !term ||
          chefe.nome.toLowerCase().includes(term) ||
          (chefe.cpf && chefe.cpf.includes(term)) ||
          (chefe.tituloEleitor && chefe.tituloEleitor.toLowerCase().includes(term)) ||
          (chefe.liderancaNome && chefe.liderancaNome.toLowerCase().includes(term)) ||
          (chefe.endereco && chefe.endereco.toLowerCase().includes(term));

        const matchingIntegrantes = term
          ? familyIntegrantes.filter(
              (i) =>
                i.nome.toLowerCase().includes(term) ||
                (i.tituloEleitor && i.tituloEleitor.toLowerCase().includes(term)) ||
                (i.telefone && i.telefone.includes(term))
            )
          : familyIntegrantes;

        const isVisible = chefeMatches || matchingIntegrantes.length > 0;

        return {
          chefe,
          integrantes: term && !chefeMatches ? matchingIntegrantes : familyIntegrantes,
          allFamilyIntegrantesCount: familyIntegrantes.length,
          isVisible
        };
      })
      .filter((group) => group.isVisible);
  }, [chefes, integrantes, searchTerm]);

  // Integrantes que eventualmente não tenham chefe cadastrado
  const orphanIntegrantes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const orphans = integrantes.filter((i) => !chefes.some((c) => c.id === i.chefeFamiliaId));
    if (!term) return orphans;
    return orphans.filter(
      (i) =>
        i.nome.toLowerCase().includes(term) ||
        (i.tituloEleitor && i.tituloEleitor.toLowerCase().includes(term)) ||
        (i.telefone && i.telefone.includes(term))
    );
  }, [chefes, integrantes, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error('O nome do eleitor é obrigatório.');
      return;
    }

    if (!formData.chefeFamiliaId) {
      toast.error('Selecione um Chefe de Família.');
      return;
    }

    try {
      const { id: integranteId, ...requestBody } = formData;
      const dateApi = parseDateToApi(formData.dataNascimento);
      const payload = {
        ...requestBody,
        nome: formData.nome.trim(),
        tituloEleitor: formData.tituloEleitor.trim() || null,
        zona: formData.zona.trim() || null,
        secao: formData.secao.trim() || null,
        telefone: formData.telefone.trim() || null,
        dataNascimento: dateApi && dateApi.length === 10 ? dateApi : null
      };

      if (formData.id) {
        await api.put(`/api/integrantes/${formData.id}`, payload);
      } else {
        await api.post('/api/integrantes', payload);
      }
      setIsFormOpen(false);
      resetForm();
      toast.success('Eleitor salvo com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar eleitor');
    }
  };

  const resetForm = (defaultChefeId?: number) =>
    setFormData({
      id: 0,
      nome: '',
      tituloEleitor: '',
      zona: '',
      secao: '',
      chefeFamiliaId: defaultChefeId || (chefes.length > 0 ? chefes[0].id : 0),
      telefone: '',
      dataNascimento: ''
    });

  const handleOpenAddModal = (defaultChefeId?: number) => {
    resetForm(defaultChefeId);
    setIsFormOpen(true);
  };

  const handleEdit = (integrante: IntegranteResponse) => {
    setFormData({
      id: integrante.id,
      nome: integrante.nome || '',
      tituloEleitor: integrante.tituloEleitor || '',
      zona: integrante.zona || '',
      secao: integrante.secao || '',
      chefeFamiliaId: integrante.chefeFamiliaId,
      telefone: integrante.telefone || '',
      dataNascimento: parseDateFromApi(integrante.dataNascimento || '')
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir este eleitor?');
    if (confirmed) {
      try {
        await api.delete(`/api/integrantes/${id}`);
        toast.success('Eleitor excluído com sucesso.');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir eleitor.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eleitores (Votos)</h1>
          <p className="text-sm text-gray-500">
            Listagem agrupada por famílias, onde cada Chefe de Família também é contabilizado como eleitor.
          </p>
        </div>
        <Button onClick={() => handleOpenAddModal()}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Novo Eleitor</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Total de Eleitores (Votos)</p>
              <p className="text-3xl font-extrabold text-purple-950 mt-1">{totalEleitores}</p>
              <p className="text-xs text-purple-700/80 mt-1">
                {totalChefes} chefes + {totalIntegrantes} dependentes
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <Users size={26} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Chefes de Família</p>
              <p className="text-3xl font-extrabold text-emerald-950 mt-1">{totalChefes}</p>
              <p className="text-xs text-emerald-700/80 mt-1">1º eleitor de cada família</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <UserCheck size={26} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Integrantes Dependentes</p>
              <p className="text-3xl font-extrabold text-blue-950 mt-1">{totalIntegrantes}</p>
              <p className="text-xs text-blue-700/80 mt-1">Familiares vinculados</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Home size={26} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      {!isFormOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            className="pl-10"
            placeholder="Buscar por nome do eleitor, chefe, CPF, título, liderança..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Modal / Form */}
      {isFormOpen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">{formData.id ? 'Editar Eleitor' : 'Novo Eleitor'}</h2>
                <p className="text-xs text-gray-500">Apenas o nome e a família são obrigatórios. Os demais dados são opcionais.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Chefe de Família *</label>
                <select
                  className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.chefeFamiliaId}
                  onChange={(e) => setFormData({ ...formData, chefeFamiliaId: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Selecione um chefe de família</option>
                  {chefes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (Liderança: {c.liderancaNome})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nome Completo *"
                required
                placeholder="Ex: Carlos de Oliveira"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="md:col-span-2"
              />
              <Input
                label="Título de Eleitor (opcional)"
                placeholder="Número do título"
                value={formData.tituloEleitor}
                onChange={(e) => setFormData({ ...formData, tituloEleitor: e.target.value })}
                className="md:col-span-2"
              />

              <Input
                label="Zona (opcional)"
                placeholder="Zona"
                value={formData.zona}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
              />
              <Input
                label="Seção (opcional)"
                placeholder="Seção"
                value={formData.secao}
                onChange={(e) => setFormData({ ...formData, secao: e.target.value })}
              />

              <Input
                label="Telefone (opcional)"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                label="Data de Nascimento (opcional)"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: maskDate(e.target.value) })}
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Eleitor</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Family Groups */}
          {groupedData.map(({ chefe, integrantes: familyIntegrantes, allFamilyIntegrantesCount }) => (
            <div
              key={chefe.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Family Header */}
              <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50/50 px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Home size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">Família de {chefe.nome}</h2>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {1 + allFamilyIntegrantesCount} {1 + allFamilyIntegrantesCount === 1 ? 'voto' : 'votos'} (1 chefe +{' '}
                        {allFamilyIntegrantesCount} {allFamilyIntegrantesCount === 1 ? 'dependente' : 'dependentes'})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Liderança: <strong>{chefe.liderancaNome}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    className="text-xs h-9 px-3 text-gray-600 hover:text-primary hover:bg-primary/5"
                    onClick={() => navigate(`/chefes-familia/${chefe.id}`)}
                  >
                    <ExternalLink size={14} className="mr-1.5" />
                    Ver Detalhes
                  </Button>
                  <Button
                    className="text-xs h-9 px-3"
                    onClick={() => handleOpenAddModal(chefe.id)}
                  >
                    <Plus size={15} className="mr-1" />
                    Adicionar Eleitor
                  </Button>
                </div>
              </div>

              {/* Family Members Body */}
              <div className="p-5 space-y-4">
                {/* 1º Item: Chefe de Família como 1º Eleitor */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-600" />
                    <span>1º Eleitor da Família (Chefe)</span>
                  </div>
                  <div className="bg-emerald-50/40 border-2 border-emerald-500/40 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900">{chefe.nome}</span>
                        <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Chefe de Família
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {chefe.endereco ? `Endereço: ${chefe.endereco}` : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-700 bg-white/70 p-3 rounded-lg border border-emerald-200/50">
                      <div>
                        <span className="text-gray-400 block text-xs font-medium">CPF</span>
                        <span className="font-medium">{chefe.cpf || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-xs font-medium">Título de Eleitor</span>
                        <span className="font-medium">{chefe.tituloEleitor || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-xs font-medium">Zona / Seção</span>
                        <span className="font-medium">
                          Z: {chefe.zona || '-'} | S: {chefe.secao || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-xs font-medium">Telefone</span>
                        <span className="font-medium">{chefe.telefone || 'Não informado'}</span>
                      </div>
                      {chefe.dataNascimento && (
                        <div className="col-span-2 sm:col-span-4 text-xs text-gray-500 pt-1">
                          Data de Nascimento: {new Date(chefe.dataNascimento).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-list: Outros Eleitores da Família (Integrantes) */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" />
                    <span>Demais Eleitores da Família ({familyIntegrantes.length})</span>
                  </div>

                  {familyIntegrantes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-3 border-l-0 sm:border-l-2 sm:border-dashed sm:border-gray-200">
                      {familyIntegrantes.map((integrante) => (
                        <Card
                          key={integrante.id}
                          className="bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all border-l-4 border-l-blue-500"
                        >
                          <CardContent className="p-3.5 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <h3 className="font-semibold text-base text-gray-900">{integrante.nome}</h3>
                                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    Eleitor / Familiar
                                  </span>
                                </div>
                                <div className="flex gap-1 bg-gray-100 rounded-full px-1.5 py-0.5">
                                  <button
                                    onClick={() => handleEdit(integrante)}
                                    className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors"
                                    title="Editar Eleitor"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(integrante.id)}
                                    className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors"
                                    title="Excluir Eleitor"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg">
                                <div className="col-span-2">
                                  <span className="text-gray-400 block text-[10px] uppercase font-medium">Título</span>
                                  <span className="font-medium text-gray-800">{integrante.tituloEleitor || 'Não informado'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[10px] uppercase font-medium">Zona</span>
                                  <span>{integrante.zona || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[10px] uppercase font-medium">Seção</span>
                                  <span>{integrante.secao || '-'}</span>
                                </div>
                                {integrante.telefone && (
                                  <div className="col-span-2">
                                    <span className="text-gray-400 block text-[10px] uppercase font-medium">Telefone</span>
                                    <span>{integrante.telefone}</span>
                                  </div>
                                )}
                                {integrante.dataNascimento && (
                                  <div className="col-span-2">
                                    <span className="text-gray-400 block text-[10px] uppercase font-medium">Nascimento</span>
                                    <span>{new Date(integrante.dataNascimento).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-0 sm:pl-3 border-l-0 sm:border-l-2 sm:border-dashed sm:border-gray-200">
                      <div className="py-4 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                        <span>Nenhum outro eleitor cadastrado nesta família ainda.</span>
                        <Button
                          variant="ghost"
                          className="text-xs text-primary hover:bg-primary/10 h-8 px-2.5"
                          onClick={() => handleOpenAddModal(chefe.id)}
                        >
                          <Plus size={14} className="mr-1" />
                          Adicionar primeiro eleitor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Orphan Integrantes (se houver algum eleitor sem chefe cadastrado) */}
          {orphanIntegrantes.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="text-amber-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Eleitores sem Chefe Vinculado ({orphanIntegrantes.length})</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {orphanIntegrantes.map((integrante) => (
                  <Card key={integrante.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="p-3.5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold text-base text-gray-900">{integrante.nome}</h3>
                          <div className="flex gap-1 bg-gray-100 rounded-full px-1.5 py-0.5">
                            <button
                              onClick={() => handleEdit(integrante)}
                              className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(integrante.id)}
                              className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg">
                          <div className="col-span-2">
                            <span className="text-gray-400 block text-[10px] uppercase font-medium">Título</span>
                            <span className="font-medium text-gray-800">{integrante.tituloEleitor || 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-medium">Zona</span>
                            <span>{integrante.zona || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-medium">Seção</span>
                            <span>{integrante.secao || '-'}</span>
                          </div>
                          {integrante.telefone && (
                            <div className="col-span-2">
                              <span className="text-gray-400 block text-[10px] uppercase font-medium">Telefone</span>
                              <span>{integrante.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {groupedData.length === 0 && orphanIntegrantes.length === 0 && !isFormOpen && (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-lg font-semibold text-gray-700">Nenhum eleitor ou família encontrada.</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? 'Tente alterar os termos da busca.' : 'Cadastre um novo eleitor ou chefe de família para começar.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
