# 获取Bug详情

GET/bugs/:bugID

##  获取Bug详情 

### 请求URL
https://xxx.com/api.php/v2/bugs/:bugID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  bug  object  Bug 
|     ∟  id  string  Bug编号 
|     ∟  project  string  所属项目 
|     ∟  product  string  所属产品 
|     ∟  injection  string  
|     ∟  identify  string  
|     ∟  branch  string  平台/分支 
|     ∟  module  string  所属模块 
|     ∟  execution  string  所属执行 
|     ∟  plan  string  所属计划 
|     ∟  story  string  相关需求 
|     ∟  storyVersion  string  用户故事版本 
|     ∟  task  string  相关任务 
|     ∟  toTask  string  转任务 
|     ∟  toStory  string  转用户故事 
|     ∟  title  string  Bug标题 
|     ∟  keywords  string  关键词 
|     ∟  severity  string  严重程度 
|     ∟  pri  string  优先级 
|     ∟  type  string  Bug类型 
|     ∟  os  string  操作系统 
|     ∟  browser  string  浏览器 
|     ∟  hardware  string  硬件 
|     ∟  found  string  
|     ∟  steps  string  重现步骤 
|     ∟  status  string  Bug状态 
|     ∟  subStatus  string  子状态 
|     ∟  color  string  标题颜色 
|     ∟  confirmed  string  是否确认 
|     ∟  activatedCount  string  激活次数 
|     ∟  activatedDate  string  激活时间 
|     ∟  feedbackBy  string  反馈者 
|     ∟  notifyEmail  string  通知邮箱 
|     ∟  mailto  string  抄送给 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建日期 
|     ∟  openedBuild  string  影响版本 
|     ∟  assignedTo  string  指派给 
|     ∟  assignedDate  string  指派日期 
|     ∟  deadline  string  截止日期 
|     ∟  resolvedBy  string  解决者 
|     ∟  resolution  string  解决方案 
|     ∟  resolvedBuild  string  解决版本 
|     ∟  resolvedDate  string  解决日期 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  string  关闭日期 
|     ∟  duplicateBug  string  重复Bug 
|     ∟  relatedBug  string  相关Bug 
|     ∟  case  string  相关用例 
|     ∟  caseVersion  string  用例版本 
|     ∟  feedback  string  
|     ∟  result  string  结果 
|     ∟  repo  string  所属版本库 
|     ∟  mr  string  合并请求 
|     ∟  entry  string  代码路径 
|     ∟  lines  string  代码行 
|     ∟  v1  string  版本1 
|     ∟  v2  string  版本2 
|     ∟  repoType  string  版本库类型 
|     ∟  issueKey  string  Sonarqube问题键值 
|     ∟  testtask  string  测试单 
|     ∟  lastEditedBy  string  最后修改者 
|     ∟  lastEditedDate  string  修改日期 
|     ∟  deleted  string  已删除 
|     ∟  executionName  string  
|     ∟  storyTitle  string  
|     ∟  storyStatus  string  
|     ∟  latestStoryVersion  string  
|     ∟  taskName  string  
|     ∟  planName  string  
|     ∟  projectName  string  
|     ∟  injectionTitle  string  
|     ∟  identifyTitle  string  
|     ∟  linkMRTitles  array  
|     ∟  toCases  array  
|     ∟  files  array  附件

### 响应示例

```
{
    "status": "success",
    "bug": {
        "id": "1",
        "project": "2",
        "product": "1",
        "injection": "",
        "identify": "",
        "branch": "0",
        "module": "0",
        "execution": "3",
        "plan": "0",
        "story": "0",
        "storyVersion": "0",
        "task": "0",
        "toTask": "0",
        "toStory": "0",
        "title": "光敏元件显示错误",
        "keywords": "",
        "severity": "3",
        "pri": "3",
        "type": "codeerror",
        "os": "",
        "browser": "",
        "hardware": "",
        "found": "",
        "steps": "[步骤] [结果] [期望]",
        "status": "active",
        "subStatus": "",
        "color": "",
        "confirmed": "0",
        "activatedCount": "0",
        "activatedDate": "",
        "feedbackBy": "",
        "notifyEmail": "",
        "mailto": "",
        "openedBy": "admin",
        "openedDate": "2026-03-25 09:11:34",
        "openedBuild": "trunk",
        "assignedTo": "productManager",
        "assignedDate": "2026-03-25 09:11:34",
        "deadline": "",
        "resolvedBy": "",
        "resolution": "",
        "resolvedBuild": "",
        "resolvedDate": "",
        "closedBy": "",
        "closedDate": "",
        "duplicateBug": "0",
        "relatedBug": "",
        "case": "0",
        "caseVersion": "0",
        "feedback": "0",
        "result": "0",
        "repo": "0",
        "mr": "0",
        "entry": "",
        "lines": "",
        "v1": "",
        "v2": "",
        "repoType": "",
        "issueKey": "",
        "testtask": "0",
        "lastEditedBy": "admin",
        "lastEditedDate": "2026-03-25 09:11:35",
        "deleted": "0",
        "executionName": "智能设备研发3.2版本开发",
        "storyTitle": "",
        "storyStatus": "",
        "latestStoryVersion": "",
        "taskName": "",
        "planName": "",
        "projectName": "智能设备研发",
        "injectionTitle": "",
        "identifyTitle": "",
        "linkMRTitles": [],
        "toCases": [],
        "files": []
    }
}
```
