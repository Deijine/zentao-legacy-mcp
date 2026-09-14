# 修改产品

PUT/products/:productID

##  修改产品 

### 请求URL
https://xxx.com/api.php/v2/products/:productID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  name  string  是  产品名称 
|  program  int  否  所属项目集 
|  line  int  否  所属产品线 
|  type  string  否  类型(normal 正常 | branch 多分支 | platform 多平台) 
|  PO  string  否  产品负责人 
|  reviewer  array  否  评审人 
|  desc  array  否  产品描述 
|  QD  string  否  测试负责人 
|  RD  string  否  发布负责人 
|  acl  string  否  访问控制(open 公开 | private 私有)

### 请求示例

```
{
    "name": "智能照明",
    "program": 1,
    "line": 0,
    "type": "normal",
    "PO": "normal",
    "reviewer": [
        "productManager"
    ],
    "desc": "智能家庭照明",
    "QD": "productManager",
    "RD": "productManager",
    "acl": "open"
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
