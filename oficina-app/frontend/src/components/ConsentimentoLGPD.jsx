import React, { useState } from 'react';

export default function ConsentimentoLGPD({ onAccept, clienteNome }) {
  const [aceiteColeta, setAceiteColeta] = useState(false);
  const [aceiteCompartilhamento, setAceiteCompartilhamento] = useState(false);
  const [aceiteMarketing, setAceiteMarketing] = useState(false);
  const [mostrarPolitica, setMostrarPolitica] = useState(false);

  const handleAccept = () => {
    if (!aceiteColeta) {
      alert('É necessário aceitar a coleta e tratamento de dados para prosseguir.');
      return;
    }
    onAccept({
      consentimentoColetaDados: aceiteColeta,
      consentimentoCompartilhamento: aceiteCompartilhamento,
      consentimentoMarketing: aceiteMarketing
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
            🔒 Proteção de Dados - LGPD
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#f0f0f0', fontSize: '0.95rem' }}>
            Lei Geral de Proteção de Dados Pessoais
          </p>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '24px' }}>
          <p style={{ marginTop: 0, fontSize: '1rem', lineHeight: '1.6', color: '#444' }}>
            Olá, <strong>{clienteNome || 'Cliente'}</strong>! Para prosseguir com o cadastro, 
            precisamos do seu consentimento para coletar e tratar seus dados pessoais.
          </p>

          <div style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#333' }}>
              📋 Dados coletados:
            </h3>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#555' }}>
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Data de nascimento</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>Endereço</li>
            </ul>
          </div>

          <div style={{
            background: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #90caf9'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1565c0' }}>
              🎯 Finalidade:
            </h3>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#1976d2' }}>
              <li>Cadastro e identificação do cliente</li>
              <li>Realização de ordens de serviço</li>
              <li>Comunicação sobre serviços contratados</li>
              <li>Emissão de documentos fiscais</li>
            </ul>
          </div>

          {/* Checkboxes de consentimento */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              background: '#fff3e0',
              border: '2px solid #ff9800',
              borderRadius: '8px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={aceiteColeta}
                onChange={(e) => setAceiteColeta(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.95rem', color: '#e65100', fontWeight: 600 }}>
                <strong style={{ color: '#c00' }}>*</strong> Autorizo a coleta e tratamento dos meus dados pessoais 
                para as finalidades descritas acima, conforme a LGPD.
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={aceiteCompartilhamento}
                onChange={(e) => setAceiteCompartilhamento(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                Autorizo o compartilhamento dos meus dados com prestadores de serviço 
                (ex: oficinas parceiras, despachantes) quando necessário.
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={aceiteMarketing}
                onChange={(e) => setAceiteMarketing(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                Aceito receber comunicações sobre promoções, novos serviços e ofertas.
              </span>
            </label>
          </div>

          {/* Seus direitos */}
          <div style={{
            background: '#e8f5e9',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #81c784'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#2e7d32' }}>
              ✅ Seus direitos (LGPD):
            </h3>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#388e3c', fontSize: '0.9rem' }}>
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimização ou exclusão</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setMostrarPolitica(!mostrarPolitica)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}
          >
            {mostrarPolitica ? '▼' : '▶'} Política de Privacidade Completa
          </button>

          {mostrarPolitica && (
            <div style={{
              background: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: '#555',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <h4>Política de Privacidade</h4>
              <p>
                Esta política descreve como coletamos, usamos e protegemos seus dados pessoais 
                em conformidade com a Lei 13.709/2018 (LGPD).
              </p>
              <p><strong>1. Controlador de Dados:</strong> Oficina Alien/Diesel</p>
              <p><strong>2. Encarregado (DPO):</strong> dpo@oficina.com.br</p>
              <p><strong>3. Segurança:</strong> Utilizamos criptografia AES-256 para proteger dados sensíveis.</p>
              <p><strong>4. Retenção:</strong> Dados são mantidos pelo tempo necessário para prestação 
              do serviço e obrigações legais (geralmente 5 anos conforme legislação tributária).</p>
              <p><strong>5. Compartilhamento:</strong> Dados podem ser compartilhados apenas com seu 
              consentimento explícito ou quando exigido por lei.</p>
              <p><strong>6. Seus direitos:</strong> Você pode solicitar acesso, correção ou exclusão 
              dos seus dados a qualquer momento.</p>
            </div>
          )}

          {/* Botões */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={handleAccept}
              disabled={!aceiteColeta}
              style={{
                flex: 1,
                padding: '14px',
                background: aceiteColeta ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: aceiteColeta ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: aceiteColeta ? 1 : 0.6
              }}
            >
              ✓ Aceitar e Continuar
            </button>
          </div>

          <p style={{
            fontSize: '0.8rem',
            color: '#999',
            marginTop: '16px',
            marginBottom: 0,
            textAlign: 'center'
          }}>
            Ao aceitar, você concorda com nossa Política de Privacidade e Termos de Uso
          </p>
        </div>
      </div>
    </div>
  );
}
