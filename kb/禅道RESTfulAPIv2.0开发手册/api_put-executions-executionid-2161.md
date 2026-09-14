# 修改执行

PUT/executions/:executionID

##  修改执行 

### 请求URL
https://xxx.com/api.php/v2/executions/:executionID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  project  int  否  所属项目 
|  name  string  是  迭代名称 
|  lifetime  string  否  执行类型(short 短期 | long 长期 | ops 运维) 
|  begin  date  是  开始日期 
|  end  date  是  结束日期 
|  days  int  否  可用工作日 
|  products  array  否  关联产品 
|  plans  array  否  关联计划，必须是产品+planID的二维数组 
|  PO  string  否  产品负责人 
|  QD  string  否  测试负责人 
|  PM  string  否  执行负责人 
|  RD  string  否  发布负责人 
|  acl  string  否  访问控制(open 公开 | private 私有)

### 请求示例

```
{
    "project": 2,
    "name": "智能设备研发3.2版本开发",
    "lifetime": "short",
    "begin": "2026-01-01",
    "end": "2026-01-21",
    "days": 16,
    "products": [
        1
    ],
    "plans": {
        "1": [
            1
        ]
    },
    "PO": "productManager",
    "QD": "testManager",
    "PM": "executionManager",
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
