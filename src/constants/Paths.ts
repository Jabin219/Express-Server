/**
 * Express router paths go here.
 */

export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id'
  },
  Parts: {
    Base: '/parts',
    Add: '/add',
    Latest: '/latest'  // 新增获取最新零件的路径
  },
  Test: { // 添加新的 Test 路径
    Base: '/test',
    Add: '/add',
    Latest: '/latest'  // 新增获取最新零件的路径
  }
} as const
