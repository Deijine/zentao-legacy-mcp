# 获取产品计划详情

GET/productplans/:planID

##  获取产品计划详情 

### 请求URL
https://xxx.com/api.php/v2/productplans/:planID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  productplan  object  产品计划 
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
|     ∟  isParent  int  

### 响应示例

```
{
    "status": "success",
    "productplan": {
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
        "isParent": 0
    }
}
```
