import { useState, useEffect } from 'react';
import api from '../services/api';
import type { LiderancaResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { maskDate, parseDateToApi, parseDateFromApi, maskPhone } from '../utils/masks';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const Liderancas = () => {
  const [liderancas, setLiderancas] = useState<LiderancaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', username: '', password: '', telefone: '', dataNascimento: '', bairro: '' });

  const fetchLiderancas = async () => {
    try {
      const response = await api.get('/api/liderancas');
      setLiderancas(response.data);
    } catch (error) {
      console.error('Erro ao buscar lideranças', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiderancas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dataNascimento: parseDateToApi(formData.dataNascimento)
      };

      if (formData.id) {
        await api.put(`/api/liderancas/${formData.id}`, payload);
      } else {
        await api.post('/api/liderancas', payload);
      }
      setIsFormOpen(false);
      setFormData({ id: 0, name: '', username: '', password: '', telefone: '', dataNascimento: '', bairro: '' });
      toast.success('Liderança salva com sucesso!');
      fetchLiderancas();
    } catch (error) {
      console.error('Erro ao salvar', error);
      toast.error('Erro ao salvar liderança');
    }
  };

  const handleEdit = (lideranca: LiderancaResponse) => {
    setFormData({
      id: lideranca.id,
      name: lideranca.name,
      username: lideranca.username,
      password: '', // Não traz a senha do back
      telefone: lideranca.telefone || '',
      dataNascimento: parseDateFromApi(lideranca.dataNascimento || ''),
      bairro: lideranca.bairro || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir esta liderança?');
    if (confirmed) {
      try {
        await api.delete(`/api/liderancas/${id}`);
        toast.success('Liderança excluída.');
        fetchLiderancas();
      } catch (error) {
        console.error('Erro ao excluir', error);
        toast.error('Erro ao excluir. Verifique dependências.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lideranças</h1>
        <Button onClick={() => {
          setFormData({ id: 0, name: '', username: '', password: '', telefone: '', dataNascimento: '', bairro: '' });
          setIsFormOpen(true);
        }}>
          <Plus size={20} className="md:mr-2" />
          <span className="hidden md:inline">Nova Liderança</span>
        </Button>
      </div>

      {isFormOpen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{formData.id ? 'Editar Liderança' : 'Nova Liderança'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Usuário (Login)"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                label={formData.id ? "Nova Senha (opcional)" : "Senha"}
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <Input
                label="Telefone"
                inputMode="numeric"
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                label="Data de Nascimento"
                value={formData.dataNascimento}
                onChange={e => setFormData({ ...formData, dataNascimento: maskDate(e.target.value) })}
              />
              <Input
                label="Bairro"
                value={formData.bairro}
                onChange={e => setFormData({ ...formData, bairro: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liderancas.map(lid => (
            <Card key={lid.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{lid.name}</h3>
                    <p className="text-sm text-gray-500">@{lid.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(lid)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(lid.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {lid.telefone && <div><span className="text-gray-400 font-medium">Tel:</span> {lid.telefone}</div>}
                  {lid.bairro && <div><span className="text-gray-400 font-medium">Bairro:</span> {lid.bairro}</div>}
                  {lid.dataNascimento && <div><span className="text-gray-400 font-medium">Nasc:</span> {new Date(lid.dataNascimento).toLocaleDateString('pt-BR')}</div>}
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                    <span className="font-bold">{lid.totalChefes}</span> Chefes
                  </div>
                  <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                    <span className="font-bold">{lid.totalIntegrantes}</span> Votos
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {liderancas.length === 0 && !isFormOpen && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhuma liderança cadastrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
