
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { getClientes, getVeiculos, getOS, getChecklists, getTotalVeiculosAtendidos } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';


export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clientes: 0,
    veiculos: 0,
    osAbertas: 0,
    osEncerradas: 0,
    osPendentes: 0,
    checklists: 0
  });

  // For total cars attended
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [year, setYear] = useState(now.getFullYear());
  const [totalVeiculos, setTotalVeiculos] = useState(0);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [clientes, veiculos, os, checklists] = await Promise.all([
          getClientes(),
          getVeiculos(),
          getOS(),
          getChecklists()
        ]);
        setStats({
          clientes: clientes.length,
          veiculos: veiculos.length,
          osAbertas: os.filter(o => o.status === 'aberta').length,
          osEncerradas: os.filter(o => o.status === 'encerrada').length,
          osPendentes: os.filter(o => o.status === 'pagamento-pendente').length,
          checklists: checklists.length
        });

        // Processar dados para o gráfico - últimos 6 meses
        const data = processChartData(os);
        setChartData(data);
      } catch (err) {
        // Optionally show error
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  function processChartData(os) {
    const monthsData = [];
    const now = new Date();
    
    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Filtrar OSs deste mês
      const osDoMes = os.filter(o => {
        const osDate = new Date(o.criadoEm);
        return osDate.getMonth() === month && osDate.getFullYear() === year;
      });
      
      monthsData.push({
        mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        abertas: osDoMes.filter(o => o.status !== 'encerrada').length,
        encerradas: osDoMes.filter(o => o.status === 'encerrada').length,
        total: osDoMes.length
      });
    }
    
    return monthsData;
  }

  // Fetch total unique vehicles attended for selected month/year
  useEffect(() => {
    async function fetchTotalVeiculos() {
      setLoadingVeiculos(true);
      try {
        const res = await getTotalVeiculosAtendidos(month, year);
        setTotalVeiculos(res.total);
      } catch (err) {
        setTotalVeiculos(0);
      }
      setLoadingVeiculos(false);
    }
    fetchTotalVeiculos();
  }, [month, year]);

  function handleExportExcel() {
    const data = [
      { Tipo: 'Clientes', Total: stats.clientes },
      { Tipo: 'Veículos', Total: stats.veiculos },
      { Tipo: 'OS abertas', Total: stats.osAbertas },
      { Tipo: 'OS encerradas', Total: stats.osEncerradas },
      { Tipo: 'OS pagamento pendente', Total: stats.osPendentes },
      { Tipo: 'Checklists', Total: stats.checklists },
      { Tipo: `Carros atendidos (${month}/${year})`, Total: totalVeiculos }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
    XLSX.writeFile(wb, 'relatorio-oficina.xlsx');
  }

  function handleClickAbertas() {
    navigate('/os?aba=historico&status=aberta');
  }
  function handleClickEncerradas() {
    navigate('/os?aba=historico&status=encerrada');
  }
  function handleClickPendentes() {
    navigate('/os?aba=historico&status=pagamento-pendente');
  }

  // Month/year dropdowns
  const monthOptions = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const yearOptions = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) yearOptions.push(y);

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h2 style={{margin: 0}}>Dashboard</h2>
          <p style={{margin: '4px 0 0 0', color: '#666'}}>
            Bem-vindo{currentUser?.displayName ? `, ${currentUser.displayName}` : currentUser?.email ? `, ${currentUser.email}` : ''}!
          </p>
        </div>
        <button onClick={handleExportExcel} style={{padding: '10px 20px', background: '#0b5fff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600}}>
          Exportar Relatório
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Carregando dados do dashboard..." />
      ) : (
        <>
          {/* Cards de métricas principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <MetricCard 
              title="OSs Abertas" 
              value={stats.osAbertas} 
              color="#2196f3"
              onClick={handleClickAbertas}
              clickable
            />
            <MetricCard 
              title="OSs Encerradas" 
              value={stats.osEncerradas} 
              color="#4caf50"
              onClick={handleClickEncerradas}
              clickable
            />
            <MetricCard 
              title="Pagamento Pendente" 
              value={stats.osPendentes} 
              color="#f44336"
              onClick={handleClickPendentes}
              clickable
            />
            <MetricCard 
              title="Total OSs" 
              value={stats.osAbertas + stats.osEncerradas + stats.osPendentes} 
              color="#9c27b0"
            />
          </div>

          {/* Gráfico de evolução com filtro de veículos */}
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: 32
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 20, flexWrap: 'wrap'}}>
              <div style={{flex: 1, minWidth: 200}}>
                <h3 style={{margin: '0 0 4px 0', fontSize: 18, color: '#333'}}>Evolução de Ordens de Serviço</h3>
                <p style={{margin: 0, fontSize: 13, color: '#888'}}>Últimos 6 meses</p>
              </div>
              
              {/* Card de veículos atendidos integrado */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 10,
                padding: 14,
                color: '#fff',
                minWidth: 280
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <span style={{fontSize: 13, fontWeight: 600}}>Veículos Atendidos</span>
                  <div style={{display: 'flex', gap: 6}}>
                    <select 
                      value={month} 
                      onChange={e => setMonth(Number(e.target.value))}
                      style={{padding: '3px 6px', borderRadius: 4, border: 'none', fontSize: 11}}
                    >
                      {monthOptions.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <select 
                      value={year} 
                      onChange={e => setYear(Number(e.target.value))}
                      style={{padding: '3px 6px', borderRadius: 4, border: 'none', fontSize: 11}}
                    >
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{fontSize: 28, fontWeight: 700}}>
                  {loadingVeiculos ? (
                    <div style={{
                      width: 18,
                      height: 18,
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                  ) : totalVeiculos}
                </div>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" stroke="#666" style={{fontSize: 12}} />
                  <YAxis stroke="#666" style={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{fontSize: 14}}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    name="Total de OSs"
                    dot={{ fill: '#2196f3', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="encerradas" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    name="OSs Encerradas"
                    dot={{ fill: '#4caf50', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="abertas" 
                    stroke="#ff9800" 
                    strokeWidth={2}
                    name="OSs Abertas"
                    dot={{ fill: '#ff9800', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{textAlign: 'center', padding: 40, color: '#999'}}>
                Sem dados suficientes para exibir o gráfico
              </div>
            )}
          </div>

          {/* Resumo rápido */}
          <div style={{
            background: '#f9f9f9',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>Resumo Geral</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16}}>
              <InfoItem label="Clientes" value={stats.clientes} />
              <InfoItem label="Veículos" value={stats.veiculos} />
              <InfoItem label="Taxa de Conclusão" value={`${stats.osAbertas + stats.osEncerradas > 0 ? Math.round((stats.osEncerradas / (stats.osAbertas + stats.osEncerradas)) * 100) : 0}%`} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, color, onClick, clickable }) {
  // Definir SVG icons baseados no título - OPÇÃO 1: Tool/Settings/Document
  let iconSvg = null;
  
  if (title.includes('Abertas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    );
  } else if (title.includes('Encerradas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  } else if (title.includes('Pendente')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
  } else if (title.includes('Total')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    );
  }
  
  // OPÇÃO 2: Clipboard/CheckCircle/BarChart - Descomente para usar
  /*
  if (title.includes('Abertas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    );
  } else if (title.includes('Encerradas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    );
  } else if (title.includes('Total')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    );
  }
  */
  
  // OPÇÃO 3: Folder/FolderCheck/Archive - Descomente para usar
  /*
  if (title.includes('Abertas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    );
  } else if (title.includes('Encerradas')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <polyline points="9 11 12 14 22 4"/>
      </svg>
    );
  } else if (title.includes('Total')) {
    iconSvg = (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    );
  }
  */

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
        }
      }}
      onMouseLeave={e => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        }
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16}}>
        <div>
          <div style={{fontSize: 14, color: '#666', marginBottom: 12, fontWeight: 500}}>{title}</div>
          <div style={{fontSize: 36, fontWeight: 700, color: color}}>{value}</div>
        </div>
        <div style={{opacity: 0.3}}>
          {iconSvg}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>{label}</div>
      <div style={{fontSize: 20, fontWeight: 600, color: '#333'}}>{value}</div>
    </div>
  );
}


