# 获取产品计划列表

GET/products/:productID/productplans

##  获取产品计划列表 

### 请求URL
https://xxx.com/api.php/v2/products/:productID/productplans

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  执行状态，默认是undone。(all 全部 | undone 未完成 | wait 未开始 | doing 进行中) 
|  orderBy  否  排序(id_asc | title_asc 名称 | begin_asc 开始日期 | end_asc 结束日期 | status_asc 状态)，倒序使用id_desc, title_desc, begin_desc, end_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  productplans  array  产品计划 
|     ∟  id  string  编号 
|     ∟  product  string  所属产品 
|     ∟  branch  string  平台/分支 
|     ∟  parent  string  父计划 
|     ∟  title  string  计划名称 
|     ∟  status  string  状态 
|     ∟  desc  string  描述 
|     ∟  begin  string  开始日期 
|     ∟  end  string  结束日期 
|     ∟  finishedDate  string  完成时间 
|     ∟  closedDate  string  关闭时间 
|     ∟  order  string  排序 
|     ∟  closedReason  string  关闭原因 
|     ∟  createdBy  string  由谁创建 
|     ∟  createdDate  string  创建时间 
|     ∟  deleted  string  已删除 
|     ∟  stories  int  需求数 
|     ∟  bugs  int  Bug数 
|     ∟  hour  int  小时 
|     ∟  projects  array  
|     ∟  expired  boolean  已过期 
|     ∟  branchName  string  
|     ∟  actions  array  

### 响应示例

```
{
    "status": "success",
    "productplans": [
        {
            "id": "1",
            "product": "1",
            "branch": "0",
            "parent": "0",
            "title": "V1.1计划",
            "status": "wait",
            "desc": "初版计划",
            "begin": "2026-01-01",
            "end": "2026-01-31",
            "finishedDate": "",
            "closedDate": "",
            "order": "0",
            "closedReason": "",
            "createdBy": "admin",
            "createdDate": "2026-03-25 09:11:25",
            "deleted": "0",
            "stories": 0,
            "bugs": 0,
            "hour": 0,
            "projects": [
                {
                    "name": "智能设备研发3.2版本开发",
                    "project": "3",
                    "plan": ",1,"
                }
            ],
            "expired": true,
            "branchName": "",
            "actions": [
                "start",
                "finish",
                "close",
                "activate",
                "createExecution",
                "divider",
                "linkStory",
                "linkBug",
                "edit",
                "create",
                "delete"
            ]
        }
    ]
}
```
