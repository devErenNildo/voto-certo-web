import { useState, useEffect } from 'react';
import api from '../services/api';
import type { IntegranteResponse, ChefeFamiliaResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const Integrantes = () => {
  const [integrantes, setIntegrantes] = useState<IntegranteResponse[]>([]);
  const [chefes, setChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [filteredIntegrantes, setFilteredIntegrantes] = useState<IntegranteResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: 0, nome: '', tituloEleitor: '', zona: '', secao: '', chefeFamiliaId: 0, telefone: '', dataNascimento: ''
  });

  const fetchData = async () => {
    try {
      const [intRes, chefesRes] = await Promise.all([
        api.get('/api/integrantes'),
        api.get('/api/chefes-familia')
      ]);
      setIntegrantes(intRes.data);
      setFilteredIntegrantes(intRes.data);
      setChefes(chefesRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const results = integrantes.filter(i =>
      i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.chefeFamiliaNome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIntegrantes(results);
  }, [searchTerm, integrantes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chefeFamiliaId) {
      toast.error("Selecione um Chefe de Família");
      return;
    }

    try {
      const { id: integranteId, ...requestBody } = formData;
      if (formData.id) {
        await api.put(`/api/integrantes/${formData.id}`, requestBody);
      } else {
        await api.post('/api/integrantes', requestBody);
      }
      setIsFormOpen(false);
      resetForm();
      toast.success('Eleitor salvo com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar eleitor');
    }
  };

  const resetForm = () => setFormData({ id: 0, nome: '', tituloEleitor: '', zona: '', secao: '', chefeFamiliaId: chefes.length > 0 ? chefes[0].id : 0, telefone: '', dataNascimento: '' });

  const handleEdit = (integrante: IntegranteResponse) => {
    setFormData({ 
      ...integrante,
      telefone: integrante.telefone || '',
      dataNascimento: integrante.dataNascimento || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir?');
    if (confirmed) {
      try {
        await api.delete(`/api/integrantes/${id}`);
        toast.success('Eleitor excluído.');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Eleitores (Votos)</h1>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Novo Eleitor</span>
        </Button>
      </div>

      {!isFormOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou chefe de família..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {isFormOpen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{formData.id ? 'Editar Eleitor' : 'Novo Eleitor'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Chefe de Família</label>
                <select
                  className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.chefeFamiliaId}
                  onChange={e => setFormData({ ...formData, chefeFamiliaId: Number(e.target.value) })}
                  required
                >
                  <option value={0} disabled>Selecione um chefe de família</option>
                  {chefes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} (Liderança: {c.liderancaNome})</option>
                  ))}
                </select>
              </div>

              <Input label="Nome Completo" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="md:col-span-2" />
              <Input label="Título de Eleitor" required value={formData.tituloEleitor} onChange={e => setFormData({ ...formData, tituloEleitor: e.target.value })} className="md:col-span-2" />

              <Input label="Zona" required value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
              <Input label="Seção" required value={formData.secao} onChange={e => setFormData({ ...formData, secao: e.target.value })} />
              
              <Input label="Telefone" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
              <Input type="date" label="Data de Nascimento" value={formData.dataNascimento} onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })} />

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredIntegrantes.map(integrante => (
            <Card key={integrante.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col h-full justify-between border-l-4 border-l-primary">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{integrante.nome}</h3>
                    <div className="flex gap-1 bg-gray-100 rounded-full px-2 py-1">
                      <button onClick={() => handleEdit(integrante)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(integrante.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-3">
                    <div className="col-span-2"><span className="text-gray-400 block text-xs">Título</span>{integrante.tituloEleitor}</div>
                    <div><span className="text-gray-400 block text-xs">Zona</span>{integrante.zona}</div>
                    <div><span className="text-gray-400 block text-xs">Seção</span>{integrante.secao}</div>
                    {integrante.telefone && (
                      <div className="col-span-2"><span className="text-gray-400 block text-xs">Telefone</span>{integrante.telefone}</div>
                    )}
                    {integrante.dataNascimento && (
                      <div className="col-span-2"><span className="text-gray-400 block text-xs">Nascimento</span>{new Date(integrante.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                  <span>Chefe: <strong>{integrante.chefeFamiliaNome}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredIntegrantes.length === 0 && !isFormOpen && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              Nenhum eleitor encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
