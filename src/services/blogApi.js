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

  // Subscribe to newsletter. Backend must enforce duplicate email prevention.
  subscribe: async ({ email, source, blogId, blogSlug }) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Email is required");

    const response = await apiClient.post("/newsletter/subscribe", {
      email: normalizedEmail,
      source,
      blogId,
      blogSlug,
    });

    return response;
  },

  // Toggle/persist a blog like in the backend.
  likeBlog: async ({ blogId }) => {
    if (!blogId) throw new Error("Blog ID is required");
    const response = await apiClient.post(`/blogs/${blogId}/like`);
    return response;
  },

  // Track a view in the backend. Server should de-dupe by visitor/session.
  trackView: async ({ blogId, slug }) => {
    if (!blogId && !slug) throw new Error("Blog ID or slug is required");
    const response = await apiClient.post(`/blogs/${blogId || slug}/view`, {
      slug,
    });
    return response;
  },
};


export default blogApi;
