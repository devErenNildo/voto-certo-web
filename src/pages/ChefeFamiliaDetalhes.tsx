import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ChefeFamiliaResponse, IntegranteResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const ChefeFamiliaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chefe, setChefe] = useState<ChefeFamiliaResponse | null>(null);
  const [eleitores, setEleitores] = useState<IntegranteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: 0, nome: '', tituloEleitor: '', zona: '', secao: '', chefeFamiliaId: Number(id), telefone: '', dataNascimento: ''
  });

  const fetchData = async () => {
    try {
      // Buscar todos os chefes e eleitores para filtrar (caso não haja endpoint específico por ID)
      const [chefesRes, intRes] = await Promise.all([
        api.get('/api/chefes-familia'),
        api.get('/api/integrantes')
      ]);
      
      const chefeEncontrado = chefesRes.data.find((c: ChefeFamiliaResponse) => c.id === Number(id));
      if (!chefeEncontrado) {
        toast.error('Chefe de família não encontrado.');
        navigate('/chefes-familia');
        return;
      }
      
      setChefe(chefeEncontrado);
      setEleitores(intRes.data.filter((i: IntegranteResponse) => i.chefeFamiliaId === Number(id)));
    } catch (error) {
      console.error('Erro ao buscar dados', error);
      toast.error('Erro ao carregar detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const resetForm = () => setFormData({ id: 0, nome: '', tituloEleitor: '', zona: '', secao: '', chefeFamiliaId: Number(id), telefone: '', dataNascimento: '' });

  const handleEdit = (eleitor: IntegranteResponse) => {
    setFormData({ ...eleitor, chefeFamiliaId: Number(id) });
    setIsFormOpen(true);
  };

  const handleDelete = async (eleitorId: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir este eleitor?');
    if (confirmed) {
      try {
        await api.delete(`/api/integrantes/${eleitorId}`);
        toast.success('Eleitor excluído com sucesso.');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!chefe) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chefes-familia')} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Família de {chefe.nome}</h1>
      </div>

      <Card className="bg-white border-primary/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dados do Chefe de Família</h2>
              <p className="text-sm text-gray-500">Liderança Responsável: {chefe.liderancaNome}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div><span className="block text-gray-500 text-xs uppercase font-medium">CPF</span>{chefe.cpf || 'Não informado'}</div>
            <div><span className="block text-gray-500 text-xs uppercase font-medium">Telefone</span>{chefe.telefone}</div>
            <div><span className="block text-gray-500 text-xs uppercase font-medium">Endereço</span>{chefe.endereco}</div>
            <div><span className="block text-gray-500 text-xs uppercase font-medium">Título / Zona / Seção</span>{chefe.tituloEleitor} / {chefe.zona} / {chefe.secao}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-gray-800">Eleitores da Família ({eleitores.length})</h2>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Adicionar Eleitor</span>
        </Button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eleitores.map(eleitor => (
          <Card key={eleitor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col h-full justify-between border-l-4 border-l-blue-500">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{eleitor.nome}</h3>
                  <div className="flex gap-1 bg-gray-100 rounded-full px-2 py-1">
                    <button onClick={() => handleEdit(eleitor)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(eleitor.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-3">
                    <div className="col-span-2"><span className="text-gray-400 block text-xs">Título</span>{eleitor.tituloEleitor}</div>
                    <div><span className="text-gray-400 block text-xs">Zona</span>{eleitor.zona}</div>
                    <div><span className="text-gray-400 block text-xs">Seção</span>{eleitor.secao}</div>
                    {eleitor.telefone && (
                      <div className="col-span-2"><span className="text-gray-400 block text-xs">Telefone</span>{eleitor.telefone}</div>
                    )}
                    {eleitor.dataNascimento && (
                      <div className="col-span-2"><span className="text-gray-400 block text-xs">Nascimento</span>{new Date(eleitor.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {eleitores.length === 0 && !isFormOpen && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Nenhum eleitor cadastrado nesta família.
          </div>
        )}
      </div>
    </div>
  );
};
