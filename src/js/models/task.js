import { makeRequest, getURL } from "../http.js";

export class Task {
  organizationId;
  name;
  description;
  createdAt;
  status;
  type;
  candidates;

  async create() {
    const data = {
      organizationId: this.organizationId,
      name: this.name,
      description: this.description,
      createdAt: new Date(),
      status: "aberta",
      type: this.type,
      searchData: this.name + " " + this.description,
      candidates: [],
    };

    return await makeRequest(getURL("tasks"), "POST", data);
  }

  async findById(id) {
    return await makeRequest(getURL(`tasks/${id}`), "GET");
  }

  async findByOrganizationId(organizationId) {
    return await makeRequest(
      getURL(`tasks?organizationId=${organizationId}`),
      "GET"
    );
  }

  async findByCandidateId(candidateId) {
    const tasks = await makeRequest(getURL(`tasks`), "GET");
    return tasks.filter((task) => task.candidates.includes(candidateId));
  }

  async findAll() {
    return await makeRequest(getURL("tasks"), "GET");
  }

  async findAllFilteredByOpenStatus(filterBy) {
    if (filterBy === "remote") {
      return await makeRequest(
        getURL("tasks?status=aberta&type=remoto"),
        "GET"
      );
    }
    if (filterBy === "on-site") {
      return await makeRequest(
        getURL("tasks?status=aberta&type=presencial"),
        "GET"
      );
    }
    return await makeRequest(getURL("tasks?status=aberta"), "GET");
  }

  async findAllFilteredByType(filterBy) {
    if (filterBy === "remote") {
      return await makeRequest(getURL("tasks?type=remoto"), "GET");
    }
    if (filterBy === "on-site") {
      return await makeRequest(getURL("tasks?type=presencial"), "GET");
    }
    return await makeRequest(getURL("tasks"), "GET");
  }

  async findAllFilteredByStatus(filterBy) {
    if (filterBy === "remote") {
      return await makeRequest(getURL("tasks?status=aberta"), "GET");
    }
    if (filterBy === "on-site") {
      return await makeRequest(getURL("tasks?status=finalizada"), "GET");
    }
    return await makeRequest(getURL("tasks"), "GET");
  }

  async updateById(id) {
    const data = {
      organizationId: this.organizationId,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      status: this.status,
      type: this.type,
      searchData: this.name + " " + this.description,
      candidates: this.candidates,
    };

    return await makeRequest(getURL(`tasks/${id}`), "PUT", data);
  }

  async updateStatusById(id, newStatus) {
    const data = {
      status: newStatus,
    };

    return await makeRequest(getURL(`tasks/${id}`), "PATCH", data);
  }

  async updateCandidatesById(id, candidates) {
    const data = {
      candidates,
    };

    return await makeRequest(getURL(`tasks/${id}`), "PATCH", data);
  }

  async removeCandidateById(taskId, candidateId) {
    // Encontra a tarefa pelo ID
    const task = await this.findById(taskId);

    // Verifica se os candidatos existem e remove o candidato especificado
    if (task.candidates && task.candidates.includes(candidateId)) {
      task.candidates = task.candidates.filter((id) => id !== candidateId);

      // Atualiza a lista de candidatos na tarefa
      await this.updateCandidatesById(taskId, task.candidates);
    } else {
      throw new Error("Candidato não encontrado na tarefa.");
    }
  }

  async deleteById(id) {
    return await makeRequest(getURL(`tasks/${id}`), "DELETE");
  }
}

export async function findById(id) {
  return await makeRequest(getURL(`tasks/${id}`), "GET");
}

export async function findRecentTasks(limit) {
  return await makeRequest(
    getURL(`tasks?status=aberta&_sort=createdAt&_order=desc&_limit=${limit}`),
    "GET"
  );
}
