import api from './auth';

export const adminService = {
  getUsers: async (page = 1, pageSize = 50) => {
    try {
      const res = await api.get('/admin/users', { params: { page, pageSize } });
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 403) {
        // maybe token held by client is stale; refresh by hitting /auth/me then retry
        await import('./auth').then(({ authService }) => authService.getCurrentUser());
        const res2 = await api.get('/admin/users', { params: { page, pageSize } });
        return res2.data;
      }
      throw err;
    }
  },

  changeUserRole: async (userId, role) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  deactivateUser: async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  }
};
