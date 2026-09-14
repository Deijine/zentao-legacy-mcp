# 获取产品列表

GET/products

##  获取产品列表 

### 请求URL
https://xxx.com/api.php/v2/products

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  all 全部 | noclosed 未关闭 | closed 已结束 
|  orderBy  否  排序(id_asc | title_asc 名称 | begin_asc 计划开始 | end_asc 计划结束)，倒序使用id_desc, title_desc, begin_desc, end_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  products  array  产品 
|     ∟  id  string  编号 
|     ∟  program  string  所属项目集 
|     ∟  name  string  产品名称 
|     ∟  code  string  产品代号 
|     ∟  shadow  string  是否影子产品 
|     ∟  bind  string  是否独立产品 
|     ∟  line  string  产品线 
|     ∟  type  string  产品类型 
|     ∟  status  string  状态 
|     ∟  subStatus  string  子状态 
|     ∟  desc  string  产品描述 
|     ∟  PO  string  产品负责人 
|     ∟  QD  string  测试负责人 
|     ∟  RD  string  发布负责人 
|     ∟  feedback  string  反馈负责人 
|     ∟  ticket  string  工单负责人 
|     ∟  workflowGroup  string  
|     ∟  acl  string  访问控制 
|     ∟  groups  string  权限组 
|     ∟  whitelist  string  白名单 
|     ∟  reviewer  string  评审人 
|     ∟  PMT  string  
|     ∟  draftEpics  string  草稿史诗 
|     ∟  activeEpics  string  激活史诗 
|     ∟  changingEpics  string  变更中史诗 
|     ∟  reviewingEpics  string  评审中史诗 
|     ∟  finishedEpics  string  已完成史诗 
|     ∟  closedEpics  string  已关闭史诗 
|     ∟  totalEpics  string  史诗数 
|     ∟  draftRequirements  string  草稿用户需求 
|     ∟  activeRequirements  string  激活用户需求 
|     ∟  changingRequirements  string  变更中用户需求 
|     ∟  reviewingRequirements  string  评审中用户需求 
|     ∟  finishedRequirements  string  已完成用户需求 
|     ∟  closedRequirements  string  已关闭用户需求 
|     ∟  totalRequirements  string  用户需求数 
|     ∟  draftStories  string  草稿用户故事 
|     ∟  activeStories  string  激活用户故事 
|     ∟  changingStories  string  变更中用户故事 
|     ∟  reviewingStories  string  评审中用户故事 
|     ∟  finishedStories  string  已完成用户故事 
|     ∟  closedStories  string  已关闭用户故事 
|     ∟  totalStories  string  用户故事数 
|     ∟  unresolvedBugs  string  未解决Bug 
|     ∟  closedBugs  string  关闭Bug 
|     ∟  fixedBugs  string  已修复Bug 
|     ∟  totalBugs  string  Bug总数 
|     ∟  plans  string  计划数 
|     ∟  releases  string  发布数 
|     ∟  createdBy  string  由谁创建 
|     ∟  createdDate  string  创建日期 
|     ∟  createdVersion  string  创建版本 
|     ∟  closedDate  string  关闭日期 
|     ∟  order  string  排序 
|     ∟  vision  string  所属界面 
|     ∟  deleted  string  已删除 
|     ∟  lineName  string  产品线名称 
|     ∟  programName  string  
|     ∟  programPM  string  
|     ∟  finishClosedStories  int  
|     ∟  launchedStories  int  
|     ∟  developingStories  int  
|     ∟  projects  int  关联项目数 
|     ∟  executions  int  关联执行数 
|     ∟  coverage  int  
|     ∟  latestRelease  string  最新发布 
|     ∟  latestReleaseDate  string  最新发布时间 
|     ∟  productLine  string  
|     ∟  testCaseCoverage  int  用例覆盖率 
|     ∟  epicCompleteRate  int  史诗完成率 
|     ∟  requirementCompleteRate  int  用户需求完成率 
|     ∟  storyCompleteRate  int  用户故事完成率 
|     ∟  bugFixedRate  int  修复率

### 响应示例

```
{
    "status": "success",
    "products": [
        {
            "id": "1",
            "program": "1",
            "name": "智能照明",
            "code": "",
            "shadow": "0",
            "bind": "0",
            "line": "0",
            "type": "product",
            "status": "normal",
            "subStatus": "",
            "desc": "智能家庭照明",
            "PO": "normal",
            "QD": "productManager",
            "RD": "productManager",
            "feedback": "",
            "ticket": "",
            "workflowGroup": "0",
            "acl": "open",
            "groups": "",
            "whitelist": "",
            "reviewer": "productManager",
            "PMT": "",
            "draftEpics": "0",
            "activeEpics": "0",
            "changingEpics": "0",
            "reviewingEpics": "0",
            "finishedEpics": "0",
            "closedEpics": "0",
            "totalEpics": "0",
            "draftRequirements": "0",
            "activeRequirements": "0",
            "changingRequirements": "0",
            "reviewingRequirements": "0",
            "finishedRequirements": "0",
            "closedRequirements": "0",
            "totalRequirements": "0",
            "draftStories": "0",
            "activeStories": "0",
            "changingStories": "0",
            "reviewingStories": "0",
            "finishedStories": "0",
            "closedStories": "0",
            "totalStories": "0",
            "unresolvedBugs": "0",
            "closedBugs": "0",
            "fixedBugs": "0",
            "totalBugs": "0",
            "plans": "0",
            "releases": "0",
            "createdBy": "admin",
            "createdDate": "2026-03-25",
            "createdVersion": "ipd5.0",
            "closedDate": "",
            "order": "5",
            "vision": "rnd",
            "deleted": "0",
            "lineName": "",
            "programName": "智能家居",
            "programPM": "productManager",
            "finishClosedStories": 0,
            "launchedStories": 0,
            "developingStories": 0,
            "projects": 0,
            "executions": 0,
            "coverage": 0,
            "latestRelease": "",
            "latestReleaseDate": "",
            "productLine": "",
            "testCaseCoverage": 0,
            "epicCompleteRate": 0,
            "requirementCompleteRate": 0,
            "storyCompleteRate": 0,
            "bugFixedRate": 0
        }
    ]
}
```
