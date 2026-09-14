// 测试目标由环境变量驱动 —— 开源仓库不含任何部署特定 ID。
// 先跑 zentao_context / zentao_profile 看你的部署有哪些产品，然后：
//   export ZENTAO_TEST_PRODUCT_ID=<产品ID>          （必填）
//   export ZENTAO_TEST_PRODUCT_NAME=<产品名>        （可选，用于自然语言用例的 prompt）
//   export ZENTAO_TEST_ASSIGNEE=<账号>              （可选；不设则指派相关用例自动跳过）
//   export ZENTAO_TEST_QUERY_TITLE=<保存查询标题>   （可选；不设则 saved-query 用例跳过）
//   export ZENTAO_TEST_KEYWORD=<标题关键词>         （可选；不设则关键词搜索用例跳过）
export function loadTestEnv() {
  const productID = Number(process.env.ZENTAO_TEST_PRODUCT_ID || 0);
  if (!productID) {
    console.error('ZENTAO_TEST_PRODUCT_ID 未设置。请先调用 zentao_context（或查看 ~/.local/share/zentao-legacy-mcp/profile.json）确认产品列表，再 export ZENTAO_TEST_PRODUCT_ID=<id> 后运行测试。');
    process.exit(2);
  }
  return {
    productID,
    productName: process.env.ZENTAO_TEST_PRODUCT_NAME || '',
    assignee: process.env.ZENTAO_TEST_ASSIGNEE || '',
    queryTitle: process.env.ZENTAO_TEST_QUERY_TITLE || '',
    keyword: process.env.ZENTAO_TEST_KEYWORD || ''
  };
}
