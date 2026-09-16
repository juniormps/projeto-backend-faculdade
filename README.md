# Projeto de Software Back-End

Aplicação web desenvolvida para a disciplina **Projeto de Software Back-End** do curso de Análise e Desenvolvimento de Sistemas.

O projeto utiliza Docker Compose para executar três serviços em contêineres separados: frontend, backend e banco de dados.

## Tecnologias

- React
- Node.js
- Python
- Flask
- MongoDB
- Docker
- Docker Compose

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
└── docker-compose.yml
```

## Como executar

Na raiz do projeto, construa as imagens:

```bash
docker compose build
```

Inicie os serviços:

```bash
docker compose up
```

Acesse:

- Frontend: http://localhost:3000
- API: http://localhost:5000/projects
- MongoDB: `localhost:27017`

Para encerrar:

```bash
docker compose down
```

## Endpoints

### Listar projetos

```http
GET /projects
```

### Adicionar projeto

```http
POST /projects
Content-Type: application/json
```

Exemplo de corpo:

```json
{
    "name": "Projeto ONG",
    "description": "Um projeto simples"
}
```

## Observação

Nesta etapa inicial, os projetos são armazenados em uma lista na memória do backend. Portanto, os dados são apagados quando o serviço é reiniciado. O MongoDB já está disponível na arquitetura, mas ainda não está integrado às rotas da API.
