# 获取项目测试用例列表

GET/projects/:projectID/testcases

##  获取项目测试用例列表 

### 请求URL
https://xxx.com/api.php/v2/projects/:projectID/testcases

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  状态，默认是all。(all 全部 | wait 未关闭 | needconfirm 需求变动) 
|  orderBy  否  排序(id_asc | title_asc 标题 | status_asc 状态)，倒序使用id_desc, title_desc, status_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  testcases  array  用例 
|     ∟  product  string  所属产品 
|     ∟  case  string  用例 
|     ∟  version  string  用例版本 
|     ∟  id  string  用例编号 
|     ∟  project  string  所属项目 
|     ∟  execution  string  所属执行 
|     ∟  branch  string  平台/分支 
|     ∟  lib  string  所属库 
|     ∟  module  string  所属模块 
|     ∟  path  string  路径 
|     ∟  story  string  相关用户故事 
|     ∟  storyVersion  string  用户故事版本 
|     ∟  title  string  用例名称 
|     ∟  precondition  string  前置条件 
|     ∟  keywords  string  关键词 
|     ∟  pri  string  优先级 
|     ∟  type  string  用例类型 
|     ∟  auto  string  自动化测试用例 
|     ∟  frame  string  自动化测试框架 
|     ∟  stage  string  适用环节 
|     ∟  howRun  string  测试方式 
|     ∟  script  string  自动化脚本 
|     ∟  scriptedBy  string  脚本由谁创建 
|     ∟  scriptedDate  string  脚本创建日期 
|     ∟  scriptStatus  string  脚本状态 
|     ∟  scriptLocation  string  脚本地址 
|     ∟  status  string  用例状态 
|     ∟  subStatus  string  子状态 
|     ∟  color  string  标题颜色 
|     ∟  frequency  string  使用频率 
|     ∟  order  string  排序 
|     ∟  openedBy  string  由谁创建 
|     ∟  openedDate  string  创建日期 
|     ∟  reviewedBy  string  由谁评审 
|     ∟  reviewedDate  string  评审时间 
|     ∟  lastEditedBy  string  最后修改者 
|     ∟  lastEditedDate  string  修改日期 
|     ∟  linkCase  string  相关用例 
|     ∟  fromBug  string  来源Bug 
|     ∟  fromCaseID  string  用例来源ID 
|     ∟  fromCaseVersion  string  用例来源版本 
|     ∟  lastRunner  string  执行人 
|     ∟  lastRunDate  string  执行时间 
|     ∟  lastRunResult  string  结果 
|     ∟  scene  string  所属场景 
|     ∟  sort  string  
|     ∟  deleted  string  已删除 
|     ∟  storyTitle  string  
|     ∟  needconfirm  boolean  
|     ∟  bugs  int  产生Bug数 
|     ∟  results  int  执行结果数 
|     ∟  caseFails  int  
|     ∟  stepNumber  string  用例步骤数 
|     ∟  confirmeObject  array  
|     ∟  URs  string  
|     ∟  relatedObject  int  
|     ∟  caseID  string  
|     ∟  parent  int  上级步骤 
|     ∟  isScene  boolean  

### 响应示例

```
{
    "status": "success",
    "testcases": [
        {
            "product": "1",
            "case": "1",
            "version": "2",
            "id": "case_1",
            "project": "2",
            "execution": "3",
            "branch": "0",
            "lib": "0",
            "module": "0",
            "path": "0",
            "story": "0",
            "storyVersion": "1",
            "title": "测试光敏模块显示是否正常",
            "precondition": "",
            "keywords": "",
            "pri": "3",
            "type": "feature",
            "auto": "no",
            "frame": "",
            "stage": ",",
            "howRun": "",
            "script": "",
            "scriptedBy": "",
            "scriptedDate": "",
            "scriptStatus": "",
            "scriptLocation": "",
            "status": "normal",
            "subStatus": "",
            "color": "",
            "frequency": "1",
            "order": "0",
            "openedBy": "admin",
            "openedDate": "2026-03-25 09:11:37",
            "reviewedBy": "",
            "reviewedDate": "",
            "lastEditedBy": "admin",
            "lastEditedDate": "2026-03-25 09:11:37",
            "linkCase": "",
            "fromBug": "0",
            "fromCaseID": "0",
            "fromCaseVersion": "1",
            "lastRunner": "",
            "lastRunDate": "",
            "lastRunResult": "",
            "scene": "0",
            "sort": "0",
            "deleted": "0",
            "storyTitle": "",
            "needconfirm": false,
            "bugs": 0,
            "results": 0,
            "caseFails": 0,
            "stepNumber": "2",
            "confirmeObject": [],
            "URs": "",
            "relatedObject": 0,
            "caseID": "1",
            "parent": 0,
            "isScene": false
        }
    ]
}
```
