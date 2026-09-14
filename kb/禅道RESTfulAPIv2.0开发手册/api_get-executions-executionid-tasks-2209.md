# 获取执行任务列表

GET/executions/:executionID/tasks

##  获取执行任务列表 

### 请求URL
https://xxx.com/api.php/v2/executions/:executionID/tasks

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  status  否  状态，默认是unclosed。(all 全部 | unclosed 未关闭 | assignedtome 指派给我 | assignedtome 指派给我 | myinvolved 由我参与 | assignedbyme 由我指派) 
|  orderBy  否  排序(id_asc | name_asc 名称 | status_asc 状态)，倒序使用id_desc, name_desc, status_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  tasks  array  任务 
|     ∟  id  string  编号 
|     ∟  project  string  所属项目 
|     ∟  parent  string  父任务 
|     ∟  isParent  string  是父任务 
|     ∟  isTpl  string  是模板 
|     ∟  path  string  路径 
|     ∟  execution  string  所属执行 
|     ∟  module  string  所属模块 
|     ∟  design  string  相关设计 
|     ∟  story  string  相关用户故事 
|     ∟  storyVersion  string  用户故事版本 
|     ∟  designVersion  string  设计版本 
|     ∟  fromBug  string  来源Bug 
|     ∟  feedback  string  
|     ∟  fromIssue  string  来源问题 
|     ∟  docs  string  
|     ∟  docVersions  string  
|     ∟  name  string  任务名称 
|     ∟  type  string  任务类型 
|     ∟  mode  string  任务模式 
|     ∟  pri  string  优先级 
|     ∟  estimate  string  最初预计 
|     ∟  consumed  string  总计消耗 
|     ∟  left  string  预计剩余 
|     ∟  deadline  string  截止日期 
|     ∟  status  string  任务状态 
|     ∟  subStatus  string  子状态 
|     ∟  color  string  标题颜色 
|     ∟  mailto  string  抄送给 
|     ∟  keywords  string  关键词 
|     ∟  desc  string  任务描述 
|     ∟  version  string  版本 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建日期 
|     ∟  assignedTo  string  指派给 
|     ∟  assignedDate  string  指派日期 
|     ∟  estStarted  string  预计开始 
|     ∟  realStarted  NULL  实际开始 
|     ∟  finishedBy  string  由谁完成 
|     ∟  finishedDate  NULL  实际完成 
|     ∟  finishedList  string  完成者列表 
|     ∟  canceledBy  string  由谁取消 
|     ∟  canceledDate  NULL  取消时间 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  NULL  关闭时间 
|     ∟  planDuration  string  计划持续天数 
|     ∟  realDuration  string  实际持续天数 
|     ∟  closedReason  string  关闭原因 
|     ∟  lastEditedBy  string  最后修改 
|     ∟  lastEditedDate  string  最后修改日期 
|     ∟  activatedDate  NULL  激活日期 
|     ∟  order  string  排序 
|     ∟  repo  string  所属代码库 
|     ∟  mr  string  合并请求 
|     ∟  entry  string  代码路径 
|     ∟  lines  string  代码行 
|     ∟  v1  string  版本1 
|     ∟  v2  string  版本2 
|     ∟  vision  string  所属界面 
|     ∟  deleted  string  已删除 
|     ∟  storyID  string  
|     ∟  storyTitle  string  
|     ∟  product  string  
|     ∟  branch  string  
|     ∟  latestStoryVersion  string  
|     ∟  storyStatus  string  
|     ∟  priOrder  string  
|     ∟  statusOrder  string  
|     ∟  designName  string  
|     ∟  latestDesignVersion  string  
|     ∟  assignedToRealName  string  
|     ∟  delay  int  
|     ∟  needConfirm  boolean  
|     ∟  productType  string  
|     ∟  cases  array  
|     ∟  progress  int  进度 
|     ∟  rawParent  string  
|     ∟  confirmeObject  array  
|     ∟  URs  string  
|     ∟  relatedObject  int  

### 响应示例

```
{
    "status": "success",
    "tasks": [
        {
            "id": "1",
            "project": "2",
            "parent": "0",
            "isParent": "0",
            "isTpl": "0",
            "path": ",1,",
            "execution": "3",
            "module": "1",
            "design": "0",
            "story": "1",
            "storyVersion": "2",
            "designVersion": "1",
            "fromBug": "0",
            "feedback": "0",
            "fromIssue": "0",
            "docs": "",
            "docVersions": "[]",
            "name": "开发电容光敏监测模块",
            "type": "devel",
            "mode": "",
            "pri": "1",
            "estimate": "1.00",
            "consumed": "0.00",
            "left": "1.00",
            "deadline": "2025-12-30",
            "status": "wait",
            "subStatus": "",
            "color": "",
            "mailto": "",
            "keywords": "",
            "desc": "",
            "version": "2",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:38",
            "assignedTo": "admin",
            "assignedDate": "2026-03-25 09:11:39",
            "estStarted": "2025-12-25",
            "realStarted": null,
            "finishedBy": "",
            "finishedDate": null,
            "finishedList": "",
            "canceledBy": "",
            "canceledDate": null,
            "closedBy": "",
            "closedDate": null,
            "planDuration": "4",
            "realDuration": "0",
            "closedReason": "",
            "lastEditedBy": "admin",
            "lastEditedDate": "2026-03-25 09:11:39",
            "activatedDate": null,
            "order": "0",
            "repo": "0",
            "mr": "0",
            "entry": "",
            "lines": "",
            "v1": "",
            "v2": "",
            "vision": "rnd",
            "deleted": "0",
            "storyID": "1",
            "storyTitle": "智能照明的定时",
            "product": "1",
            "branch": "0",
            "latestStoryVersion": "2",
            "storyStatus": "",
            "priOrder": "1",
            "statusOrder": "1",
            "designName": "",
            "latestDesignVersion": "",
            "assignedToRealName": "admin",
            "delay": 61,
            "needConfirm": false,
            "productType": "normal",
            "cases": [],
            "progress": 0,
            "rawParent": "0",
            "confirmeObject": [],
            "URs": "",
            "relatedObject": 1
        }
    ]
}
```
