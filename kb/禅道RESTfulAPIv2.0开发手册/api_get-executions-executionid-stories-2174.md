# 获取执行需求列表

GET/executions/:executionID/stories

##  获取执行需求列表 

### 请求URL
https://xxx.com/api.php/v2/executions/:executionID/stories

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  stories  array  用户故事 
|     ∟  id  string  编号 
|     ∟  project  string  所属项目 
|     ∟  product  string  所属产品 
|     ∟  branch  string  平台/分支 
|     ∟  story  string  用户故事 
|     ∟  version  string  版本号 
|     ∟  order  string  排序 
|     ∟  parent  array  父需求 
|     ∟  isParent  string  是父需求 
|     ∟  root  string  顶级需求ID 
|     ∟  path  string  路径 
|     ∟  grade  string  需求层级 
|     ∟  module  string  所属模块 
|     ∟  plan  string  所属计划 
|     ∟  source  string  来源 
|     ∟  sourceNote  string  来源备注 
|     ∟  fromBug  string  来源Bug 
|     ∟  feedback  string  
|     ∟  title  string  用户故事名称 
|     ∟  keywords  string  关键词 
|     ∟  type  string  需求类型 
|     ∟  category  string  类别 
|     ∟  pri  string  优先级 
|     ∟  estimate  string  预计小时 
|     ∟  status  string  当前状态 
|     ∟  subStatus  string  子状态 
|     ∟  color  string  标题颜色 
|     ∟  stage  string  所处阶段 
|     ∟  stagedBy  string  设置阶段者 
|     ∟  mailto  string  抄送给 
|     ∟  lib  string  
|     ∟  fromStory  string  来源需求 
|     ∟  fromVersion  string  来源版本 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建日期 
|     ∟  assignedTo  string  指派给 
|     ∟  assignedDate  string  指派日期 
|     ∟  approvedDate  string  评审日期 
|     ∟  lastEditedBy  string  最后修改 
|     ∟  lastEditedDate  string  最后修改日期 
|     ∟  changedBy  string  由谁变更 
|     ∟  changedDate  string  变更时间 
|     ∟  reviewedBy  string  已评审人 
|     ∟  reviewedDate  string  评审时间 
|     ∟  releasedDate  string  发布日期 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  string  关闭日期 
|     ∟  closedReason  string  关闭原因 
|     ∟  activatedDate  string  激活日期 
|     ∟  toBug  string  转Bug 
|     ∟  linkStories  string  相关需求 
|     ∟  linkRequirements  string  相关用户需求 
|     ∟  docs  string  
|     ∟  twins  string  孪生需求 
|     ∟  duplicateStory  string  重复需求 
|     ∟  parentVersion  string  父需求版本 
|     ∟  demandVersion  string  需求池需求版本 
|     ∟  storyChanged  string  需求已变更 
|     ∟  feedbackBy  string  反馈者 
|     ∟  notifyEmail  string  通知邮箱 
|     ∟  BSA  string  
|     ∟  duration  string  
|     ∟  demand  string  需求池需求 
|     ∟  submitedBy  string  
|     ∟  roadmap  string  所属路标 
|     ∟  URChanged  string  用需变更 
|     ∟  unlinkReason  string  移除原因 
|     ∟  retractedReason  string  撤销原因 
|     ∟  retractedBy  string  
|     ∟  retractedDate  string  
|     ∟  verifiedDate  string  验收时间 
|     ∟  vision  string  所属界面 
|     ∟  frozen  string  
|     ∟  deleted  string  已删除 
|     ∟  priOrder  string  
|     ∟  productType  string  
|     ∟  planTitle  string  
|     ∟  originParent  string  
|     ∟  relatedObject  int  
|     ∟  reviewer  array  评审人 
|     ∟  notReview  array  
|     ∟  confirmeObject  array  
|     ∟  URs  string  
|     ∟  needSummaryEstimate  boolean  

### 响应示例

```
{
    "status": "success",
    "stories": [
        {
            "id": "2",
            "project": "3",
            "product": "1",
            "branch": "0",
            "story": "2",
            "version": "1",
            "order": "1",
            "parent": [],
            "isParent": "0",
            "root": "2",
            "path": ",2,",
            "grade": "0",
            "module": "0",
            "plan": "",
            "source": "customer",
            "sourceNote": "",
            "fromBug": "0",
            "feedback": "0",
            "title": "智能头枕的压敏单元设计",
            "keywords": "",
            "type": "story",
            "category": "feature",
            "pri": "3",
            "estimate": "1.00",
            "status": "reviewing",
            "subStatus": "",
            "color": "",
            "stage": "projected",
            "stagedBy": "",
            "mailto": "",
            "lib": "0",
            "fromStory": "0",
            "fromVersion": "1",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:28",
            "assignedTo": "admin",
            "assignedDate": "2026-03-25 09:11:28",
            "approvedDate": "",
            "lastEditedBy": "",
            "lastEditedDate": "",
            "changedBy": "",
            "changedDate": "",
            "reviewedBy": "",
            "reviewedDate": "",
            "releasedDate": "",
            "closedBy": "",
            "closedDate": "",
            "closedReason": "",
            "activatedDate": "",
            "toBug": "0",
            "linkStories": "",
            "linkRequirements": "",
            "docs": "",
            "twins": "",
            "duplicateStory": "0",
            "parentVersion": "1",
            "demandVersion": "1",
            "storyChanged": "0",
            "feedbackBy": "",
            "notifyEmail": "",
            "BSA": "",
            "duration": "",
            "demand": "0",
            "submitedBy": "",
            "roadmap": "",
            "URChanged": "0",
            "unlinkReason": "",
            "retractedReason": "",
            "retractedBy": "",
            "retractedDate": "",
            "verifiedDate": "",
            "vision": "rnd",
            "frozen": "",
            "deleted": "0",
            "priOrder": "3",
            "productType": "normal",
            "planTitle": " ",
            "originParent": "0",
            "relatedObject": 0,
            "reviewer": [
                "productManager"
            ],
            "notReview": [
                "productManager"
            ],
            "confirmeObject": [],
            "URs": "",
            "needSummaryEstimate": true
        }
    ]
}
```
