import ollama from "ollama";
export async function getModels() {
  try {
    const response = await ollama.list();
    const modelNames = response.models.map((model) => model.name);
    return { models: modelNames };
  } catch (error) {
    console.error("Error fetching models:", error);
    return { models: [], error: "Failed to fetch models" };
  }
}
