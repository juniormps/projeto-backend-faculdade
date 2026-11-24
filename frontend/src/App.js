import { useEffect, useRef, useState } from "react";

import api from "./api";
import "./App.css";

const EMPTY_FORM = { name: "", description: "", status: "" };
const FORM_FIELDS = ["name", "description", "status"];

function getErrorMessage(error, fallback) {
  return error.response?.data?.error || fallback;
}

function summarize(description) {
  if (description.length <= 125) {
    return description;
  }

  return `${description.slice(0, 122).trimEnd()}...`;
}

function formatDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsedDate);
}

function Header({ activeScreen, onHome, onProjects, onCreate }) {
  const projectsActive = ["list", "details", "edit"].includes(activeScreen);

  return (
    <header className="site-header">
      <div className="header-content">
        <button className="brand" type="button" onClick={onHome} aria-label="Ir para o início">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Conecta Comunidade</span>
        </button>

        <nav className="main-nav" aria-label="Navegação principal">
          <button className="nav-link" type="button" onClick={onHome}>Início</button>
          <button
            className={`nav-link ${projectsActive ? "nav-link-active" : ""}`}
            type="button"
            onClick={onProjects}
          >
            Projetos
          </button>
          <button
            className={`button button-primary header-action ${activeScreen === "form" ? "button-current" : ""}`}
            type="button"
            onClick={onCreate}
          >
            Cadastrar projeto
          </button>
        </nav>
      </div>
    </header>
  );
}

function StatusBadge({ status }) {
  const statusClass = {
    Planejado: "status-planned",
    "Em andamento": "status-progress",
    Concluído: "status-finished",
  }[status];

  return <span className={`status-badge ${statusClass || ""}`}>{status}</span>;
}

function ProjectForm({ mode, initialProject, onCancel, onSuccess }) {
  const [form, setForm] = useState(() => (
    initialProject
      ? {
          name: initialProject.name,
          description: initialProject.description,
          status: initialProject.status,
        }
      : EMPTY_FORM
  ));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.getElementById("form-title")?.focus();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.description.trim()) {
      setError("Preencha o nome e a descrição do projeto.");
      return;
    }

    const normalizedForm = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    };

    if (mode === "edit") {
      const changes = {};
      FORM_FIELDS.forEach((field) => {
        if (normalizedForm[field] !== initialProject[field]) {
          changes[field] = normalizedForm[field];
        }
      });

      if (Object.keys(changes).length === 0) {
        onSuccess(initialProject, false);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await api.patch(`/projects/${initialProject._id}`, changes);
        onSuccess(response.data, true);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Não foi possível atualizar o projeto. Tente novamente."));
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/projects", normalizedForm);
      onSuccess(response.data, true);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Não foi possível cadastrar o projeto. Tente novamente."));
      setIsSubmitting(false);
    }
  }

  const isEditing = mode === "edit";

  return (
    <main className="form-page">
      <section className="form-heading" aria-labelledby="form-title">
        <h1 id="form-title" tabIndex="-1">{isEditing ? "Editar projeto" : "Cadastrar novo projeto"}</h1>
        <p>
          {isEditing
            ? "Atualize as informações da iniciativa social."
            : "Preencha as informações abaixo para incluir uma nova iniciativa social."}
        </p>
      </section>

      <form className="project-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="message message-error" role="alert">{error}</div>}

        <div className="field-group">
          <label htmlFor="project-name">Nome do projeto</label>
          <input
            id="project-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Ex.: Horta Comunitária"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="project-description">Descrição</label>
          <textarea
            id="project-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descreva o objetivo e as principais ações do projeto"
            rows="5"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="project-status">Status</label>
          <select id="project-status" name="status" value={form.status} onChange={handleChange}>
            {!isEditing && <option value="">Selecione uma opção</option>}
            <option value="Planejado">Planejado</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>

        <p className="required-note">* Nome e descrição são campos obrigatórios.</p>

        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar projeto"}
          </button>
        </div>
      </form>
    </main>
  );
}

function ProjectList({ projects, loading, error, notice, onCreate, onDetails }) {
  return (
    <main>
      <section className="hero" id="inicio">
        <div className="page-width hero-content">
          <div className="hero-copy">
            <h1 id="hero-title" tabIndex="-1">Projetos sociais que transformam comunidades</h1>
            <p>
              Conheça iniciativas locais, acompanhe suas ações e ajude a fortalecer
              projetos que fazem a diferença todos os dias.
            </p>
            <button className="button button-primary hero-button" type="button" onClick={onCreate}>
              Cadastrar novo projeto
            </button>
          </div>

          <div className="hero-art" aria-hidden="true">
            <span className="art-block art-light" />
            <span className="art-block art-main" />
            <span className="art-block art-soft" />
          </div>
        </div>
      </section>

      <section className="projects-section page-width" id="projetos" aria-labelledby="projects-title">
        <div className="section-heading">
          <h2 id="projects-title" tabIndex="-1">Projetos cadastrados</h2>
          <p>Explore as iniciativas desenvolvidas pela organização.</p>
        </div>

        {notice && <div className="message message-success" role="status">{notice}</div>}
        {loading && <div className="state-card" role="status">Carregando projetos...</div>}
        {!loading && error && <div className="state-card state-error" role="alert">{error}</div>}
        {!loading && !error && projects.length === 0 && (
          <div className="state-card">Nenhum projeto cadastrado até o momento.</div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project._id}>
                <div className="card-topline">
                  <span className="project-symbol" aria-hidden="true"><span /></span>
                  <StatusBadge status={project.status} />
                </div>
                <div className="card-content">
                  <h3>{project.name}</h3>
                  <p>{summarize(project.description)}</p>
                  <button className="button button-outline card-button" type="button" onClick={() => onDetails(project._id)}>
                    Ver detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DeleteDialog({ projectName, isDeleting, onCancel, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const firstButton = dialogRef.current?.querySelector("button");
    firstButton?.focus();

    return () => previouslyFocused?.focus();
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Escape" && !isDeleting) {
      onCancel();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const buttons = Array.from(dialogRef.current.querySelectorAll("button:not(:disabled)"));
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <h2 id="dialog-title">Excluir projeto?</h2>
        <p>
          Tem certeza de que deseja excluir <strong>{projectName}</strong>? Esta ação não poderá ser desfeita.
        </p>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="button button-danger-filled" type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProjectDetails({ project, loading, error, notice, onBack, onEdit, onDeleted }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && project) {
      document.getElementById("detail-title")?.focus();
    }
  }, [loading, project]);

  async function handleDelete() {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${project._id}`);
      onDeleted();
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError, "Não foi possível excluir o projeto. Tente novamente."));
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <main className="details-page page-width">
      <button className="back-link" type="button" onClick={onBack}>‹ Voltar para projetos</button>

      {loading && <div className="state-card details-state" role="status">Carregando projeto...</div>}
      {!loading && error && (
        <div className="state-card state-error details-state" role="alert">
          <h1>Projeto não disponível</h1>
          <p>{error}</p>
          <button className="button button-outline" type="button" onClick={onBack}>Voltar para projetos</button>
        </div>
      )}

      {!loading && !error && project && (
        <>
          {notice && <div className="message message-success details-message" role="status">{notice}</div>}
          {deleteError && <div className="message message-error details-message" role="alert">{deleteError}</div>}

          <article className="details-card">
            <header className="details-header">
              <span className="details-symbol" aria-hidden="true"><span /></span>
              <div>
                <h1 id="detail-title" tabIndex="-1">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
            </header>

            <div className="details-body">
              <section className="details-description" aria-labelledby="about-title">
                <h2 id="about-title">Sobre o projeto</h2>
                <p>{project.description}</p>
              </section>

              <aside className="project-info" aria-labelledby="info-title">
                <h2 id="info-title">Informações</h2>
                <dl>
                  <div>
                    <dt>Status</dt>
                    <dd className="info-status">{project.status}</dd>
                  </div>
                  <div>
                    <dt>Identificador</dt>
                    <dd className="project-id">{project._id}</dd>
                  </div>
                  <div>
                    <dt>Última atualização</dt>
                    <dd>{formatDate(project.updated_at)}</dd>
                  </div>
                </dl>
              </aside>
            </div>

            <footer className="details-actions">
              <button className="button button-danger" type="button" onClick={() => setShowDeleteDialog(true)}>
                Excluir projeto
              </button>
              <button className="button button-primary" type="button" onClick={onEdit}>
                Editar projeto
              </button>
            </footer>
          </article>

          {showDeleteDialog && (
            <DeleteDialog
              projectName={project.name}
              isDeleting={isDeleting}
              onCancel={() => setShowDeleteDialog(false)}
              onConfirm={handleDelete}
            />
          )}
        </>
      )}
    </main>
  );
}

function Footer() {
  return <footer className="site-footer page-width">Conecta Comunidade • Projetos sociais locais</footer>;
}

function App() {
  const [screen, setScreen] = useState({ name: "list" });
  const [projects, setProjects] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listNotice, setListNotice] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [project, setProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailNotice, setDetailNotice] = useState("");

  useEffect(() => {
    if (screen.name !== "list") {
      return undefined;
    }

    const controller = new AbortController();
    setListLoading(true);
    setListError("");

    api.get("/projects", { signal: controller.signal })
      .then((response) => setProjects(response.data))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setListError("Não foi possível carregar os projetos. Verifique a conexão com a API.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setListLoading(false);
        }
      });

    return () => controller.abort();
  }, [screen.name, listVersion]);

  useEffect(() => {
    if (screen.name !== "details") {
      return undefined;
    }

    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError("");

    api.get(`/projects/${screen.id}`, { signal: controller.signal })
      .then((response) => setProject(response.data))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setProject(null);
          setDetailError(
            requestError.response?.status === 404
              ? "O projeto solicitado não foi encontrado."
              : "Não foi possível carregar os detalhes. Verifique a conexão com a API.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [screen]);

  function navigateToList(section = "projetos", notice = "") {
    if (screen.name !== "list") {
      setListLoading(true);
    }
    setListNotice(notice);
    setScreen({ name: "list" });
    window.setTimeout(() => {
      const destination = document.getElementById(section);
      destination?.scrollIntoView({ block: "start" });
      document.getElementById(section === "inicio" ? "hero-title" : "projects-title")?.focus({ preventScroll: true });
    }, 0);
  }

  function navigateToDetails(id, notice = "") {
    setProject(null);
    setDetailLoading(true);
    setDetailNotice(notice);
    setScreen({ name: "details", id });
    window.scrollTo({ top: 0 });
  }

  function navigateToCreate() {
    setListNotice("");
    setScreen({ name: "form" });
    window.scrollTo({ top: 0 });
  }

  function handleCreateSuccess(createdProject) {
    setProjects((currentProjects) => [...currentProjects, createdProject]);
    setListVersion((version) => version + 1);
    navigateToList("projetos", "Projeto cadastrado com sucesso.");
  }

  function handleEditSuccess(updatedProject, changed) {
    navigateToDetails(
      updatedProject._id,
      changed ? "Projeto atualizado com sucesso." : "Nenhuma alteração foi necessária.",
    );
  }

  function handleDeleted() {
    setProjects((currentProjects) => currentProjects.filter(({ _id }) => _id !== project._id));
    setListVersion((version) => version + 1);
    navigateToList("projetos", "Projeto excluído com sucesso.");
  }

  return (
    <div className="app-shell">
      <Header
        activeScreen={screen.name}
        onHome={() => navigateToList("inicio")}
        onProjects={() => navigateToList("projetos")}
        onCreate={navigateToCreate}
      />

      {screen.name === "list" && (
        <ProjectList
          projects={projects}
          loading={listLoading}
          error={listError}
          notice={listNotice}
          onCreate={navigateToCreate}
          onDetails={(id) => navigateToDetails(id)}
        />
      )}

      {screen.name === "form" && (
        <ProjectForm
          mode="create"
          onCancel={() => navigateToList("projetos")}
          onSuccess={handleCreateSuccess}
        />
      )}

      {screen.name === "details" && (
        <ProjectDetails
          project={project}
          loading={detailLoading}
          error={detailError}
          notice={detailNotice}
          onBack={() => navigateToList("projetos")}
          onEdit={() => {
            setDetailNotice("");
            setScreen({ name: "edit", id: project._id });
          }}
          onDeleted={handleDeleted}
        />
      )}

      {screen.name === "edit" && project && (
        <ProjectForm
          mode="edit"
          initialProject={project}
          onCancel={() => navigateToDetails(project._id)}
          onSuccess={handleEditSuccess}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
