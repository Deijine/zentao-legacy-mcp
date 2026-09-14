# 获取项目列表

GET/projects

##  获取项目列表 

### 请求URL
https://xxx.com/api.php/v2/projects

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  项目状态，默认是undone。(all 全部 | undone 未完成 | wait 未开始 | doing 进行中) 
|  orderBy  否  排序(id_asc | name_asc 名称 | begin_asc 计划开始 | end_asc 计划结束)，倒序使用id_desc, name_desc, begin_desc, end_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  projects  array  项目 
|     ∟  id  string  项目ID 
|     ∟  project  string  所属项目 
|     ∟  isTpl  string  是否模板 
|     ∟  charter  string  
|     ∟  model  string  项目管理方式 
|     ∟  type  string  项目类型 
|     ∟  category  string  项目类型 
|     ∟  lifetime  string  项目周期 
|     ∟  budget  string  预算 
|     ∟  budgetUnit  string  （单位：万元） 
|     ∟  attribute  string  阶段类型 
|     ∟  percent  string  工作量占比 
|     ∟  milestone  string  里程碑 
|     ∟  output  string  输出 
|     ∟  auth  string  权限控制 
|     ∟  storyType  string  关联需求概念 
|     ∟  parent  string  所属项目集 
|     ∟  path  string  路径 
|     ∟  grade  string  层级 
|     ∟  name  string  项目名称 
|     ∟  code  string  项目代号 
|     ∟  hasProduct  string  是否关联产品 
|     ∟  workflowGroup  string  
|     ∟  begin  string  计划开始 
|     ∟  end  string  计划完成 
|     ∟  firstEnd  string  启动时的计划完成日期 
|     ∟  realBegan  string  实际开始日期 
|     ∟  realEnd  string  实际完成日期 
|     ∟  days  string  可用工作日 
|     ∟  status  string  状态 
|     ∟  subStatus  string  子状态 
|     ∟  pri  string  优先级 
|     ∟  desc  string  项目描述 
|     ∟  version  string  版本 
|     ∟  parentVersion  string  父版本 
|     ∟  planDuration  string  计划周期天数 
|     ∟  realDuration  string  实际周期天数 
|     ∟  progress  string  进度 
|     ∟  estimate  string  预计 
|     ∟  left  string  剩余工时 
|     ∟  consumed  string  消耗工时 
|     ∟  teamCount  int  人数 
|     ∟  market  string  目标市场 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建日期 
|     ∟  openedVersion  string  创建版本 
|     ∟  lastEditedBy  string  最后编辑人 
|     ∟  lastEditedDate  string  最后编辑日期 
|     ∟  closedBy  string  由谁关闭 
|     ∟  closedDate  string  关闭日期 
|     ∟  closedReason  string  关闭原因 
|     ∟  canceledBy  string  由谁取消 
|     ∟  canceledDate  string  取消日期 
|     ∟  suspendedDate  string  暂停日期 
|     ∟  PO  string  项目负责人 
|     ∟  PM  boolean  负责人 
|     ∟  QD  string  测试负责人 
|     ∟  RD  string  发布负责人 
|     ∟  team  string  团队 
|     ∟  acl  string  访问控制 
|     ∟  whitelist  string  项目白名单 
|     ∟  tplAcl  string  
|     ∟  tplWhiteList  string  模板白名单 
|     ∟  order  string  排序 
|     ∟  stageBy  string  阶段类型 
|     ∟  displayCards  string  每列最大卡片数 
|     ∟  fluidBoard  string  列宽度 
|     ∟  multiple  string  启用执行 
|     ∟  parallel  string  是否允许并行 
|     ∟  enabled  string  是否启用阶段 
|     ∟  linkType  string  关联类型 
|     ∟  taskDateLimit  string  任务时间限制 
|     ∟  colWidth  string  列宽 
|     ∟  minColWidth  string  最小列宽 
|     ∟  maxColWidth  string  最大列宽 
|     ∟  vision  string  界面 
|     ∟  frozen  string  
|     ∟  deleted  string  已删除 
|     ∟  teamMembers  array  
|     ∟  leftTasks  string  剩余任务 
|     ∟  statusTitle  string  
|     ∟  consume  string  消耗 
|     ∟  surplus  string  剩余 
|     ∟  invested  int  已投入 
|     ∟  PMAvatar  boolean  
|     ∟  PMUserID  boolean  
|     ∟  storyCount  int  需求条目数 
|     ∟  storyPoints  string  需求规模 
|     ∟  executionCount  int  执行数 
|     ∟  from  string  
|     ∟  actions  array  
|     ∟  deliverable  string  

### 响应示例

```
{
    "status": "success",
    "projects": [
        {
            "id": "2",
            "project": "0",
            "isTpl": "0",
            "charter": "0",
            "model": "scrum",
            "type": "project",
            "category": "",
            "lifetime": "",
            "budget": "待定",
            "budgetUnit": "CNY",
            "attribute": "",
            "percent": "0.00",
            "milestone": "0",
            "output": "",
            "auth": "extend",
            "storyType": "story,story",
            "parent": "1",
            "path": ",1,2,",
            "grade": "2",
            "name": "智能设备研发",
            "code": "",
            "hasProduct": "1",
            "workflowGroup": "13",
            "begin": "2025-01-01",
            "end": "2026-10-01",
            "firstEnd": "",
            "realBegan": "",
            "realEnd": "",
            "days": "0",
            "status": "wait",
            "subStatus": "",
            "pri": "1",
            "desc": "",
            "version": "1",
            "parentVersion": "1",
            "planDuration": "0",
            "realDuration": "0",
            "progress": "0.00",
            "estimate": "0",
            "left": "0",
            "consumed": "0.00",
            "teamCount": 1,
            "market": "0",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:22",
            "openedVersion": "",
            "lastEditedBy": "admin",
            "lastEditedDate": "2026-03-25 09:11:23",
            "closedBy": "",
            "closedDate": "",
            "closedReason": "",
            "canceledBy": "",
            "canceledDate": "",
            "suspendedDate": "",
            "PO": "",
            "PM": false,
            "QD": "",
            "RD": "",
            "team": "智能设备研发",
            "acl": "open",
            "whitelist": "",
            "tplAcl": "open",
            "tplWhiteList": "",
            "order": "10",
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
            "teamMembers": [
                "admin"
            ],
            "leftTasks": "—",
            "statusTitle": "未开始",
            "consume": "0",
            "surplus": "0.00h",
            "invested": 0,
            "PMAvatar": false,
            "PMUserID": false,
            "storyCount": 0,
            "storyPoints": "0 h",
            "executionCount": 0,
            "from": "project",
            "actions": [
                "start",
                "other:pause,close,active,",
                "edit",
                "group",
                "perm",
                "more:link,-whitelist,delete,"
            ],
            "deliverable": "0 \/ 0\n"
        }
    ]
}
```
