# 创建用户需求

POST/requirements

##  创建用户需求 

### 请求URL
https://xxx.com/api.php/v2/requirements

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  productID  int  是  产品ID 
|  title  string  是  
|  pri  int  否  优先级，默认是3 
|  module  int  否  所属模块 
|  parent  int  否  父用户需求 
|  estimate  float  否  预计工时 
|  spec  string  否  用户需求描述 
|  category  int  否  类别(feature 功能 | interface 接口 | performance 性能 | safe 安全 | experience 体验 | improve 改进 | other 其他) 
|  source  string  否  来源(customer 客户 | user 用户 | po 产品经理 | market 市场 | service 客服 | operation 运营 | support 技术支持 | competitor 竞争对手 | partner 合作伙伴 | dev 开发人员 | tester 测试人员 | bug Bug | forum 论坛 | other 其他) 
|  verify  string  否  验收标准 
|  assignedTo  string  否  指派给 
|  reviewer  array  否  评审人，如果设置必须评审，必须填写

### 请求示例

```
{
    "productID": 1,
    "title": "智能头枕的颈椎保护",
    "pri": 3,
    "module": 0,
    "parent": 0,
    "estimate": 1,
    "category": "feature",
    "source": "customer",
    "assignedTo": "admin",
    "reviewer": [
        "productManager"
    ]
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败)

### 响应示例

```
{
    "status": "success"
}
```
