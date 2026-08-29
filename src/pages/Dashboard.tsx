import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardResponse } from '../types';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Users, UserSquare2, Home } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.name}!</h1>
        <p className="text-gray-500">Aqui está o resumo da sua campanha hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {user?.role === 'CANDIDATO' && (
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Lideranças</CardTitle>
              <UserSquare2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{data?.totalLiderancas || 0}</div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Chefes de Família</CardTitle>
            <Home className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{data?.totalChefesFamilia || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Votos (Integrantes)</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{data?.totalIntegrantes || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
