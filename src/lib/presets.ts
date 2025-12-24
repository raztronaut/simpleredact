// Presets API client

const getAuthURL = () => import.meta.env.VITE_AUTH_URL || "http://localhost:3000";

export interface Preset {
    id: string;
    name: string;
    categories: string[];
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export const presetsApi = {
    // List all presets for the current user
    list: async (): Promise<Preset[]> => {
        const res = await fetch(`${getAuthURL()}/api/presets`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch presets");
        return res.json();
    },

    // Create a new preset
    create: async (data: { name: string; categories: string[] }): Promise<Preset> => {
        const res = await fetch(`${getAuthURL()}/api/presets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create preset");
        return res.json();
    },

    // Update a preset
    update: async (id: string, data: { name?: string; categories?: string[] }): Promise<void> => {
        const res = await fetch(`${getAuthURL()}/api/presets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update preset");
    },

    // Delete a preset
    delete: async (id: string): Promise<void> => {
        const res = await fetch(`${getAuthURL()}/api/presets/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to delete preset");
    },
};
