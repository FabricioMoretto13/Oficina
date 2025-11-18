# 🔒 Proteção de Dados - LGPD

## Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)

Este sistema foi desenvolvido em conformidade com a LGPD para proteger os dados pessoais dos clientes.

---

## 📋 Dados Coletados

O sistema coleta e armazena os seguintes dados pessoais:

### Clientes
- Nome completo
- CPF (armazenado com **criptografia AES-256**)
- Data de nascimento
- E-mail
- Telefone
- Endereço completo
- Filial de atendimento

### Usuários do Sistema
- Nome
- E-mail
- Filial

### Veículos
- Placa
- Modelo, marca, ano
- Cor
- Associação com cliente (via ID)

---

## 🎯 Finalidade do Tratamento

Os dados pessoais são coletados exclusivamente para:

1. **Cadastro e identificação** de clientes
2. **Gestão de ordens de serviço** automotivos
3. **Comunicação** sobre serviços contratados
4. **Emissão de documentos fiscais** (NF, recibos)
5. **Cumprimento de obrigações legais** (legislação tributária, trabalhista)

### Base Legal (Art. 7º LGPD)

O tratamento de dados se baseia em:
- **Execução de contrato** (inciso V): Dados necessários para prestação de serviços
- **Obrigação legal** (inciso II): Emissão de documentos fiscais
- **Consentimento implícito** (inciso I): Cliente é informado sobre o tratamento ao cadastrar

**Aviso ao Cliente**: Banner informativo visível no formulário de cadastro explica:
- Quais dados são coletados
- Proteção com criptografia
- Direitos do titular (acesso, correção, exclusão)

---

## 🔐 Medidas de Segurança Implementadas

### 1. Criptografia de Dados Sensíveis
- **Algoritmo**: AES-256-CBC
- **Dados criptografados**: CPF
- **Localização**: `utils/encryption.js`

```javascript
// Exemplo de uso
const { encrypt, decrypt } = require('./utils/encryption');
const cpfCriptografado = encrypt('12345678900');
const cpfOriginal = decrypt(cpfCriptografado);
```

### 2. Auditoria de Acesso (Art. 37 LGPD)
- **Registro completo** de todas as operações em dados pessoais
- **Informações registradas**:
  - Quem acessou (e-mail do usuário)
  - Quando acessou (timestamp)
  - Qual recurso (cliente, veículo, OS)
  - Tipo de operação (leitura, criação, edição, exclusão)
  - IP e User Agent

### 3. Aviso e Consentimento
- **Banner informativo** no cadastro de clientes
- Registro automático de data/hora do cadastro
- **Consentimento implícito** baseado em execução de contrato (Art. 7º, V)
- Cliente informado sobre:
  - ✅ Dados coletados e protegidos com criptografia
  - ✅ Finalidade do tratamento (gestão de serviços)
  - ✅ Direitos garantidos pela LGPD (acesso, correção, exclusão)

### 4. Isolamento Multi-tenant
- Dados separados por **filial**
- Usuários só acessam dados da sua filial
- Admin pode ter acesso global (configurável)

---

## 👤 Direitos dos Titulares (Clientes)

Conforme Art. 18 da LGPD, os clientes têm direito a:

### 1. Confirmação e Acesso
**Endpoint**: `GET /api/lgpd/meus-dados/:cpf`

Retorna todos os dados do cliente, incluindo:
- Informações pessoais
- Veículos cadastrados
- Histórico de ordens de serviço
- Consentimentos registrados

### 2. Correção de Dados
**Endpoint**: `PUT /api/clientes/:id`

Cliente pode solicitar atualização de dados desatualizados.

### 3. Exclusão de Dados (Direito ao Esquecimento)
**Endpoint**: `POST /api/lgpd/solicitar-exclusao`

**Body**:
```json
{
  "cpf": "12345678900",
  "email": "cliente@email.com",
  "motivo": "Não utilizo mais os serviços"
}
```

**Exclusão em cascata**:
- ✓ Dados do cliente
- ✓ Veículos associados
- ✓ Ordens de serviço
- ✓ Checklists
- ✓ Marca consentimentos como revogados

**Restrições**:
- ❌ Não é possível excluir se houver OS em aberto
- ⚠️ Dados podem ser mantidos por obrigação legal (5 anos - legislação fiscal)

### 4. Portabilidade
Dados retornados em formato JSON estruturado via endpoint `/meus-dados`.

### 5. Revogação de Consentimento
Cliente pode revogar consentimento a qualquer momento (implica em exclusão dos dados).

---

## 📊 Relatório de Auditoria

### Para Administradores

**Consultar logs de acesso**:
```
GET /api/lgpd/auditoria/:recurso/:id
```

Exemplo:
```
GET /api/lgpd/auditoria/cliente/507f1f77bcf86cd799439011
```

Retorna:
```json
{
  "logs": [
    {
      "usuarioEmail": "usuario@oficina.com",
      "tipoAcesso": "leitura",
      "recurso": "cliente",
      "recursoId": "507f1f77bcf86cd799439011",
      "timestamp": "2024-11-13T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "filial": "sorocaba"
    }
  ]
}
```

---

## 🏢 Controlador e Encarregado (DPO)

**Controlador de Dados**: Oficina Alien/Diesel  
**Endereço**: [Endereço da empresa]  
**CNPJ**: [CNPJ da empresa]

**Encarregado (DPO)**: [Nome do responsável]  
**E-mail para contato LGPD**: dpo@oficina.com.br  
**Telefone**: [Telefone de contato]

---

## ⚙️ Configuração do Sistema

### Variáveis de Ambiente (Obrigatórias em Produção)

```env
# Chave de criptografia (32 caracteres)
ENCRYPTION_KEY=sua-chave-secreta-de-32-caracteres-aqui-lgpd-2024

# MongoDB
MONGODB_URI=mongodb://localhost:27017/oficina

# Porta do servidor
PORT=4000
```

⚠️ **IMPORTANTE**: 
- NUNCA compartilhe a `ENCRYPTION_KEY`
- Em produção, use gerenciador de secrets (AWS Secrets Manager, Azure Key Vault, etc.)
- Faça backup regular da chave de criptografia

---

## 📝 Política de Retenção de Dados

| Dado | Tempo de Retenção | Justificativa |
|------|-------------------|---------------|
| Dados cadastrais | 5 anos após última OS | Legislação fiscal (NF-e) |
| Ordens de serviço | 5 anos | Código Civil (Art. 206) |
| Logs de auditoria | 6 meses | Investigação de incidentes |
| Consentimentos | Permanente | Prova de conformidade LGPD |

---

## 🚨 Notificação de Incidentes

Em caso de vazamento de dados, o sistema possui:

1. **Logs de auditoria** para rastreamento
2. **Dados criptografados** (CPF) minimizam impacto
3. **Procedimento de notificação**:
   - ANPD (Autoridade Nacional): até 72h
   - Titulares afetados: comunicação imediata
   - DPO deve ser notificado imediatamente

---

## ✅ Checklist de Conformidade

- [x] Base legal definida (execução de contrato + obrigação legal)
- [x] Aviso claro sobre coleta de dados
- [x] Dados sensíveis criptografados
- [x] Auditoria de acesso implementada
- [x] Direito ao esquecimento implementado
- [x] Portabilidade de dados disponível
- [x] Política de privacidade clara
- [x] DPO designado
- [x] Isolamento multi-tenant
- [x] Logs de segurança
- [ ] Treinamento de equipe (pendente)
- [ ] Testes de segurança (pendente)
- [ ] RIPD - Relatório de Impacto (recomendado)

---

## 📞 Exercer Direitos LGPD

Clientes podem exercer seus direitos através de:

1. **E-mail**: dpo@oficina.com.br
2. **Presencialmente**: Na filial de atendimento
3. **API**: Endpoints documentados neste arquivo

**Prazo de resposta**: 15 dias corridos (conforme LGPD)

---

## 📚 Referências

- [Lei 13.709/2018 - LGPD](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia ANPD para Pequenas Empresas](https://www.gov.br/anpd/)
- [Boas práticas de segurança OWASP](https://owasp.org/)

---

**Última atualização**: 13/11/2024  
**Versão dos Termos**: 1.0
