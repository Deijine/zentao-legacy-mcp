# 获取产品发布列表

GET/products/:productID/releases

##  获取产品发布列表 

### 请求URL
https://xxx.com/api.php/v2/products/:productID/releases

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  releases  array  发布 
|     ∟  id  string  ID 
|     ∟  project  string  所属项目 
|     ∟  product  string  所属产品 
|     ∟  branch  string  平台/分支 
|     ∟  shadow  string  
|     ∟  build  array  构建 
|     ∟  name  string  应用版本号 
|     ∟  system  string  应用 
|     ∟  releases  string  包含应用 
|     ∟  marker  string  里程碑 
|     ∟  date  string  计划发布日期 
|     ∟  releasedDate  string  实际发布日期 
|     ∟  stories  string  完成的用户故事 
|     ∟  bugs  string  解决的Bug 
|     ∟  leftBugs  string  遗留的Bug 
|     ∟  desc  string  描述 
|     ∟  mailto  string  抄送给 
|     ∟  notify  string  发送通知 
|     ∟  status  string  发布状态 
|     ∟  subStatus  string  子状态 
|     ∟  createdBy  string  由谁创建 
|     ∟  createdDate  string  创建时间 
|     ∟  deleted  string  已删除 
|     ∟  productName  string  
|     ∟  productType  string  
|     ∟  builds  array  
|     ∟  branchName  string  
|     ∟  projectName  string  
|     ∟  rowID  string  
|     ∟  rowspan  int  
|     ∟  actions  array  

### 响应示例

```
{
    "status": "success",
    "releases": [
        {
            "id": "1",
            "project": ",2,",
            "product": "1",
            "branch": "",
            "shadow": "2",
            "build": {
                "id": "1",
                "name": "版本v1.0",
                "branch": "",
                "project": "2",
                "execution": "3",
                "projectName": "智能设备研发",
                "branchName": "主干",
                "link": "\/index.php?m=build&f=view&t=json&buildID=1"
            },
            "name": "v1.0",
            "system": "1",
            "releases": "",
            "marker": "0",
            "date": "2026-02-10",
            "releasedDate": "",
            "stories": "",
            "bugs": "",
            "leftBugs": "",
            "desc": "release 1.0",
            "mailto": "",
            "notify": "",
            "status": "wait",
            "subStatus": "",
            "createdBy": "admin",
            "createdDate": "2026-03-25 09:11:47",
            "deleted": "0",
            "productName": "智能照明",
            "productType": "normal",
            "builds": [
                {
                    "id": "1",
                    "name": "版本v1.0",
                    "branch": "",
                    "project": "2",
                    "execution": "3",
                    "projectName": "智能设备研发",
                    "branchName": "主干",
                    "link": "\/index.php?m=build&f=view&t=json&buildID=1"
                }
            ],
            "branchName": "主干",
            "projectName": "智能设备研发",
            "rowID": "1",
            "rowspan": 1,
            "actions": [
                "linkStory",
                "linkBug",
                "play",
                "edit",
                "notify",
                "delete"
            ]
        }
    ]
}
```
