import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { blogApi } from "../services/blogApi";
import { blogPosts as fallbackPosts } from "../data/blog";
import { toast } from "sonner";

// ==================== QUERY KEYS ====================

export const blogKeys = {
  all: ["blogs"],
  lists: () => [...blogKeys.all, "list"],
  list: (filters) => [...blogKeys.lists(), filters],
  details: () => [...blogKeys.all, "detail"],
  detail: (slug) => [...blogKeys.details(), slug],
  comments: (blogId) => [...blogKeys.all, "comments", blogId],
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeFallbackBlog = (post) => {
  if (!post) return null;
  const slug = post.slug || String(post.id || post._id);

  return {
    ...post,
    _id: post._id || String(post.id || slug),
    slug,
    subTitle: post.subTitle || post.excerpt || "",
    description: post.description || post.content || "",
    excerpt: post.excerpt || post.subTitle || stripHtml(post.description || post.content),
    createdAt: post.createdAt || post.publishedAt || post.date,
    likes: post.likes || 0,
    views: post.views || 0,
    comments: post.comments || 0,
  };
};

const findFallbackBlog = (slug) => {
  if (!slug) return null;
  const slugValue = String(slug);
  const post = fallbackPosts.find((item) => {
    const itemSlug = item.slug || String(item.id || item._id);
    return itemSlug === slugValue || String(item.id) === slugValue || String(item._id) === slugValue;
  });
  return normalizeFallbackBlog(post);
};

// ==================== BLOG QUERIES ====================


export const useBlogs = (params = {}, options = {}) => {
  const { page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: blogKeys.list({ page, limit }),
    queryFn: () => blogApi.getAll({ page, limit }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};


export const useInfiniteBlogs = (params = {}, options = {}) => {
  const { limit = 10 } = params;

  return useInfiniteQuery({
    queryKey: blogKeys.list({ infinite: true, limit }),
    queryFn: ({ pageParam = 1 }) => blogApi.getAll({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.pagination?.hasPrevPage) {
        return firstPage.pagination.currentPage - 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};


export const useBlog = (slug, options = {}) => {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: async () => {
      try {
        const blog = await blogApi.getBySlug(slug);
        return blog || findFallbackBlog(slug);
      } catch (error) {
        const fallback = findFallbackBlog(slug);
        if (fallback) return fallback;
        throw error;
      }
    },
    enabled: !!slug, // Only fetch if slug is provided
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    ...options,
  });
};

export const useSubscribeToBlog = (options = {}) => {
  return useMutation({
    mutationFn: (data) => blogApi.subscribe(data),
    onSuccess: (data) => {
      toast.success(data.message || "Subscribed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to subscribe");
    },
    ...options,
  });
};


export const useBlogComments = (blogId, options = {}) => {
  return useQuery({
    queryKey: blogKeys.comments(blogId),
    queryFn: () => blogApi.getComments(blogId),
    enabled: !!blogId,
    staleTime: 2 * 60 * 1000, // 2 minutes (comments change more frequently)
    ...options,
  });
};


export const useAddComment = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => blogApi.addComment(data),
    onSuccess: (data, variables) => {
      // Invalidate comments for this blog
      queryClient.invalidateQueries({
        queryKey: blogKeys.comments(variables.blogId),
      });
      toast.success(data.message || "Comment added successfully");
    },
    onError: (error) => {
      console.error("Add comment error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Failed to add comment"
      );
    },
    ...options,
  });
};


export const usePrefetchBlog = () => {
  const queryClient = useQueryClient();

  return (slug) => {
    if (!slug) return;

    queryClient.prefetchQuery({
      queryKey: blogKeys.detail(slug),
      queryFn: () => blogApi.getBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  };
};


export const usePrefetchComments = () => {
  const queryClient = useQueryClient();

  return (blogId) => {
    if (!blogId) return;

    queryClient.prefetchQuery({
      queryKey: blogKeys.comments(blogId),
      queryFn: () => blogApi.getComments(blogId),
      staleTime: 2 * 60 * 1000,
    });
  };
};

// ==================== UTILITY HOOKS ====================


export const useCachedBlog = (slug) => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(blogKeys.detail(slug));
};

export const useInvalidateBlogs = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    invalidateList: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
    },
    invalidateBlog: (slug) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(slug) });
    },
    invalidateComments: (blogId) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.comments(blogId) });
    },
  };
};
