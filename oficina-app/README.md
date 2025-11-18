# Alien Oficina App (backend)

Esqueleto inicial do backend para o sistema OficinaApp.

## Como usar

1. Instalar dependências:

```powershell
cd oficina-app
npm install
```

2. Criar um arquivo `.env` baseado no `.env.example`:

```powershell
cp .env.example .env
```

Configure as variáveis:
- `MONGODB_URI`: URL do MongoDB
- `ULTRAMSG_INSTANCE_ID` e `ULTRAMSG_TOKEN`: Credenciais do UltraMsg para envio de WhatsApp (opcional)
- `APP_URL`: URL base da aplicação

3. Executar em desenvolvimento:

```powershell
npm run dev
```

Endpoints básicos: `/api/clientes`, `/api/veiculos`, `/api/os`, `/api/checklist` (GET, POST)
