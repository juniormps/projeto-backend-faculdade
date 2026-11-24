import os
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from pymongo import MongoClient

# Inicializa a aplicação Flask
app = Flask(__name__)

mongo_client = MongoClient(os.environ["MONGO_URI"])
database = mongo_client.get_default_database()
projects_collection = database["projects"]

VALID_STATUSES = {"Planejado", "Em andamento", "Concluído"}


def serialize_project(project):
    project["_id"] = str(project["_id"])

    updated_at = project.get("updated_at")
    if isinstance(updated_at, datetime):
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        project["updated_at"] = updated_at.isoformat().replace("+00:00", "Z")

    return project


# Retorna todos os projetos cadastrados
@app.route("/projects", methods=["GET"])
def get_projects():
    projects = [serialize_project(project) for project in projects_collection.find()]
    return jsonify(projects), 200


# Adiciona um novo projeto
@app.route("/projects", methods=["POST"])
def add_project():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Envie os dados do projeto em um objeto JSON."}), 400

    name = data.get("name")
    if not isinstance(name, str) or not name.strip():
        return jsonify({"error": "O nome é obrigatório e deve ser um texto não vazio."}), 400

    description = data.get("description")
    if not isinstance(description, str) or not description.strip():
        return jsonify({"error": "A descrição é obrigatória e deve ser um texto não vazio."}), 400

    status = data.get("status", "")
    if not isinstance(status, str):
        return jsonify({"error": "O status deve ser um texto."}), 400

    status = status.strip() or "Planejado"
    if status not in VALID_STATUSES:
        accepted_statuses = ", ".join(sorted(VALID_STATUSES))
        return jsonify({"error": f"Status inválido. Valores aceitos: {accepted_statuses}."}), 400

    new_project = {
        "name": name.strip(),
        "description": description.strip(),
        "status": status,
        "updated_at": datetime.now(timezone.utc),
    }
    projects_collection.insert_one(new_project)

    return jsonify(serialize_project(new_project)), 201


# Inicia o servidor Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
