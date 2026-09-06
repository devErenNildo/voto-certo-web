import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ChefeFamiliaResponse, IntegranteResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Plus, Edit2, Trash2, X, Users, UserCheck } from 'lucide-react';
import { maskDate, parseDateToApi, parseDateFromApi, maskPhone } from '../utils/masks';
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
    if (!formData.nome.trim()) {
      toast.error('O nome do eleitor é obrigatório.');
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
        dataNascimento: (dateApi && dateApi.length === 10) ? dateApi : null,
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

  const resetForm = () => setFormData({ id: 0, nome: '', tituloEleitor: '', zona: '', secao: '', chefeFamiliaId: Number(id), telefone: '', dataNascimento: '' });

  const handleEdit = (eleitor: IntegranteResponse) => {
    setFormData({ 
      id: eleitor.id,
      nome: eleitor.nome || '',
      tituloEleitor: eleitor.tituloEleitor || '',
      zona: eleitor.zona || '',
      secao: eleitor.secao || '',
      telefone: eleitor.telefone || '',
      dataNascimento: parseDateFromApi(eleitor.dataNascimento || ''),
      chefeFamiliaId: Number(id) 
    });
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Família de {chefe.nome}</h1>
          <p className="text-sm text-gray-500">Total de votos nesta família: <strong>{eleitores.length + 1}</strong> (Chefe + {eleitores.length} {eleitores.length === 1 ? 'eleitor' : 'eleitores'})</p>
        </div>
      </div>

      <Card className="bg-white border-primary/30 shadow-sm border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{chefe.nome}</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Chefe de Família (1º Voto)
                  </span>
                </div>
                <p className="text-sm text-gray-500">Liderança Responsável: {chefe.liderancaNome}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm bg-gray-50/70 p-4 rounded-lg">
            <div><span className="block text-gray-500 text-xs uppercase font-medium">CPF</span>{chefe.cpf || 'Não informado'}</div>
            <div><span className="block text-gray-500 text-xs uppercase font-medium">Telefone</span>{chefe.telefone || 'Não informado'}</div>
            <div><span className="block text-gray-500 text-xs uppercase font-medium">Endereço</span>{chefe.endereco || 'Não informado'}</div>
            <div>
              <span className="block text-gray-500 text-xs uppercase font-medium">Título / Zona / Seção</span>
              {chefe.tituloEleitor || '-'} / {chefe.zona || '-'} / {chefe.secao || '-'}
            </div>
            {chefe.dataNascimento && (
              <div>
                <span className="block text-gray-500 text-xs uppercase font-medium">Nascimento</span>
                {new Date(chefe.dataNascimento).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Outros Eleitores da Família ({eleitores.length})</h2>
          <p className="text-xs text-gray-500">Dependentes e familiares vinculados a este chefe de família</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Adicionar Eleitor</span>
        </Button>
      </div>

      {isFormOpen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">{formData.id ? 'Editar Eleitor' : 'Novo Eleitor da Família'}</h2>
                <p className="text-xs text-gray-500">Apenas o nome é obrigatório. Todos os demais dados são opcionais.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Nome Completo *" 
                required 
                placeholder="Ex: Maria da Silva" 
                value={formData.nome} 
                onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                className="md:col-span-2" 
              />
              
              <Input 
                label="Título de Eleitor (opcional)" 
                placeholder="Número do título" 
                value={formData.tituloEleitor} 
                onChange={e => setFormData({ ...formData, tituloEleitor: e.target.value })} 
                className="md:col-span-2" 
              />
              
              <Input 
                label="Zona (opcional)" 
                placeholder="Zona eleitoral" 
                value={formData.zona} 
                onChange={e => setFormData({ ...formData, zona: e.target.value })} 
              />
              <Input 
                label="Seção (opcional)" 
                placeholder="Seção eleitoral" 
                value={formData.secao} 
                onChange={e => setFormData({ ...formData, secao: e.target.value })} 
              />
              
              <Input 
                label="Telefone (opcional)" 
                inputMode="numeric" 
                placeholder="(00) 00000-0000" 
                value={formData.telefone} 
                onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })} 
              />
              <Input 
                type="text" 
                inputMode="numeric" 
                placeholder="dd/mm/aaaa" 
                label="Data de Nascimento (opcional)" 
                value={formData.dataNascimento} 
                onChange={e => setFormData({ ...formData, dataNascimento: maskDate(e.target.value) })} 
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Eleitor</Button>
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
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{eleitor.nome}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Eleitor da Família
                    </span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 rounded-full px-2 py-1">
                    <button onClick={() => handleEdit(eleitor)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(eleitor.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-3">
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-xs">Título</span>
                    {eleitor.tituloEleitor || 'Não informado'}
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Zona</span>
                    {eleitor.zona || '-'}
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Seção</span>
                    {eleitor.secao || '-'}
                  </div>
                  {eleitor.telefone && (
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-xs">Telefone</span>
                      {eleitor.telefone}
                    </div>
                  )}
                  {eleitor.dataNascimento && (
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-xs">Nascimento</span>
                      {new Date(eleitor.dataNascimento).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {eleitores.length === 0 && !isFormOpen && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="font-medium">Nenhum outro eleitor cadastrado nesta família.</p>
            <p className="text-sm text-gray-400 mt-1">O chefe de família já conta como o 1º eleitor desta família.</p>
          </div>
        )}
      </div>
    </div>
  );
};
