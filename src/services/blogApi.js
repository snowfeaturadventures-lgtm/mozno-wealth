import apiClient from "../api/axios.instance";

// ==================== BLOG API SERVICES ====================

export const blogApi = {
  // Get all blogs with pagination
  getAll: async (params = {}) => {
    const { page = 1, limit = 10 } = params;
    const response = await apiClient.get("/blogs", {
      params: { page, limit },
    });
    return response;
  },

  // Get single blog by slug
  getBySlug: async (slug) => {
    if (!slug) throw new Error("Slug is required");
    const response = await apiClient.get(`/blogs/${slug}`);
    return response.blog;
  },

  // Get comments for a blog
  getComments: async (blogId) => {
    if (!blogId) throw new Error("Blog ID is required");
    // Make sure the URL matches your backend route
    const response = await apiClient.get(`/blogs/comments/${blogId}`);
    return response;
  },

  // Add comment to a blog
  addComment: async (data) => {
    const response = await apiClient.post("/blogs/add-comment", data);
    return response.data;
  },

  // Newsletter endpoint is not available on the current deployed API.
  // Keep this helper centralized so a future backend route can be enabled here.
  subscribe: async ({ email, source, blogId, blogSlug }) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Email is required");

    const storageKey = "mozno_blog_subscribers";
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const alreadySubscribed = existing.some(
      (entry) => entry.email === normalizedEmail,
    );

    if (alreadySubscribed) {
      return {
        success: true,
        message: "You are already subscribed.",
        duplicate: true,
      };
    }

    const subscription = {
      email: normalizedEmail,
      source,
      blogId,
      blogSlug,
      createdAt: new Date().toISOString(),
      syncStatus: "pending_backend_endpoint",
    };

    localStorage.setItem(
      storageKey,
      JSON.stringify([...existing, subscription]),
    );

    return {
      success: true,
      message: "Subscription saved. We will keep you posted.",
      subscription,
    };
  },
};


export default blogApi;
