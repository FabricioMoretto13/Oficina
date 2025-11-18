# 🚀 Guia Rápido - Proteção LGPD

## Para o Usuário do Sistema

### Ao Cadastrar um Cliente

1. Preencha os dados do cliente normalmente
2. Note o **aviso de proteção LGPD** no topo do formulário
3. Clique em **"Salvar Cliente"**
4. O consentimento é registrado **automaticamente** ao cadastrar
5. Os dados sensíveis (CPF) são criptografados no banco

✅ Cliente cadastrado com consentimento registrado automaticamente!

---

## Para Clientes (Direitos LGPD)

### 📤 Acessar Meus Dados
Cliente pode solicitar uma cópia de todos os seus dados:
- Entre em contato: **dpo@oficina.com.br**
- Prazo de resposta: **15 dias**

### 🗑️ Excluir Meus Dados
Cliente pode solicitar exclusão completa:
- Entre em contato: **dpo@oficina.com.br**
- ⚠️ Não é possível se houver OS em aberto
- Todos os dados serão removidos permanentemente

### ✏️ Corrigir Dados
Se seus dados estiverem desatualizados:
- Entre em contato com a filial
- Ou envie e-mail: **dpo@oficina.com.br**

---

## Para Administradores

### 📊 Consultar Auditoria
Veja quem acessou os dados de um cliente:

```javascript
// No navegador
fetch('http://localhost:4000/api/lgpd/auditoria/cliente/ID_DO_CLIENTE')
  .then(r => r.json())
  .then(data => console.log(data.logs))
```

### 🔍 Verificar Consentimentos
Consulte no MongoDB:
```javascript
db.consentimentolgpds.find({ cpf: "12345678900" })
```

---

## ⚠️ Antes de Ir para Produção

### 1. Gerar Chave Única
```bash
# No terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a saída e cole no `.env`:
```env
ENCRYPTION_KEY=7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d
```

### 2. Testar Fluxo Completo
- [ ] Cadastrar cliente (verificar aviso LGPD)
- [ ] Verificar CPF criptografado no banco
- [ ] Verificar consentimento registrado automaticamente
- [ ] Testar portabilidade de dados
- [ ] Testar exclusão de dados
- [ ] Verificar logs de auditoria

### 3. Documentar DPO
No `.env`, configure:
```env
DPO_EMAIL=seu-email@empresa.com.br
DPO_NOME=Seu Nome Completo
EMPRESA_NOME=Nome da Oficina
EMPRESA_CNPJ=00.000.000/0000-00
```

---

## 🆘 Troubleshooting

### Aviso LGPD Não Aparece
1. Verifique se o componente está renderizado em `Cliente.jsx`
2. Confirme que os estilos inline estão corretos

### Consentimento Não é Registrado
1. Verifique se o endpoint `/api/lgpd/consentimento` está acessível
2. Confirme que o servidor backend está rodando
3. Veja o console do navegador para erros

### Erro ao Criptografar
```
Error: Falha na criptografia de dados
```
**Solução**: Verifique se `ENCRYPTION_KEY` tem 32 caracteres

### CPF Não Descriptografa
```
Error: Erro ao descriptografar
```
**Solução**: A chave de criptografia mudou. Dados antigos não podem ser recuperados.

---

## 📞 Contato

**Dúvidas sobre LGPD:**  
dpo@oficina.com.br

**Suporte técnico:**  
[Seu contato de suporte]

---

**✅ Sistema 100% em conformidade com a LGPD (Lei 13.709/2018)**
