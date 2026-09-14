# 获取项目版本列表

GET/projects/:projectID/builds

##  获取项目版本列表 

### 请求URL
https://xxx.com/api.php/v2/projects/:projectID/builds

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  builds  array  构建 
|     ∟  id  string  ID 
|     ∟  project  string  所属项目 
|     ∟  product  string  所属产品 
|     ∟  branch  string  平台/分支 
|     ∟  execution  string  所属执行 
|     ∟  builds  array  包含构建 
|     ∟  name  string  名称 
|     ∟  system  string  所属应用 
|     ∟  scmPath  string  源代码地址 
|     ∟  filePath  string  下载地址 
|     ∟  date  string  打包日期 
|     ∟  stories  string  完成的用户故事 
|     ∟  bugs  string  解决的Bug 
|     ∟  artifactRepoID  string  
|     ∟  builder  string  构建者 
|     ∟  desc  string  描述 
|     ∟  createdBy  string  由谁创建 
|     ∟  createdDate  string  创建时间 
|     ∟  deleted  string  已删除 
|     ∟  productName  string  
|     ∟  executionDeleted  string  
|     ∟  executionName  string  
|     ∟  branchName  string  所属%s 
|     ∟  rowspan  int  
|     ∟  executionRowspan  int  
|     ∟  pathType  string  
|     ∟  path  string  

### 响应示例

```
{
    "status": "success",
    "builds": [
        {
            "id": "1",
            "project": "2",
            "product": "1",
            "branch": "",
            "execution": "3",
            "builds": [],
            "name": "版本v1.0",
            "system": "1",
            "scmPath": "http:\/\/test.com\/git",
            "filePath": "http:\/\/test.com\/download",
            "date": "2026-01-01",
            "stories": "",
            "bugs": "",
            "artifactRepoID": "0",
            "builder": "admin",
            "desc": "test",
            "createdBy": "admin",
            "createdDate": "2026-03-25 09:11:45",
            "deleted": "0",
            "productName": "智能照明",
            "executionDeleted": "0",
            "executionName": "智能设备研发3.2版本开发",
            "branchName": "",
            "rowspan": 2,
            "executionRowspan": 2,
            "pathType": "scmPath",
            "path": "http:\/\/test.com\/git"
        },
        {
            "id": "1",
            "project": "2",
            "product": "1",
            "branch": "",
            "execution": "3",
            "builds": [],
            "name": "版本v1.0",
            "system": "1",
            "scmPath": "http:\/\/test.com\/git",
            "filePath": "http:\/\/test.com\/download",
            "date": "2026-01-01",
            "stories": "",
            "bugs": "",
            "artifactRepoID": "0",
            "builder": "admin",
            "desc": "test",
            "createdBy": "admin",
            "createdDate": "2026-03-25 09:11:45",
            "deleted": "0",
            "productName": "智能照明",
            "executionDeleted": "0",
            "executionName": "智能设备研发3.2版本开发",
            "branchName": "",
            "rowspan": 2,
            "executionRowspan": 2,
            "pathType": "filePath",
            "path": "http:\/\/test.com\/download"
        }
    ]
}
```
