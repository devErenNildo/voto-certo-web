import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ChefeFamiliaResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const ChefesFamilia = () => {
  const navigate = useNavigate();
  const [chefes, setChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [filteredChefes, setFilteredChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: 0, nome: '', cpf: '', tituloEleitor: '', zona: '', secao: '', telefone: '', endereco: '', dataNascimento: ''
  });

  const fetchChefes = async () => {
    try {
      const response = await api.get('/api/chefes-familia');
      setChefes(response.data);
      setFilteredChefes(response.data);
    } catch (error) {
      console.error('Erro ao buscar chefes', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChefes();
  }, []);

  useEffect(() => {
    const results = chefes.filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm)
    );
    setFilteredChefes(results);
  }, [searchTerm, chefes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/api/chefes-familia/${formData.id}`, formData);
      } else {
        await api.post('/api/chefes-familia', formData);
      }
      setIsFormOpen(false);
      resetForm();
      toast.success('Chefe de família salvo com sucesso!');
      fetchChefes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar chefe de família');
    }
  };

  const resetForm = () => setFormData({ id: 0, nome: '', cpf: '', tituloEleitor: '', zona: '', secao: '', telefone: '', endereco: '', dataNascimento: '' });

  const handleEdit = (chefe: ChefeFamiliaResponse) => {
    setFormData({ 
      ...chefe,
      telefone: chefe.telefone || '',
      dataNascimento: chefe.dataNascimento || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir? Isso removerá os eleitores associados.');
    if (confirmed) {
      try {
        await api.delete(`/api/chefes-familia/${id}`);
        toast.success('Chefe de família excluído.');
        fetchChefes();
      } catch (error) {
        toast.error('Erro ao excluir.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Chefes de Família</h1>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Novo Chefe</span>
        </Button>
      </div>

      {!isFormOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {isFormOpen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{formData.id ? 'Editar Chefe' : 'Novo Chefe'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome Completo" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="md:col-span-2" />
              <Input label="CPF" required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
              <Input label="Telefone" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
              <Input type="date" label="Data de Nascimento" value={formData.dataNascimento} onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })} />
              <Input label="Título de Eleitor" required value={formData.tituloEleitor} onChange={e => setFormData({ ...formData, tituloEleitor: e.target.value })} className="md:col-span-2" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Zona" required value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
                <Input label="Seção" required value={formData.secao} onChange={e => setFormData({ ...formData, secao: e.target.value })} />
              </div>
              <Input label="Endereço Completo" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} className="md:col-span-2" />

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
          {filteredChefes.map(chefe => (
            <Card key={chefe.id} className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50" onClick={() => navigate(`/chefes-familia/${chefe.id}`)}>
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{chefe.nome}</h3>
                    <div className="flex gap-1 bg-gray-100 rounded-full px-2 py-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(chefe); }} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(chefe.id); }} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-3">
                    <div><span className="text-gray-400 block text-xs">CPF</span>{chefe.cpf}</div>
                    <div><span className="text-gray-400 block text-xs">Telefone</span>{chefe.telefone || '-'}</div>
                    {chefe.dataNascimento && (
                      <div><span className="text-gray-400 block text-xs">Nascimento</span>{new Date(chefe.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    )}
                    <div className={chefe.dataNascimento ? "" : "col-span-2"}><span className="text-gray-400 block text-xs">Título</span>{chefe.tituloEleitor}</div>
                    <div><span className="text-gray-400 block text-xs">Local</span>Z: {chefe.zona} | S: {chefe.secao}</div>
                    <div className="col-span-2"><span className="text-gray-400 block text-xs">Endereço</span>{chefe.endereco || '-'}</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                  <span>Liderança: <strong>{chefe.liderancaNome}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredChefes.length === 0 && !isFormOpen && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              Nenhum chefe de família encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
