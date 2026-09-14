# 创建测试单

POST/testtasks

##  创建测试单 

### 请求URL
https://xxx.com/api.php/v2/testtasks

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  productID  int  是  所属产品ID 
|  name  string  是  测试单名称 
|  build  int  是  提测构建/版本 
|  execution  int  否  所属执行 
|  type  array  否  类型(integrate 集成测试 | system 系统测试 | acceptance 验收测试 | performance 性能测试 | safety 安全测试) 
|  owner  string  否  负责人 
|  status  string  否  状态(wait 未开始 | doing 进行中 | done 已关闭 | blocked 被阻塞) 
|  begin  date  是  开始日期 
|  end  date  是  结束日期 
|  desc  string  否  描述

### 请求示例

```
{
    "productID": 1,
    "name": "智能家居V1.0测试单",
    "build": 1,
    "execution": 3,
    "type": [
        "integrate"
    ],
    "owner": "admin",
    "status": "wait",
    "begin": "2026-01-01",
    "end": "2026-02-01",
    "desc": "test"
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  id  int  ID

### 响应示例

```
{
    "status": "success",
    "id": 1
}
```
