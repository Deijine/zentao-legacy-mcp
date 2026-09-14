# 获取项目的执行列表

GET  /projects/:projectID/executions 

##  获取项目的执行列表 

###  请求URL 
https://xxx.com/api.php/v2/projects/:projectID/executions

###  请求头 
|   名称   类型   必填   描述 
|   token   string   是   访问凭证Token 

###  请求参数 
|   名称   必填   描述 
|   status   否   执行状态，默认是undone。(all 全部 | undone 未完成 | wait 未开始 | doing 进行中) 
|   orderBy   否   排序(rawID_asc | nameCol_asc 名称 | begin_asc 计划开始 | end_asc 计划结束)，倒序使用rawID_desc, nameCol_desc, begin_desc, end_desc 
|   recPerPage   否   每页数量，不超过1000 
|   pageID   否   页码，从第1页开始 

###  请求响应 
|   名称   类型   描述 
|   status   string   状态(success 成功 | fail 失败) 
|   executions   array   执行 
|      ∟  id   string   执行编号 
|      ∟  project   string   所属项目 
|      ∟  isTpl   string  
|      ∟  charter   string  
|      ∟  model   string  
|      ∟  type   string   执行类型 
|      ∟  category   string  
|      ∟  lifetime   string   项目周期 
|      ∟  budget   string  
|      ∟  budgetUnit   string  
|      ∟  attribute   string   阶段类型 
|      ∟  percent   string   工作量占比 
|      ∟  milestone   string   里程碑 
|      ∟  output   string   输出 
|      ∟  auth   string   权限控制 
|      ∟  storyType   string  
|      ∟  parent   string   所属项目 
|      ∟  path   string   路径 
|      ∟  grade   string   层级 
|      ∟  name   string   执行名称 
|      ∟  code   string   执行代号 
|      ∟  hasProduct   string  
|      ∟  workflowGroup   string  
|      ∟  begin   string   计划开始 
|      ∟  end   string   计划完成 
|      ∟  firstEnd   string  
|      ∟  realBegan   string   实际开始日期 
|      ∟  realEnd   string   实际完成日期 
|      ∟  days   string   可用工作日 
|      ∟  status   string   执行状态 
|      ∟  subStatus   string   子状态 
|      ∟  pri   string   优先级 
|      ∟  desc   string   执行描述 
|      ∟  version   string   版本 
|      ∟  parentVersion   string   父版本 
|      ∟  planDuration   string   计划周期天数 
|      ∟  realDuration   string   实际周期天数 
|      ∟  progress   string   进度 
|      ∟  estimate   string   预计 
|      ∟  left   string   剩余 
|      ∟  consumed   string   消耗 
|      ∟  teamCount   string   人数 
|      ∟  market   string  
|      ∟  openedBy   string   由谁创建 
|      ∟  openedDate   string   创建日期 
|      ∟  openedVersion   string   创建版本 
|      ∟  lastEditedBy   string   最后编辑人 
|      ∟  lastEditedDate   string   最后编辑日期 
|      ∟  closedBy   string   由谁关闭 
|      ∟  closedDate   string   关闭日期 
|      ∟  closedReason   string  
|      ∟  canceledBy   string   由谁取消 
|      ∟  canceledDate   string   取消日期 
|      ∟  suspendedDate   string   暂停日期 
|      ∟  PO   string   产品负责人 
|      ∟  PM   string   执行负责人 
|      ∟  QD   string   测试负责人 
|      ∟  RD   string   发布负责人 
|      ∟  team   string   团队成员 
|      ∟  acl   string   访问控制 
|      ∟  whitelist   string   白名单 
|      ∟  tplAcl   string  
|      ∟  tplWhiteList   string  
|      ∟  order   string   执行排序 
|      ∟  stageBy   string  
|      ∟  displayCards   string   每列最大卡片数 
|      ∟  fluidBoard   string   列宽度 
|      ∟  multiple   string  
|      ∟  parallel   string  
|      ∟  enabled   string  
|      ∟  linkType   string  
|      ∟  taskDateLimit   string  
|      ∟  colWidth   string  
|      ∟  minColWidth   string  
|      ∟  maxColWidth   string  
|      ∟  vision   string   界面 
|      ∟  frozen   string  
|      ∟  deleted   string   已删除 
|      ∟  projectName   string   所属项目 
|      ∟  projectModel   string  
|      ∟  productName   string  
|      ∟  product   string   相关产品 
|      ∟  productID   int  
|      ∟  delay   int  
|      ∟  totalEstimate   string   预计 
|      ∟  totalConsumed   string   消耗 
|      ∟  totalLeft   string   剩余 
|      ∟  burns   array  

###  响应示例 

```
{
    "status": "success",
    "executions": [
        {
            "id": "3",
            "project": "2",
            "isTpl": "0",
            "charter": "0",
            "model": "",
            "type": "sprint",
            "category": "",
            "lifetime": "short",
            "budget": "0.00",
            "budgetUnit": "CNY",
            "attribute": "",
            "percent": "0.00",
            "milestone": "0",
            "output": "",
            "auth": "",
            "storyType": "story",
            "parent": "2",
            "path": ",2,3,",
            "grade": "1",
            "name": "智能设备研发3.2版本开发",
            "code": "",
            "hasProduct": "1",
            "workflowGroup": "0",
            "begin": "2026-01-01",
            "end": "2026-01-21",
            "firstEnd": "",
            "realBegan": "",
            "realEnd": "",
            "days": "16",
            "status": "wait",
            "subStatus": "",
            "pri": "1",
            "desc": "",
            "version": "1",
            "parentVersion": "1",
            "planDuration": "15",
            "realDuration": "0",
            "progress": "0.00",
            "estimate": "0.00",
            "left": "0.00",
            "consumed": "0.00",
            "teamCount": "0",
            "market": "0",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:23",
            "openedVersion": "ipd5.0",
            "lastEditedBy": "admin",
            "lastEditedDate": "2026-03-25 09:11:25",
            "closedBy": "",
            "closedDate": "",
            "closedReason": "",
            "canceledBy": "",
            "canceledDate": "",
            "suspendedDate": "",
            "PO": "productManager",
            "PM": "executionManager",
            "QD": "testManager",
            "RD": "productManager",
            "team": "智能设备研发3.1版本开发",
            "acl": "open",
            "whitelist": "",
            "tplAcl": "open",
            "tplWhiteList": "",
            "order": "15",
            "stageBy": "product",
            "displayCards": "0",
            "fluidBoard": "0",
            "multiple": "1",
            "parallel": "0",
            "enabled": "on",
            "linkType": "plan",
            "taskDateLimit": "auto",
            "colWidth": "264",
            "minColWidth": "200",
            "maxColWidth": "384",
            "vision": "rnd",
            "frozen": "",
            "deleted": "0",
            "projectName": "智能设备研发",
            "projectModel": "scrum",
            "productName": "智能照明",
            "product": "1",
            "productID": 0,
            "delay": 45,
            "totalEstimate": "0.00",
            "totalConsumed": "0.00",
            "totalLeft": "0.00",
            "burns": []
        }
    ]
}
```
