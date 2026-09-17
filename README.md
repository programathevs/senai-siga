# senai_siga

Sistema interno de gestão de advertências disciplinares para unidade do SENAI. Permite o registro de FIAPs por falta, comportamento ou desempenho com cálculo automático de faltas, geração de PDF, envio para a equipe da AQV, abertura de Planos de Recuperação vinculados e controle de acesso para Admin, Instrutor e AQV.

<!-- Badges de Stack e Status -->
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11%2B-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
<!-- Quando o CI for configurado no futuro, descomente o badge abaixo:
[![CI](https://github.com/SEU_USUARIO/senai-siga/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU_USUARIO/senai-siga/actions)
-->

---

## Como Rodar Localmente

### Pré-requisitos
- PHP >= 8.3 e [Composer](https://getcomposer.org/)
- Node.js >= 20 e npm
- Servidor MySQL ativo com uma base de dados criada

---

### Backend (Laravel)

1. Acesse o diretório do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   composer install
   ```

3. Configure o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
   > Ajuste as variáveis de conexão com o banco de dados (`DB_*`) e de e-mail (`MAIL_*`) no arquivo `.env`.

4. Gere a chave da aplicação e execute as migrações:
   ```bash
   php artisan key:generate
   php artisan migrate
   ```

5. Inicie o servidor da API:
   ```bash
   php artisan serve
   ```
   O backend estará disponível em `http://localhost:8000`.

---

### Frontend (React + Vite)

1. Em outro terminal, acesse o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:5173`.

---

## Testes

O projeto está em estágio inicial de desenvolvimento e ainda não conta com uma suíte de testes automatizados configurada.

---

## Como Contribuir

Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre fluxo de branches, padrão de commits e diretrizes de contribuição.

---

## Documentação Adicional

Para detalhes sobre arquitetura e fluxos de negócio, consulte a pasta [docs/](docs/):
- [Arquitetura do Sistema](docs/arquitetura.md)
- [Ciclo de Vida da FIAP](docs/fluxos-fiap.md)
- [Perfis e Permissões](docs/perfis-e-permissoes.md)

---

## Licença

Projeto institucional de uso interno exclusivo do SENAI. Todos os direitos reservados. Não possui licença pública de código aberto.
