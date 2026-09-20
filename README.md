# senai_siga

Sistema interno de gestão de advertências disciplinares para unidade do SENAI. Permite o registro de FIAPs (Fichas Individuais de Avaliação Periódica) por falta, comportamento ou desempenho com cálculo automático de faltas, geração de PDF, envio para a equipe da AQV, abertura de Planos de Recuperação vinculados e controle de acesso baseado em papéis (Admin, Instrutor e AQV).

<!-- Badges de Stack e Status -->
![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11%2B-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24%2B-2496ED?logo=docker&logoColor=white)

---

## 🚀 Como Rodar o Projeto

Você pode executar o ambiente de desenvolvimento de duas formas:
1. **[Via Docker (Recomendado)](#opção-1-execução-via-docker-recomendado)**: Sobe todo o ecossistema (MySQL, Backend e Frontend) em containers isolados sem necessidade de instalar PHP ou MySQL na sua máquina.
2. **[Execução Local Bare-Metal](#opção-2-execução-local-bare-metal)**: Para desenvolvimento direto no sistema operacional hospedeiro.

---

### Opção 1: Execução via Docker (Recomendado)

#### Pré-requisitos:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com Docker Compose ativo).
- [Git](https://git-scm.com/).

#### Passo a Passo:

1. **Clone o repositório e acesse a pasta:**
   ```bash
   git clone https://github.com/SEU_USUARIO/senai-siga.git
   cd senai-siga
   ```

2. **Configure o arquivo de ambiente do Backend:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   > *Nota: O `docker-compose.yml` já injeta automaticamente as variáveis de conexão com o container do banco de dados.*

3. **Construa as imagens e inicie os containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Instale as dependências e prepare o banco de dados no container:**
   ```bash
   # Instala dependências do Composer
   docker compose exec backend composer install

   # Gera a chave única da aplicação
   docker compose exec backend php artisan key:generate

   # Executa todas as migrações no MySQL
   docker compose exec backend php artisan migrate

   # Cria o link simbólico para visualização/download de PDFs gerados
   docker compose exec backend php artisan storage:link
   ```

5. **Pronto! Acessos disponíveis:**
   - **Frontend (SPA):** [http://localhost:5173](http://localhost:5173)
   - **Backend (API REST):** [http://localhost:8000](http://localhost:8000)
   - **Banco MySQL (acesso externo via DBeaver/Workbench):** Host `localhost`, Porta `3307`, Usuário `root`, Senha `root`, Database `laravel_app`.

#### Comandos Úteis do Docker:
- **Visualizar logs em tempo real:**
  ```bash
  docker compose logs -f
  ```
- **Parar os containers:**
  ```bash
  docker compose down
  ```
- **Acessar o terminal interativo do backend:**
  ```bash
  docker compose exec backend bash
  ```

---

### Opção 2: Execução Local (Bare-Metal)

#### Pré-requisitos:
- **PHP >= 8.4** com extensões ativas: `pdo_mysql`, `mbstring`, `zip`, `xml`, `exif`
- **[Composer](https://getcomposer.org/)** (v2+)
- **Node.js >= 20** e **npm**
- **Servidor MySQL 8.0** ativo localmente com um banco de dados criado (ex.: `senai_siga`)

---

#### 1. Backend (Laravel)

1. Acesse o diretório do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências PHP:
   ```bash
   composer install
   ```

3. Configure o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
   > Abra o arquivo `.env` e configure as credenciais da sua base local (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

4. Gere a chave da aplicação, rode as migrações e crie o storage link:
   ```bash
   php artisan key:generate
   php artisan migrate
   php artisan storage:link
   ```

5. Inicie o servidor da API:
   ```bash
   php artisan serve
   ```
   O backend estará disponível em `http://localhost:8000`.

---

#### 2. Frontend (React + TypeScript + Vite)

1. Em outro terminal, acesse o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências Node:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:5173`.

---

## 🧪 Testes e Qualidade de Código

O repositório conta com esteira de integração contínua (CI) via GitHub Actions que valida automaticamente qualquer alteração enviada via Pull Request:

- **Backend (PHPUnit):**
  ```bash
  cd backend
  php artisan test
  ```
- **Frontend (Linter Oxlint & TypeScript Build):**
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

---

## 🤝 Como Contribuir

Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre a estratégia de branches (`main`, `develop`, `feat/`), o padrão de Conventional Commits e o template obrigatório para Pull Requests.

---

## 📚 Documentação Adicional

Para detalhes arquiteturais aprofundados e especificações das regras de negócio, consulte a pasta [docs/](docs/):
- [Arquitetura do Sistema](docs/arquitetura.md)
- [Ciclo de Vida da FIAP](docs/fluxos-fiap.md)
- [Perfis e Permissões (RBAC)](docs/perfis-e-permissoes.md)

---

## 📄 Licença

Projeto institucional de uso interno exclusivo do SENAI. Todos os direitos reservados. Não possui licença pública de código aberto.
