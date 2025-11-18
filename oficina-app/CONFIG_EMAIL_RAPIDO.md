# 🚀 QUICK START - Configuração de E-mail em 3 Passos

## Passo 1: Configure sua Senha de App do Gmail

1. Acesse: https://myaccount.google.com/apppasswords
2. Faça login com `fabriciomoretto73@gmail.com`
3. Clique em "Selecionar app" → Escolha "E-mail"
4. Clique em "Selecionar dispositivo" → Escolha "Outro" → Digite "Oficina"
5. Clique em **Gerar**
6. **COPIE a senha de 16 caracteres gerada**

## Passo 2: Atualize o arquivo .env

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
EMAIL_PASSWORD=sua-senha-de-app
```

Por:

```env
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Cole a senha gerada no passo 1** (pode ser com ou sem espaços)

## Passo 3: Reinicie o Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

---

## ✅ Pronto! Agora é só usar

1. Acesse **Histórico de Ordens de Serviço**
2. Clique no botão **"📧 Enviar E-mail"** em qualquer OS
3. O cliente receberá:
   - E-mail HTML profissional com o checklist
   - PDF do Termo de Aceite anexado

---

## ⚠️ Importante

- O cliente **precisa ter e-mail cadastrado** no sistema
- A OS **precisa ter pelo menos 1 checklist** criado
- Aguarde alguns segundos após clicar (o botão mostra "Enviando...")

---

## 🐛 Se algo der errado

Verifique no console do backend:
- Mensagens de erro aparecerão lá
- Confirme que o EMAIL_PASSWORD está correto no .env
- Teste com seu próprio e-mail primeiro

**Consulte o GUIA_EMAIL.md para mais detalhes!**
