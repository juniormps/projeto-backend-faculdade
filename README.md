# Conecta Comunidade

Aplicação web desenvolvida para gerenciar e divulgar projetos sociais de uma ONG em benefício de comunidades locais. O sistema permite cadastrar, listar, consultar, editar, excluir e filtrar iniciativas sociais pelo estágio em que se encontram.

Este projeto foi produzido para a disciplina **Projeto de Software Back-End** do curso de Análise e Desenvolvimento de Sistemas.

## Arquitetura e tecnologias

Os três serviços da aplicação são executados em contêineres pelo Docker Compose:

- **Frontend:** interface React responsável pelas telas, navegação e integração HTTP com a API. Utiliza Axios para as requisições.
- **Backend:** API REST desenvolvida com Python, Flask, Flask-CORS e PyMongo. Aplica as validações e acessa o banco de dados.
- **MongoDB:** armazena os projetos na coleção `projects` do banco `ongdb`.

Também são utilizados Node.js, CSS, Docker e Docker Compose.

## Estrutura

```text
.
├── backend/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── docker-compose.yml
└── README.md
```

## Como executar

### Pré-requisitos

- Docker instalado.
- Plugin Docker Compose disponível pelo comando `docker compose`.

Execute os comandos a seguir na raiz do repositório.

Para construir as imagens e iniciar os serviços em segundo plano:

```bash
docker compose up -d --build
```

Para conferir se os três serviços estão em execução:

```bash
docker compose ps
```

Para acompanhar os logs:

```bash
docker compose logs -f
```

Para encerrar e remover os contêineres e a rede, preservando os dados do MongoDB:

```bash
docker compose down
```

Não utilize `docker compose down -v` se quiser preservar os projetos cadastrados, pois a opção `-v` remove o volume do banco.

### Quando reconstruir

Os Dockerfiles copiam o código para dentro das imagens e o Compose não usa um volume para montar os arquivos-fonte. Por isso, após alterar código, dependências ou um Dockerfile, reconstrua o serviço correspondente:

```bash
docker compose up -d --build frontend
docker compose up -d --build backend
```

Também é possível reconstruir e iniciar toda a aplicação novamente com:

```bash
docker compose up -d --build
```

Não é necessário reconstruir a imagem do MongoDB ao alterar apenas o frontend ou o backend.

## Endereços

- Aplicação React: http://localhost:3000
- Lista de projetos pela API: http://localhost:5000/projects
- MongoDB: `localhost:27017`

Na configuração atual do Docker Compose, o frontend acessa a API em `http://localhost:5000`.

## API de projetos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/projects` | Retorna todos os projetos em um array. |
| `POST` | `/projects` | Cadastra um projeto. |
| `GET` | `/projects/<id>` | Retorna os detalhes de um projeto. |
| `PATCH` | `/projects/<id>` | Altera parcialmente um projeto. |
| `PUT` | `/projects/<id>` | Substitui todos os campos editáveis de um projeto. |
| `DELETE` | `/projects/<id>` | Exclui um projeto. |

### Cadastro

No `POST /projects`, os campos `name` e `description` são obrigatórios e devem conter texto. O campo `status` é opcional; quando omitido ou enviado vazio, o backend utiliza `Planejado`.

Os status aceitos são:

- `Planejado`
- `Em andamento`
- `Concluído`

Exemplo de cadastro:

```json
{
  "name": "Horta Comunitária",
  "description": "Cultivo coletivo de alimentos para famílias da comunidade.",
  "status": "Em andamento"
}
```

O MongoDB gera o `_id`, e o backend registra `updated_at` em UTC. Esses campos são retornados pela API, mas não podem ser alterados pelo cliente.

### PATCH e PUT

- O `PATCH` recebe um ou mais campos entre `name`, `description` e `status`. Os campos omitidos são preservados, e somente os valores realmente modificados são gravados.
- O `PUT` exige os três campos editáveis: `name`, `description` e `status`.
- Nos dois métodos, `updated_at` só muda quando algum valor realmente é alterado.

IDs malformados retornam erro `400`. Um ID válido sem projeto correspondente retorna `404`.

## Filtro dinâmico por status

A funcionalidade exclusiva do passo 4.2 permite filtrar os cartões por `Planejado`, `Em andamento` ou `Concluído`, além da opção `Todos`.

O filtro utiliza a lista que o React já recebeu de `GET /projects`. A troca de opção atualiza imediatamente os cartões e a contagem exibida, sem recarregar a página nem fazer uma nova consulta à API. A opção selecionada é preservada ao abrir os detalhes e voltar para a lista.

## Persistência dos dados

Os projetos são armazenados no MongoDB, no banco `ongdb` e na coleção `projects`. O serviço utiliza o volume nomeado `mongo-data`, montado em `/data/db`, para manter os dados mesmo quando os contêineres são reiniciados ou removidos com `docker compose down`.
