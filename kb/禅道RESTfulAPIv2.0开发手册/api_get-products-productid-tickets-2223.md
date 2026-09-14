# 获取产品工单列表

GET/products/:productID/tickets

##  获取产品工单列表 

### 请求URL
https://xxx.com/api.php/v2/products/:productID/tickets

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  状态，默认是wait。(all 全部 | unclosed 未关闭 | wait 待处理 | doing 处理中 | done 待关闭 | finishedbyme 由我解决 | assigntome 指派给我 | openedbyme 由我创建) 
|  orderBy  否  排序(id_asc | title_asc 标题 | status_asc 状态)，倒序使用id_desc, title_desc, status_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  tickets  array  工单 
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
|     ∟  dept  string  
|     ∟  consumed  int  总计消耗 
|     ∟  feedbackTip  string  
|     ∟  relatedObject  int  

### 响应示例

```
{
    "status": "success",
    "tickets": [
        {
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
            "dept": "0",
            "consumed": 0,
            "feedbackTip": "",
            "relatedObject": 0
        }
    ]
}
```
