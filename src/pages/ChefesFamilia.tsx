import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ChefeFamiliaResponse } from '../types';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SecureImage } from '../components/SecureImage';
import { ImageUploadInput } from '../components/ImageUploadInput';
import { MultiImageUploadInput } from '../components/MultiImageUploadInput';
import { DocumentScannerBanner } from '../components/DocumentScannerBanner';
import { DocumentGalleryModal } from '../components/DocumentGalleryModal';
import { PhotoModal } from '../components/PhotoModal';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, Search, UserCheck, Files, FileText } from 'lucide-react';
import { maskDate, parseDateToApi, parseDateFromApi, maskCPF, maskPhone } from '../utils/masks';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

export const ChefesFamilia = () => {
  const navigate = useNavigate();
  const [chefes, setChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [filteredChefes, setFilteredChefes] = useState<ChefeFamiliaResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    id: number;
    nome: string;
    cpf: string;
    tituloEleitor: string;
    zona: string;
    secao: string;
    telefone: string;
    endereco: string;
    dataNascimento: string;
    fotoPerfil: string | null;
    fotoTitulo: string | null;
    documentos: string[];
  }>({
    id: 0,
    nome: '',
    cpf: '',
    tituloEleitor: '',
    zona: '',
    secao: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    fotoPerfil: null,
    fotoTitulo: null,
    documentos: [],
  });

  const [selectedPhoto, setSelectedPhoto] = useState<{
    isOpen: boolean;
    title: string;
    filename?: string | null;
    subtitle?: string;
  }>({
    isOpen: false,
    title: '',
    filename: null,
    subtitle: ''
  });

  const [galleryModal, setGalleryModal] = useState<{
    isOpen: boolean;
    chefeNome: string;
    documentos: string[];
  }>({
    isOpen: false,
    chefeNome: '',
    documentos: []
  });

  const fetchChefes = async (pageNumber: number = 0, isInitial: boolean = false) => {
    try {
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await api.get(`/api/chefes-familia?page=${pageNumber}&size=12`);
      const data = response.data;

      if (data && Array.isArray(data.content)) {
        if (pageNumber === 0) {
          setChefes(data.content);
        } else {
          setChefes((prev) => [...prev, ...data.content]);
        }
        setHasMore(!data.last && data.number + 1 < data.totalPages);
        setPage(pageNumber);
      } else if (Array.isArray(data)) {
        setChefes(data);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Erro ao buscar chefes', error);
      toast.error('Erro ao carregar chefes de família.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchChefes(0, true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !searchTerm) {
          fetchChefes(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, searchTerm]);

  useEffect(() => {
    const results = chefes.filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cpf && c.cpf.includes(searchTerm)) ||
      (c.tituloEleitor && c.tituloEleitor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredChefes(results);
  }, [searchTerm, chefes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error('Informe o nome do chefe de família.');
      return;
    }

    try {
      const dateApi = parseDateToApi(formData.dataNascimento);
      const payload = {
        ...formData,
        nome: formData.nome.trim(),
        cpf: formData.cpf?.trim() || null,
        tituloEleitor: formData.tituloEleitor?.trim() || null,
        zona: formData.zona?.trim() || null,
        secao: formData.secao?.trim() || null,
        telefone: formData.telefone?.trim() || null,
        endereco: formData.endereco?.trim() || null,
        dataNascimento: dateApi && dateApi.length === 10 ? dateApi : null,
        fotoPerfil: formData.fotoPerfil || null,
        fotoTitulo: formData.fotoTitulo || null,
        documentos: formData.documentos || [],
      };

      if (formData.id) {
        await api.put(`/api/chefes-familia/${formData.id}`, payload);
      } else {
        await api.post('/api/chefes-familia', payload);
      }
      setIsFormOpen(false);
      resetForm();
      toast.success('Chefe de família salvo com sucesso!');
      fetchChefes(0, true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar chefe de família');
    }
  };

  const resetForm = () =>
    setFormData({
      id: 0,
      nome: '',
      cpf: '',
      tituloEleitor: '',
      zona: '',
      secao: '',
      telefone: '',
      endereco: '',
      dataNascimento: '',
      fotoPerfil: null,
      fotoTitulo: null,
      documentos: [],
    });

  const handleCloseForm = () => {
    if (!formData.id) {
      if (formData.fotoPerfil) {
        api.delete(`/api/imagens/${formData.fotoPerfil}`).catch(console.warn);
      }
      if (formData.fotoTitulo) {
        api.delete(`/api/imagens/${formData.fotoTitulo}`).catch(console.warn);
      }
      if (formData.documentos && formData.documentos.length > 0) {
        formData.documentos.forEach((doc) => {
          api.delete(`/api/imagens/${doc}`).catch(console.warn);
        });
      }
    }
    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = (chefe: ChefeFamiliaResponse) => {
    setFormData({ 
      ...chefe,
      cpf: chefe.cpf || '',
      tituloEleitor: chefe.tituloEleitor || '',
      zona: chefe.zona || '',
      secao: chefe.secao || '',
      endereco: chefe.endereco || '',
      telefone: chefe.telefone || '',
      dataNascimento: parseDateFromApi(chefe.dataNascimento || ''),
      fotoPerfil: chefe.fotoPerfil || null,
      fotoTitulo: chefe.fotoTitulo || null,
      documentos: chefe.documentos || [],
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Tem certeza que deseja excluir? Isso removerá os eleitores associados.');
    if (confirmed) {
      try {
        await api.delete(`/api/chefes-familia/${id}`);
        const toastId = toast.success('Chefe de família excluído.', { duration: 2500 });
        setTimeout(() => {
          toast.dismiss(toastId);
          toast.remove(toastId);
        }, 2500);
        fetchChefes(0, true);
      } catch (error) {
        toast.error('Erro ao excluir.');
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto.filename) return;
    try {
      await api.delete(`/api/imagens/${selectedPhoto.filename}`);
      const toastId = toast.success('Foto apagada com sucesso!');
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.remove(toastId);
      }, 2500);
      setSelectedPhoto(prev => ({ ...prev, isOpen: false, filename: null }));
      fetchChefes(0, true);
    } catch (error: any) {
      console.error('Erro ao apagar foto', error);
      toast.error(error.response?.data?.message || 'Erro ao apagar foto.');
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
            placeholder="Buscar por nome, CPF ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={formData.id ? 'Editar Chefe de Família' : 'Novo Chefe de Família'}
        subtitle="Preencha os dados do chefe. O chefe também é contabilizado como eleitor."
        maxWidth="2xl"
      >
        <div className="mb-4">
          <DocumentScannerBanner
            onDataExtracted={(extracted) => {
              setFormData((prev) => {
                if (!prev.id && prev.fotoTitulo && extracted.fotoTitulo && prev.fotoTitulo !== extracted.fotoTitulo) {
                  api.delete(`/api/imagens/${prev.fotoTitulo}`).catch(console.warn);
                }
                return {
                  ...prev,
                  nome: extracted.nome || prev.nome,
                  tituloEleitor: extracted.tituloEleitor || prev.tituloEleitor,
                  zona: extracted.zona || prev.zona,
                  secao: extracted.secao || prev.secao,
                  dataNascimento: extracted.dataNascimento || prev.dataNascimento,
                  fotoTitulo: extracted.fotoTitulo || prev.fotoTitulo,
                };
              });
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Nome Completo *" 
            required 
            placeholder="Ex: João da Silva" 
            value={formData.nome} 
            onChange={e => setFormData({ ...formData, nome: e.target.value })} 
            className="md:col-span-2" 
          />
          
          <Input 
            label="CPF (opcional)" 
            inputMode="numeric" 
            placeholder="000.000.000-00" 
            value={formData.cpf} 
            onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} 
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
          <Input 
            label="Título de Eleitor (opcional)" 
            placeholder="Número do título" 
            value={formData.tituloEleitor} 
            onChange={e => setFormData({ ...formData, tituloEleitor: e.target.value })} 
          />
          
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <Input 
              label="Zona (opcional)" 
              placeholder="Zona" 
              value={formData.zona} 
              onChange={e => setFormData({ ...formData, zona: e.target.value })} 
            />
            <Input 
              label="Seção (opcional)" 
              placeholder="Seção" 
              value={formData.secao} 
              onChange={e => setFormData({ ...formData, secao: e.target.value })} 
            />
          </div>
          
          <Input 
            label="Endereço Completo (opcional)" 
            placeholder="Rua, número, bairro..." 
            value={formData.endereco} 
            onChange={e => setFormData({ ...formData, endereco: e.target.value })} 
            className="md:col-span-2" 
          />

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <ImageUploadInput
              label="Foto de Perfil (Opcional)"
              tipo="perfil"
              value={formData.fotoPerfil}
              onChange={(filename) => setFormData({ ...formData, fotoPerfil: filename })}
            />
            <ImageUploadInput
              label="Foto do Título de Eleitor (Opcional)"
              tipo="titulo"
              value={formData.fotoTitulo}
              onChange={(filename) => setFormData({ ...formData, fotoTitulo: filename })}
            />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-gray-100">
            <MultiImageUploadInput
              label="Documentos Adicionais (Até 5 fotos - Opcional)"
              description="Envie RG, CNH, Comprovante de Residência ou Lista de Eleitores vinculada a esta família."
              maxFiles={5}
              values={formData.documentos}
              onChange={(newDocs) => setFormData({ ...formData, documentos: newDocs })}
              onViewImage={(filename) => setSelectedPhoto({
                isOpen: true,
                title: `Documento - ${formData.nome || 'Chefe de Família'}`,
                filename,
                subtitle: 'Documento Anexado'
              })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={handleCloseForm}>Cancelar</Button>
            <Button type="submit">Salvar Chefe</Button>
          </div>
        </form>
      </Modal>

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
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                        {chefe.fotoPerfil ? (
                          <SecureImage
                            filename={chefe.fotoPerfil}
                            alt={chefe.nome}
                            className="w-full h-full object-cover"
                            fallback={
                              <div className="flex items-center justify-center w-full h-full text-primary font-bold">
                                <UserCheck size={22} />
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-primary font-bold">
                            <UserCheck size={22} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{chefe.nome}</h3>
                        <span className="text-xs text-primary font-medium">Chefe de Família</span>
                      </div>
                    </div>
                    <div className="flex gap-1 bg-gray-100 rounded-full px-2 py-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(chefe); }} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(chefe.id); }} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-white transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-3 bg-gray-50/70 p-3 rounded-lg">
                    <div><span className="text-gray-400 block text-xs">CPF</span>{chefe.cpf || 'Não informado'}</div>
                    <div><span className="text-gray-400 block text-xs">Telefone</span>{chefe.telefone || '-'}</div>
                    {chefe.dataNascimento && (
                      <div><span className="text-gray-400 block text-xs">Nascimento</span>{new Date(chefe.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    )}
                    <div className={chefe.dataNascimento ? "" : "col-span-2"}><span className="text-gray-400 block text-xs">Título</span>{chefe.tituloEleitor || '-'}</div>
                    <div><span className="text-gray-400 block text-xs">Local</span>Z: {chefe.zona || '-'} | S: {chefe.secao || '-'}</div>
                    <div className="col-span-2"><span className="text-gray-400 block text-xs">Endereço</span>{chefe.endereco || '-'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2">
                  <span>Liderança: <strong>{chefe.liderancaNome}</strong></span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {chefe.fotoTitulo && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto({
                          isOpen: true,
                          title: `Título de Eleitor - ${chefe.nome}`,
                          filename: chefe.fotoTitulo,
                          subtitle: `Título: ${chefe.tituloEleitor || '-'} | Zona: ${chefe.zona || '-'} | Seção: ${chefe.secao || '-'}`
                        })}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Ver Foto do Título"
                      >
                        <FileText size={13} />
                        <span>Ver Título</span>
                      </button>
                    )}
                    {chefe.documentos && chefe.documentos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGalleryModal({
                          isOpen: true,
                          chefeNome: chefe.nome,
                          documentos: chefe.documentos || []
                        })}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Ver Documentos Anexados"
                      >
                        <Files size={13} />
                        <span>Ver Documentos ({chefe.documentos.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredChefes.length === 0 && !isFormOpen && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              Nenhum chefe de família encontrado.
            </div>
          )}

          {/* Sentinel for Infinite Scroll */}
          <div ref={observerTarget} className="py-4 flex justify-center w-full col-span-full">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Carregando mais chefes de família...
              </div>
            )}
            {!hasMore && chefes.length > 0 && !isLoading && (
              <span className="text-xs text-gray-400">Todos os chefes foram carregados</span>
            )}
          </div>
        </div>
      )}

      {/* Modal de Foto Individual */}
      <PhotoModal
        isOpen={selectedPhoto.isOpen}
        onClose={() => setSelectedPhoto(prev => ({ ...prev, isOpen: false }))}
        title={selectedPhoto.title}
        filename={selectedPhoto.filename}
        subtitle={selectedPhoto.subtitle}
        onDelete={selectedPhoto.filename ? handleDeletePhoto : undefined}
        deleteTooltip="Apagar esta foto do título"
      />

      {/* Modal de Galeria de Documentos do Chefe */}
      <DocumentGalleryModal
        isOpen={galleryModal.isOpen}
        onClose={() => setGalleryModal(prev => ({ ...prev, isOpen: false }))}
        title={`Documentos de ${galleryModal.chefeNome}`}
        documentos={galleryModal.documentos}
        onDocumentDeleted={() => fetchChefes(0, true)}
      />
    </div>
  );
};
