# 获取工单详情

GET/tickets/:ticketID

##  获取工单详情 

### 请求URL
https://xxx.com/api.php/v2/tickets/:ticketID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  ticket  object  工单 
|     ∟  id  string  工单编号 
|     ∟  product  string  所属产品 
|     ∟  module  string  所属模块 
|     ∟  title  string  工单名称 
|     ∟  type  string  类型 
|     ∟  desc  string  描述 
|     ∟  openedBuild  string  影响版本 
|     ∟  feedback  string  由反馈转化 
|     ∟  assignedTo  string  指派给 
|     ∟  assignedDate  string  指派日期 
|     ∟  realStarted  string  实际开始 
|     ∟  startedBy  string  由谁开始 
|     ∟  startedDate  string  开始时间 
|     ∟  deadline  string  截止日期 
|     ∟  pri  string  优先级 
|     ∟  estimate  string  最初预计 
|     ∟  left  string  预计剩余 
|     ∟  status  string  状态 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建时间 
|     ∟  activatedCount  string  激活次数 
|     ∟  activatedBy  string  由谁激活 
|     ∟  activatedDate  string  激活时间 
|     ∟  closedBy  string  关闭者 
|     ∟  closedDate  string  关闭时间 
|     ∟  closedReason  string  关闭原因 
|     ∟  finishedBy  string  完成者 
|     ∟  finishedDate  string  完成时间 
|     ∟  resolvedBy  string  解决者 
|     ∟  resolvedDate  string  解决时间 
|     ∟  resolution  string  解决方案 
|     ∟  editedBy  string  由谁编辑 
|     ∟  editedDate  string  最后修改时间 
|     ∟  keywords  string  关键字 
|     ∟  repeatTicket  string  重复工单 
|     ∟  mailto  string  抄送给 
|     ∟  deleted  string  已删除 
|     ∟  subStatus  string  子状态 
|     ∟  createFiles  array  
|     ∟  finishFiles  array  
|     ∟  consumed  int  总计消耗 
|     ∟  files  array  文件

### 响应示例

```
{
    "status": "success",
    "ticket": {
        "id": "1",
        "product": "1",
        "module": "1",
        "title": "电容压力监测灵敏度不够",
        "type": "code",
        "desc": "监测灵敏度不够",
        "openedBuild": "trunk",
        "feedback": "0",
        "assignedTo": "admin",
        "assignedDate": "2026-03-25 09:11:43",
        "realStarted": "",
        "startedBy": "",
        "startedDate": "",
        "deadline": "2026-01-10",
        "pri": "3",
        "estimate": "0.00",
        "left": "0.00",
        "status": "wait",
        "openedBy": "admin",
        "openedDate": "2026-03-25 09:11:43",
        "activatedCount": "0",
        "activatedBy": "",
        "activatedDate": "",
        "closedBy": "",
        "closedDate": "",
        "closedReason": "",
        "finishedBy": "",
        "finishedDate": "",
        "resolvedBy": "",
        "resolvedDate": "",
        "resolution": "",
        "editedBy": "admin",
        "editedDate": "2026-03-25 09:11:44",
        "keywords": "",
        "repeatTicket": "0",
        "mailto": "",
        "deleted": "0",
        "subStatus": "",
        "createFiles": [],
        "finishFiles": [],
        "consumed": 0,
        "files": []
    }
}
```
