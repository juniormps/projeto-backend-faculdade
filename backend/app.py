from flask import Flask, jsonify, request

# Inicializa a aplicação Flask
app = Flask(__name__)

# Simula um banco de dados usando uma lista em memória
projects = []


# Retorna todos os projetos cadastrados
@app.route("/projects", methods=["GET"])
def get_projects():
    return jsonify(projects), 200


# Adiciona um novo projeto
@app.route("/projects", methods=["POST"])
def add_project():
    new_project = request.get_json()
    projects.append(new_project)

    return jsonify(new_project), 201


# Inicia o servidor Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)