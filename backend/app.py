import os
from datetime import datetime, timezone

from bson.errors import InvalidId
from bson.objectid import ObjectId
from flask import Flask, jsonify, request
from pymongo import MongoClient, ReturnDocument

# Inicializa a aplicação Flask
app = Flask(__name__)

mongo_client = MongoClient(os.environ["MONGO_URI"])
database = mongo_client.get_default_database()
projects_collection = database["projects"]

VALID_STATUSES = {"Planejado", "Em andamento", "Concluído"}
EDITABLE_FIELDS = {"name", "description", "status"}
SERVER_CONTROLLED_FIELDS = {"_id", "updated_at"}


def serialize_project(project):
    project["_id"] = str(project["_id"])

    updated_at = project.get("updated_at")
    if isinstance(updated_at, datetime):
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        project["updated_at"] = updated_at.isoformat().replace("+00:00", "Z")

    return project


def parse_project_id(project_id):
    try:
        return ObjectId(project_id)
    except (InvalidId, TypeError):
        return None


def validate_editable_fields(data):
    validated_fields = {}

    if "name" in data:
        name = data["name"]
        if not isinstance(name, str) or not name.strip():
            return None, "O nome é obrigatório e deve ser um texto não vazio."
        validated_fields["name"] = name.strip()

    if "description" in data:
        description = data["description"]
        if not isinstance(description, str) or not description.strip():
            return None, "A descrição é obrigatória e deve ser um texto não vazio."
        validated_fields["description"] = description.strip()

    if "status" in data:
        status = data["status"]
        if not isinstance(status, str):
            return None, "O status deve ser um texto."

        status = status.strip()
        if status not in VALID_STATUSES:
            accepted_statuses = ", ".join(sorted(VALID_STATUSES))
            return None, f"Status inválido. Valores aceitos: {accepted_statuses}."
        validated_fields["status"] = status

    return validated_fields, None


def validate_update_request(require_all_fields=False):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, "Envie os dados do projeto em um objeto JSON."

    controlled_fields = SERVER_CONTROLLED_FIELDS.intersection(data)
    if controlled_fields:
        fields = ", ".join(sorted(controlled_fields))
        if len(controlled_fields) == 1:
            return None, f"O campo {fields} é controlado pelo servidor e não pode ser alterado."
        return None, f"Os campos {fields} são controlados pelo servidor e não podem ser alterados."

    unknown_fields = set(data).difference(EDITABLE_FIELDS)
    if unknown_fields:
        fields = ", ".join(sorted(unknown_fields))
        if len(unknown_fields) == 1:
            return None, f"Campo desconhecido: {fields}."
        return None, f"Campos desconhecidos: {fields}."

    if require_all_fields:
        missing_fields = EDITABLE_FIELDS.difference(data)
        if missing_fields:
            fields = ", ".join(sorted(missing_fields))
            if len(missing_fields) == 1:
                return None, f"Campo obrigatório ausente: {fields}."
            return None, f"Campos obrigatórios ausentes: {fields}."
    elif not data:
        return None, "Envie ao menos um campo para atualizar o projeto."

    return validate_editable_fields(data)


def update_project(object_id, validated_fields):
    project = projects_collection.find_one({"_id": object_id})
    if project is None:
        return None

    changed_fields = {
        field: value
        for field, value in validated_fields.items()
        if project.get(field) != value
    }
    if not changed_fields:
        return project

    changed_fields["updated_at"] = datetime.now(timezone.utc)
    return projects_collection.find_one_and_update(
        {"_id": object_id},
        {"$set": changed_fields},
        return_document=ReturnDocument.AFTER,
    )


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


@app.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    object_id = parse_project_id(project_id)
    if object_id is None:
        return jsonify({"error": "ID de projeto inválido."}), 400

    project = projects_collection.find_one({"_id": object_id})
    if project is None:
        return jsonify({"error": "Projeto não encontrado."}), 404

    return jsonify(serialize_project(project)), 200


@app.route("/projects/<project_id>", methods=["PATCH"])
def patch_project(project_id):
    object_id = parse_project_id(project_id)
    if object_id is None:
        return jsonify({"error": "ID de projeto inválido."}), 400

    validated_fields, error = validate_update_request()
    if error:
        return jsonify({"error": error}), 400

    project = update_project(object_id, validated_fields)
    if project is None:
        return jsonify({"error": "Projeto não encontrado."}), 404

    return jsonify(serialize_project(project)), 200


@app.route("/projects/<project_id>", methods=["PUT"])
def put_project(project_id):
    object_id = parse_project_id(project_id)
    if object_id is None:
        return jsonify({"error": "ID de projeto inválido."}), 400

    validated_fields, error = validate_update_request(require_all_fields=True)
    if error:
        return jsonify({"error": error}), 400

    project = update_project(object_id, validated_fields)
    if project is None:
        return jsonify({"error": "Projeto não encontrado."}), 404

    return jsonify(serialize_project(project)), 200


@app.route("/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    object_id = parse_project_id(project_id)
    if object_id is None:
        return jsonify({"error": "ID de projeto inválido."}), 400

    result = projects_collection.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Projeto não encontrado."}), 404

    return jsonify({"message": "Projeto excluído com sucesso."}), 200


# Inicia o servidor Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
