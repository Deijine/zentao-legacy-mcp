# 获取项目测试单列表

GET/projects/:projectID/testtasks

##  获取项目测试单列表 

### 请求URL
https://xxx.com/api.php/v2/projects/:projectID/testtasks

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  testtasks  array  测试单 
|     ∟  id  string  编号 
|     ∟  project  string  所属项目 
|     ∟  product  string  所属产品 
|     ∟  name  string  测试单名称 
|     ∟  execution  string  所属执行 
|     ∟  build  string  提测构建 
|     ∟  joint  string  
|     ∟  type  string  测试类型 
|     ∟  owner  string  负责人 
|     ∟  pri  string  优先级 
|     ∟  begin  string  开始日期 
|     ∟  end  string  结束日期 
|     ∟  realBegan  string  实际开始日期 
|     ∟  realFinishedDate  string  实际完成日期 
|     ∟  mailto  string  抄送给 
|     ∟  desc  string  描述 
|     ∟  report  string  
|     ∟  status  string  当前状态 
|     ∟  testreport  string  相关测试报告 
|     ∟  auto  string  自动化 
|     ∟  subStatus  string  子状态 
|     ∟  createdBy  string  由谁创建 
|     ∟  createdDate  string  创建时间 
|     ∟  members  string  参与人 
|     ∟  deleted  string  已删除 
|     ∟  idName  string  
|     ∟  multiple  string  
|     ∟  productName  string  
|     ∟  executionName  string  
|     ∟  buildName  string  
|     ∟  branch  string  
|     ∟  projectName  string  
|     ∟  productOrder  string  
|     ∟  executionBuild  string  
|     ∟  rawStatus  string  
|     ∟  rowspan  int  

### 响应示例

```
{
    "status": "success",
    "testtasks": [
        {
            "id": "1",
            "project": "2",
            "product": "1",
            "name": "智能家居V1.0测试单",
            "execution": "3",
            "build": "1",
            "joint": "0",
            "type": "integrate",
            "owner": "admin",
            "pri": "3",
            "begin": "2026-01-01",
            "end": "2026-02-01",
            "realBegan": "",
            "realFinishedDate": "",
            "mailto": "",
            "desc": "test",
            "report": "",
            "status": "未开始",
            "testreport": "0",
            "auto": "no",
            "subStatus": "",
            "createdBy": "admin",
            "createdDate": "2026-03-25 09:11:46",
            "members": "",
            "deleted": "0",
            "idName": "1",
            "multiple": "1",
            "productName": "智能照明",
            "executionName": "智能设备研发3.2版本开发",
            "buildName": "版本v1.0",
            "branch": "",
            "projectName": "智能设备研发",
            "productOrder": "5",
            "executionBuild": "智能设备研发3.2版本开发\/版本v1.0",
            "rawStatus": "wait",
            "rowspan": 1
        }
    ]
}
```
