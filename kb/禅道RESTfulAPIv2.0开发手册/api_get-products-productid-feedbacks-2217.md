# 获取产品反馈列表

GET/products/:productID/feedbacks

##  获取产品反馈列表 

### 请求URL
https://xxx.com/api.php/v2/products/:productID/feedbacks

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  状态，默认是wait。(all 全部 | wait 待处理 | doing 处理中 | toclosed 待关闭 | review 待评审 | assigntome 指派给我 | openedbyme 由我反馈) 
|  orderBy  否  排序(id_asc | title_asc 标题 | status_asc 状态)，倒序使用id_desc, title_desc, status_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  feedbacks  array  反馈 
|     ∟  id  string  编号 
|     ∟  product  string  所属产品 
|     ∟  module  string  所属模块 
|     ∟  title  string  反馈名称 
|     ∟  type  string  类型 
|     ∟  solution  string  处理方案 
|     ∟  desc  string  描述 
|     ∟  pri  string  优先级 
|     ∟  status  string  状态 
|     ∟  subStatus  string  子状态 
|     ∟  prevStatus  string  
|     ∟  public  string  公开 
|     ∟  notify  string  通知 
|     ∟  notifyEmail  string  通知邮箱 
|     ∟  source  string  来源公司 
|     ∟  likes  string  点赞人 
|     ∟  result  string  转化结果 
|     ∟  faq  string  FAQ 
|     ∟  openedBy  string  创建者 
|     ∟  openedDate  string  创建时间 
|     ∟  reviewedBy  string  由谁评审 
|     ∟  reviewedDate  string  评审时间 
|     ∟  processedBy  string  由谁处理 
|     ∟  processedDate  string  处理时间 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  string  关闭时间 
|     ∟  closedReason  string  关闭原因 
|     ∟  editedBy  string  最后处理人 
|     ∟  editedDate  string  最后操作时间 
|     ∟  assignedTo  string  指派给 
|     ∟  prevAssignedTo  string  
|     ∟  assignedDate  string  指派时间 
|     ∟  activatedBy  string  由谁激活 
|     ∟  activatedDate  string  激活时间 
|     ∟  feedbackBy  string  反馈者 
|     ∟  repeatFeedback  string  重复反馈 
|     ∟  mailto  string  抄送给 
|     ∟  keywords  string  关键词 
|     ∟  deleted  string  已删除 
|     ∟  dept  string  部门 
|     ∟  relatedObject  int  

### 响应示例

```
{
    "status": "success",
    "feedbacks": [
        {
            "id": "1",
            "product": "1",
            "module": "1",
            "title": "光敏元件灵敏度不够",
            "type": "story",
            "solution": "",
            "desc": "监测灵敏度不够",
            "pri": "2",
            "status": "wait",
            "subStatus": "",
            "prevStatus": "",
            "public": "1",
            "notify": "1",
            "notifyEmail": "",
            "source": "XX技术有限公司",
            "likes": "",
            "result": "0",
            "faq": "0",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:42",
            "reviewedBy": "",
            "reviewedDate": "",
            "processedBy": "",
            "processedDate": "",
            "closedBy": "",
            "closedDate": "",
            "closedReason": "",
            "editedBy": "admin",
            "editedDate": "2026-03-25 09:11:42",
            "assignedTo": "",
            "prevAssignedTo": "",
            "assignedDate": "",
            "activatedBy": "",
            "activatedDate": "",
            "feedbackBy": "客户对接人",
            "repeatFeedback": "0",
            "mailto": "",
            "keywords": "",
            "deleted": "0",
            "dept": "0",
            "relatedObject": 0
        }
    ]
}
```
