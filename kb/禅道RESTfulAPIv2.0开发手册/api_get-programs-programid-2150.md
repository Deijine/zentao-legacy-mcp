# 获取项目集详情

GET/programs/:programID

##  获取项目集详情 

### 请求URL
https://xxx.com/api.php/v2/programs/:programID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  program  object  项目集 
|     ∟  id  string  编号 
|     ∟  project  string  项目 
|     ∟  isTpl  string  
|     ∟  charter  string  
|     ∟  model  string  
|     ∟  type  string  类型 
|     ∟  category  string  项目集类型 
|     ∟  lifetime  string  项目周期 
|     ∟  budget  string  预算 
|     ∟  budgetUnit  string  预算单位 
|     ∟  attribute  string  
|     ∟  percent  string  
|     ∟  milestone  string  
|     ∟  output  string  输出 
|     ∟  auth  string  权限控制 
|     ∟  storyType  string  
|     ∟  parent  string  父项目集 
|     ∟  path  string  路径 
|     ∟  grade  string  层级 
|     ∟  name  string  项目集名称 
|     ∟  code  string  
|     ∟  hasProduct  string  该项目集有产品存在，不能删除。 
|     ∟  workflowGroup  string  
|     ∟  begin  string  计划开始 
|     ∟  end  string  计划完成 
|     ∟  firstEnd  string  
|     ∟  realBegan  string  实际开始 
|     ∟  realEnd  string  实际完成 
|     ∟  days  string  可用工作日 
|     ∟  status  string  状态 
|     ∟  subStatus  string  
|     ∟  pri  string  优先级 
|     ∟  desc  string  项目集描述 
|     ∟  version  string  版本 
|     ∟  parentVersion  string  父版本 
|     ∟  planDuration  string  计划周期天数 
|     ∟  realDuration  string  实际周期天数 
|     ∟  progress  string  项目进度 
|     ∟  estimate  string  
|     ∟  left  string  
|     ∟  consumed  string  
|     ∟  teamCount  string  总人数 
|     ∟  market  string  
|     ∟  openedBy  string  创建者 
|     ∟  openedDate  string  创建时间 
|     ∟  openedVersion  string  创建版本 
|     ∟  lastEditedBy  string  最后编辑人 
|     ∟  lastEditedDate  string  最后编辑日期 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  string  关闭日期 
|     ∟  closedReason  string  
|     ∟  canceledBy  string  由谁取消 
|     ∟  canceledDate  string  取消日期 
|     ∟  suspendedDate  string  暂停日期 
|     ∟  PO  string  
|     ∟  PM  string  负责人 
|     ∟  QD  string  
|     ∟  RD  string  
|     ∟  team  string  团队 
|     ∟  acl  string  访问控制 
|     ∟  whitelist  string  白名单 
|     ∟  tplAcl  string  
|     ∟  tplWhiteList  string  
|     ∟  order  string  排序 
|     ∟  stageBy  string  
|     ∟  displayCards  string  
|     ∟  fluidBoard  string  
|     ∟  multiple  string  
|     ∟  parallel  string  
|     ∟  enabled  string  
|     ∟  linkType  string  
|     ∟  taskDateLimit  string  
|     ∟  colWidth  string  
|     ∟  minColWidth  string  
|     ∟  maxColWidth  string  
|     ∟  vision  string  界面 
|     ∟  frozen  string  
|     ∟  deleted  string  已删除

### 响应示例

```
{
    "status": "success",
    "program": {
        "id": "1",
        "project": "0",
        "isTpl": "0",
        "charter": "0",
        "model": "",
        "type": "program",
        "category": "",
        "lifetime": "",
        "budget": "0.00",
        "budgetUnit": "CNY",
        "attribute": "",
        "percent": "0.00",
        "milestone": "0",
        "output": "",
        "auth": "",
        "storyType": "story",
        "parent": "0",
        "path": ",1,",
        "grade": "1",
        "name": "智能家居",
        "code": "",
        "hasProduct": "1",
        "workflowGroup": "0",
        "begin": "2025-01-01",
        "end": "2026-12-01",
        "firstEnd": "",
        "realBegan": "",
        "realEnd": "",
        "days": "0",
        "status": "wait",
        "subStatus": "",
        "pri": "1",
        "desc": "智能家居项目集",
        "version": "1",
        "parentVersion": "1",
        "planDuration": "0",
        "realDuration": "0",
        "progress": "0.00",
        "estimate": "0.00",
        "left": "0.00",
        "consumed": "0.00",
        "teamCount": "0",
        "market": "0",
        "openedBy": "admin",
        "openedDate": "2026-03-25 09:11:20",
        "openedVersion": "",
        "lastEditedBy": "admin",
        "lastEditedDate": "2026-03-25 09:11:20",
        "closedBy": "",
        "closedDate": "",
        "closedReason": "",
        "canceledBy": "",
        "canceledDate": "",
        "suspendedDate": "",
        "PO": "",
        "PM": "productManager",
        "QD": "",
        "RD": "",
        "team": "",
        "acl": "open",
        "whitelist": "",
        "tplAcl": "open",
        "tplWhiteList": "",
        "order": "5",
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
        "deleted": "0"
    }
}
```
