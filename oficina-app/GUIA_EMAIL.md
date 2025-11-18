# 📧 Sistema de Envio de E-mail com Checklist e Termo de Aceite

## ✅ Implementação Completa

O sistema de envio de e-mail foi implementado com sucesso! Agora você pode enviar:
- **Checklist de Vistoria** formatado em HTML profissional
- **Termo de Aceite e Execução de Serviços** em PDF anexado ao e-mail

---

## 🎯 Como Usar

### 1. Na Interface do Histórico
1. Acesse a página **Histórico de Ordens de Serviço**
2. Localize a OS que deseja enviar
3. Clique no botão **"📧 Enviar E-mail"**
4. O sistema enviará automaticamente para o e-mail cadastrado do cliente

### 2. O que é Enviado
- **E-mail HTML estilizado** contendo:
  - Informações da OS (número, cliente, veículo, data)
  - Serviços realizados
  - Checklist completo com status de cada item (✅/❌)
  - Verificações adicionais (vazamentos, luzes no painel)
  - Validação de entrega (se a OS estiver encerrada)
  - Status de pagamento

- **PDF anexado** contendo:
  - Termo de Aceite completo
  - Todas as informações do checklist
  - Espaços para assinatura do cliente e da oficina
  - Layout profissional pronto para impressão

---

## ⚙️ Configuração do E-mail

### Para Gmail (Recomendado)

1. **Ative a Verificação em Duas Etapas**
   - Acesse: https://myaccount.google.com/security
   - Ative a verificação em duas etapas

2. **Gere uma Senha de App**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App: E-mail" e "Dispositivo: Outro (nome personalizado)"
   - Digite "Oficina App" e clique em Gerar
   - **Copie a senha gerada** (16 caracteres)

3. **Configure o arquivo .env**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Cole a senha de app aqui
   ```

4. **Reinicie o servidor backend**
   ```bash
   cd oficina-app
   npm run dev
   ```

### Para Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USER=seu-email@outlook.com
EMAIL_PASSWORD=sua-senha
```

### Para Yahoo

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=seu-email@yahoo.com
EMAIL_PASSWORD=sua-senha
```

### Para SMTP Customizado

```env
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=seu-email@seudominio.com
EMAIL_PASSWORD=sua-senha
```

---

## 📋 Requisitos

### Cliente Precisa Ter
- ✅ E-mail cadastrado no sistema
- ✅ Pelo menos 1 checklist associado à OS

### Sistema Valida Automaticamente
- E-mail do cliente existe
- Checklist está disponível
- Configurações de SMTP estão corretas

---

## 🎨 Recursos Visuais

### E-mail HTML
- Design profissional com gradiente roxo/azul
- Informações organizadas em cards
- Ícones e emojis para melhor visualização
- Status coloridos (verde = OK, vermelho = problema)
- Responsivo para mobile

### PDF Termo de Aceite
- Logo e cabeçalho da empresa
- Informações completas da OS
- Checklist formatado
- Campos de assinatura
- Rodapé com data e informações legais

---

## 🔧 Arquivos Criados/Modificados

### Backend
- `utils/emailService.js` - Serviço de envio de e-mail com Nodemailer
- `utils/termoAceiteGenerator.js` - Gerador de PDF do termo de aceite
- `controllers/osController.js` - Adicionado endpoint `enviarEmail`
- `routes/os.js` - Adicionada rota POST `/api/os/:id/enviar-email`

### Frontend
- `frontend/src/api.js` - Adicionada função `sendOSEmail`
- `frontend/src/pages/Historico.jsx` - Adicionado botão e função de envio

### Dependências Instaladas
- `nodemailer` - Envio de e-mails
- `pdfkit` - Geração de PDFs

---

## 🐛 Troubleshooting

### "Erro ao enviar e-mail: Invalid login"
- Verifique se EMAIL_USER e EMAIL_PASSWORD estão corretos no .env
- Para Gmail, certifique-se de usar a Senha de App (não a senha normal)

### "Cliente não possui e-mail cadastrado"
- Edite o cadastro do cliente e adicione um e-mail válido

### "Esta OS não possui checklists"
- Crie um checklist para a OS antes de enviar o e-mail

### E-mail não chega
- Verifique a pasta de SPAM do destinatário
- Confirme que o e-mail do cliente está correto
- Teste enviando para seu próprio e-mail primeiro

---

## 📊 Logs e Monitoramento

O sistema registra no console do backend:
- ✅ E-mails enviados com sucesso (com messageId)
- ❌ Erros de envio com detalhes
- 📄 PDFs gerados e removidos

---

## 🚀 Próximos Passos Possíveis

- [ ] Adicionar histórico de e-mails enviados no banco de dados
- [ ] Permitir personalizar o template do e-mail
- [ ] Enviar cópia (CC) para a oficina
- [ ] Adicionar botão de reenvio de e-mail
- [ ] Dashboard com estatísticas de e-mails enviados
- [ ] Integração com outros provedores de e-mail (SendGrid, AWS SES)

---

## 📞 Suporte

Para dúvidas sobre configuração ou problemas técnicos, consulte:
- Documentação do Nodemailer: https://nodemailer.com/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833

**Status:** ✅ Sistema 100% funcional e pronto para uso!
